using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services.Exceptions;
using RiffForge.Server.Services.Interfaces;

namespace RiffForge.Server.Controllers
{
    [Route("api/songs")]
    [Authorize]
    [ApiController]
    public class SongsController : ControllerBase
    {
        private readonly RiffForgeDbContext _db;
        private readonly IChordProviderFactory _chordFactory;
        private readonly IChordResolverService _chordResolver;
        private readonly ILogger<SongsController> _logger;
        public SongsController(RiffForgeDbContext db, IChordProviderFactory chordFactory, IChordResolverService chordResolver, ILogger<SongsController> logger)
        {
            _db = db;
            _chordFactory = chordFactory;
            _logger = logger;
            _chordResolver = chordResolver;
        }

        // GET /api/songs/19
        [HttpGet("{id}")]
        public async Task<ActionResult<Song>> GetSong(int id, CancellationToken ct)
        {
            var song = await _db.Songs
    .Include(s => s.PrimaryArtist)
    .Include(s => s.Versions).ThenInclude(v => v.Chords)
    .FirstOrDefaultAsync(s => s.Id == id, ct);

            if (song == null) return NotFound();

            var defaultVersion = song.DefaultVersion;

            // Condition 1: No versions exist
            // Condition 2: TabData is missing bracketed chords e.g. [C]
            // Condition 3: Song or version is older than 7 days
            bool isStale = song.LastUpdated < DateTime.UtcNow.AddDays(-7);
            bool lacksChords = defaultVersion == null ||
                               string.IsNullOrWhiteSpace(defaultVersion.TabData) ||
                               !defaultVersion.TabData.Contains("[");

            if (lacksChords || isStale)
            {
                try
                {
                    await RefreshSongChordsAsync(song, ct);
                }
                catch (AllProvidersFailedException ex)
                {
                    _logger.LogWarning(ex, "Chord refresh failed for song {SongId}; serving existing (possibly stale) data instead.", song.Id);
                    // Fall through and return what we have — stale/missing chords beat a 500.
                }
            }
            song.Versions = song.Versions.Where(v => !v.IsUserSubmission).ToList();
            return Ok(song);
        }

        private async Task RefreshSongChordsAsync(Song song, CancellationToken ct)
        {
            GeminiChordResponse? generated = null;

            
            try
            {
                 generated = await _chordFactory.GenerateChordsAsync(
        song.PrimaryArtist.Name, song.Name, song.Lyrics, Difficulty.Intermediate,
        preferredProviderKey: null, apiKeyOverride: null, ct);
            }
            catch (HttpRequestException)
            {
                generated = null;
            }


            // Clear old AI-generated default versions if updating
            var existingVersions = song.Versions.Where(v => !v.IsUserSubmission).ToList();
            _db.SongVersions.RemoveRange(existingVersions);

            // 1. Add Original Accurate Version (IsDefault = true)
            var originalVer = new SongVersion
            {
                SongId = song.Id,
                TabData = generated.OriginalVersion.TabData,
                StrumPattern = generated.OriginalVersion.StrumPattern,
                Tuning = generated.OriginalVersion.Tuning,
                CapoPos = generated.OriginalVersion.CapoPos,
                Difficulty = generated.OriginalVersion.Difficulty,
                IsDefault = true,
                SourceName = "Gemini AI (Original Accurate)",
                DateScraped = DateTime.UtcNow,
                StructuredTabJson = generated.OriginalVersion.StructuredTab != null
                ? System.Text.Json.JsonSerializer.Serialize(generated.OriginalVersion.StructuredTab) : null
            };

            // 2. Add Simplified / Alternate Version
            var altVer = new SongVersion
            {
                SongId = song.Id,
                TabData = generated.AlternateVersion.TabData,
                StrumPattern = generated.AlternateVersion.StrumPattern,
                Tuning = generated.AlternateVersion.Tuning,
                CapoPos = generated.AlternateVersion.CapoPos,
                Difficulty = generated.AlternateVersion.Difficulty,
                IsDefault = false,
                SourceName = "Gemini AI (Simplified Alt)",
                DateScraped = DateTime.UtcNow,
                StructuredTabJson = generated.AlternateVersion.StructuredTab != null
    ? System.Text.Json.JsonSerializer.Serialize(generated.AlternateVersion.StructuredTab)
    : null
            };

            originalVer.Chords = await _chordResolver.ResolveChordsAsync(
    generated.OriginalVersion.ChordDefinitions, originalVer.Tuning, originalVer.Difficulty, ct);
            altVer.Chords = await _chordResolver.ResolveChordsAsync(
                generated.AlternateVersion.ChordDefinitions, altVer.Tuning, altVer.Difficulty, ct);
            _db.SongVersions.Add(originalVer);
            _db.SongVersions.Add(altVer);

            song.LastUpdated = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        

        
    }
}

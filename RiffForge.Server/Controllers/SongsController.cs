using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services.Interfaces;

namespace RiffForge.Server.Controllers
{
    [Route("api/songs")]
    [ApiController]
    public class SongsController : ControllerBase
    {
        private readonly RiffForgeDbContext _db;
        private readonly IGeminiChordService _geminiChords;
        public SongsController(RiffForgeDbContext db, IGeminiChordService geminiChords)
        {
            _db = db;
            _geminiChords = geminiChords;
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
                await RefreshSongChordsAsync(song, ct);
            }

            return Ok(song);
        }

        private async Task RefreshSongChordsAsync(Song song, CancellationToken ct)
        {
            var generated = await _geminiChords.GenerateChordsAsync(
                song.PrimaryArtist.Name,
                song.Name,
                song.Lyrics,
                Difficulty.Intermediate,
                ct);

            if (generated == null) return;

            // Clear old AI-generated default versions if updating
            var existingVersions = song.Versions.ToList();
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
                DateScraped = DateTime.UtcNow
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
                DateScraped = DateTime.UtcNow
            };

            originalVer.Chords = await ResolveChordsAsync(
    generated.OriginalVersion.ChordDefinitions, originalVer.Tuning, originalVer.Difficulty, ct);
            altVer.Chords = await ResolveChordsAsync(
                generated.AlternateVersion.ChordDefinitions, altVer.Tuning, altVer.Difficulty, ct);
            _db.SongVersions.Add(originalVer);
            _db.SongVersions.Add(altVer);

            song.LastUpdated = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        private static string Normalize(string input) =>
string.IsNullOrWhiteSpace(input) ? string.Empty : input.Trim().ToLowerInvariant();

        private async Task<List<Chord>> ResolveChordsAsync(
            List<ChordDefinition> defs, Tuning tuning, Difficulty difficulty, CancellationToken ct)
        {
            var chords = new List<Chord>();
            foreach (var def in defs)
            {
                var normName = Normalize(def.Name);
                var chord = await _db.Chords.FirstOrDefaultAsync(c => c.NormalizedName == normName, ct);

                if (chord == null)
                {
                    chord = new Chord
                    {
                        Name = def.Name,
                        NormalizedName = normName,
                        FretPositions = def.Frets,
                        IsBarreChord = def.IsBarre,
                        Tuning = tuning,
                        Difficulty = difficulty,
                        SourceName = "Gemini AI"
                    };
                    _db.Chords.Add(chord);
                    await _db.SaveChangesAsync(ct); // avoid duplicate inserts within the same request
                }
                else if (string.IsNullOrWhiteSpace(chord.FretPositions))
                {
                    chord.FretPositions = def.Frets; // backfill if we'd only seen the name before
                }

                chords.Add(chord);
            }
            return chords;
        }
    }
}

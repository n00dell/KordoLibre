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
    [Route("api/songs/{songId}/versions")]
    [Authorize]
    [ApiController]
    public class SongVersionsController : ControllerBase
    {
        private readonly RiffForgeDbContext _db;
        private readonly IChordProviderFactory _chordFactory;
        private readonly IChordResolverService _chordResolver;
        private readonly ILogger<SongVersionsController> _logger;

        public SongVersionsController(RiffForgeDbContext db, IChordProviderFactory chordFactory, ILogger<SongVersionsController> logger, IChordResolverService chordResolver)
        {
            _db = db;
            _chordFactory = chordFactory;
            _logger = logger;
            _chordResolver = chordResolver;
        }

        public record GenerateVersionRequest(NotationType NotationType, Difficulty? Difficulty = null);

        // POST /api/songs/5/versions/generate
        // Generates a version in a SPECIFIC notation (tab or chords-over-lyrics),
        // e.g. "this song only has a strum version, give me the fingerpicked tab
        // instead." Checks for an existing matching version first so the same
        // notation is never generated twice for the same song.
        [HttpPost("generate")]
        public async Task<ActionResult<SongVersion>> GenerateVersion(
            int songId, [FromBody] GenerateVersionRequest req, CancellationToken ct)
        {
            var song = await _db.Songs
                .Include(s => s.PrimaryArtist)
                .Include(s => s.Versions)
                .FirstOrDefaultAsync(s => s.Id == songId, ct);

            if (song is null) return NotFound("Song not found.");

            // Cache check — if we already generated this notation type, just hand it back.
            var existing = song.Versions.FirstOrDefault(v => v.NotationType == req.NotationType);
            if (existing != null) return Ok(existing);

            var difficulty = req.Difficulty ?? Difficulty.Intermediate;

            ChordArrangement arrangement;
            try
            {
                arrangement = await _chordFactory.GenerateSingleArrangementAsync(
                    song.PrimaryArtist.Name, song.Name, song.Lyrics, difficulty, req.NotationType,
                    preferredProviderKey: null, apiKeyOverride: null, ct);
            }
            catch (AllProvidersFailedException ex)
            {
                _logger.LogWarning(ex, "All AI providers failed generating a {NotationType} version for song {SongId}.",
                    req.NotationType, songId);
                return StatusCode(503, "Couldn't generate that arrangement right now — the AI provider(s) are unavailable. Try again shortly.");
            }

            var version = new SongVersion
            {
                SongId = song.Id,
                TabData = arrangement.TabData,
                StrumPattern = arrangement.StrumPattern,
                Tuning = arrangement.Tuning,
                CapoPos = arrangement.CapoPos,
                Difficulty = arrangement.Difficulty,
                NotationType = req.NotationType,
                // Only the very first version for a song should be the default;
                // anything generated afterward is an additional option the user
                // opted into, not the one that should auto-load.
                IsDefault = !song.Versions.Any(),
                SourceName = req.NotationType == NotationType.TabNotation
                    ? "Gemini AI (Tab, on-demand)"
                    : "Gemini AI (Chords, on-demand)",
                DateScraped = DateTime.UtcNow,
                Chords = await _chordResolver.ResolveChordsAsync(arrangement.ChordDefinitions, arrangement.Tuning, arrangement.Difficulty, ct)
            };

            _db.SongVersions.Add(version);
            await _db.SaveChangesAsync(ct);

            return Ok(version);
        }

        
    }
}

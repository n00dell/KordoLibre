using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services;
using RiffForge.Server.Services.Exceptions;
using RiffForge.Server.Services.Interfaces;
using RiffForge.Server.Services.Validation;

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
                    song.PrimaryArtist.Name, song.Name, difficulty, req.NotationType,
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
                ChordShapes = ChordResolverService.ToVersionLinks(
                    await _chordResolver.ResolveChordShapesAsync(arrangement.ChordDefinitions, arrangement.Tuning, arrangement.Difficulty, ct)),
                StructuredTabJson = arrangement.StructuredTab != null
    ? System.Text.Json.JsonSerializer.Serialize(arrangement.StructuredTab)
    : null,
            };

            _db.SongVersions.Add(version);
            await _db.SaveChangesAsync(ct);

            return Ok(version);
        }
        [HttpGet("submissions")]
public async Task<ActionResult<List<UserSubmission.UserSubmissionDto>>> GetSubmissions(int songId, CancellationToken ct)
{
    var submissions = await _db.SongVersions
        .Where(v => v.SongId == songId && v.IsUserSubmission)
        .OrderByDescending(v => v.Rating)
        .ThenByDescending(v => v.DateScraped)
        .ToListAsync(ct);

    var contributorIds = submissions
        .Where(s => s.ContributorUserId != null)
        .Select(s => s.ContributorUserId!)
        .Distinct()
        .ToList();

    var displayNames = await _db.UserProfiles
        .Where(p => contributorIds.Contains(p.UserId))
        .ToDictionaryAsync(p => p.UserId, p => p.DisplayName, ct);

    var result = submissions.Select(v => new UserSubmission.UserSubmissionDto
    {
        Id = v.Id,
        TabData = v.TabData ?? string.Empty,
        Tuning = v.Tuning.ToString(),
        CapoPos = v.CapoPos.ToString(),
        Difficulty = v.Difficulty.ToString(),
        StrumPattern = v.StrumPattern.ToString(),
        Rating = v.Rating,
        RatingCount = v.RatingCount,
        ContributorName = v.ContributorUserId != null
            && displayNames.TryGetValue(v.ContributorUserId, out var dn)
            && !string.IsNullOrWhiteSpace(dn)
                ? dn!
                : (v.ContributorName ?? "A fellow guitarist"),
        DateScraped = v.DateScraped
    }).ToList();

    return Ok(result);
}

// POST /api/songs/5/versions/submit
[HttpPost("submit")]
public async Task<ActionResult<UserSubmission.UserSubmissionDto>> Submit(int songId, [FromBody] UserSubmission.SubmitVersionRequest req, CancellationToken ct)
{
    var song = await _db.Songs.FirstOrDefaultAsync(s => s.Id == songId, ct);
    if (song is null) return NotFound("Song not found.");

    if (string.IsNullOrWhiteSpace(req.TabData))
        return BadRequest("Submission can't be empty.");
    if (!req.TabData.Contains('['))
        return BadRequest("Add at least one chord in [brackets], e.g. [C]Lyrics here.");

    if (!Enum.TryParse<Tuning>(req.Tuning, true, out var tuning))
        return BadRequest($"Invalid tuning: {req.Tuning}");
    if (!Enum.TryParse<CapoPos>(req.CapoPos, true, out var capoPos))
        return BadRequest($"Invalid capo position: {req.CapoPos}");
    if (!Enum.TryParse<Difficulty>(req.Difficulty, true, out var difficulty))
        return BadRequest($"Invalid difficulty: {req.Difficulty}");
    var strumPattern = ChordArrangementValidator.NormalizeStrumPattern(req.StrumPattern);

    var userId = GetUserId();
    if (userId is null) return Unauthorized();

    var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
    var contributorName = !string.IsNullOrWhiteSpace(profile?.DisplayName)
        ? profile!.DisplayName!
        : (User.FindFirstValue(ClaimTypes.Email) ?? "A fellow guitarist");

    // Same bracket convention as the AI versions — [Chord] right before the
    // syllable it's played on. We only need the names here; ChordDiagram/
    // lookupChordInfo on the frontend fills in the actual fret shape for
    // anything it recognizes.
    var chordNames = System.Text.RegularExpressions.Regex
        .Matches(req.TabData, @"\[([A-G][b#]?[\w#/]*)\]")
        .Select(m => m.Groups[1].Value)
        .Distinct()
        .ToList();

    if (req.ChordShapes.Any(cs => string.IsNullOrWhiteSpace(cs.Name) || string.IsNullOrWhiteSpace(cs.FretPositions)))
        return BadRequest("Each chord shape needs a name and fret positions.");

    var chordDefs = req.ChordShapes
        .GroupBy(cs => cs.Name, StringComparer.OrdinalIgnoreCase)
        .Select(g => g.First()) // dedupe same chord name sent twice
        .Select(cs => new ChordDefinition { Name = cs.Name, Frets = cs.FretPositions, IsBarre = cs.IsBarreChord })
        .ToList();
    var shapes = await _chordResolver.ResolveChordShapesAsync(chordDefs, tuning, difficulty, ct);

    var version = new SongVersion
    {
        SongId = song.Id,
        TabData = req.TabData.Length > 10000 ? req.TabData[..10000] : req.TabData,
        Tuning = tuning,
        CapoPos = capoPos,
        Difficulty = difficulty,
        StrumPattern = strumPattern,
        NotationType = NotationType.ChordsOverLyrics,
        IsDefault = false,
        IsUserSubmission = true,
        ContributorUserId = userId,
        ContributorName = contributorName,
        SourceName = "User submission",
        DateScraped = DateTime.UtcNow,
        ChordShapes = ChordResolverService.ToVersionLinks(shapes),
    };

    _db.SongVersions.Add(version);
    await _db.SaveChangesAsync(ct);

    return Ok(new UserSubmission.UserSubmissionDto
    {
        Id = version.Id,
        TabData = version.TabData ?? string.Empty,
        Tuning = version.Tuning.ToString(),
        CapoPos = version.CapoPos.ToString(),
        Difficulty = version.Difficulty.ToString(),
        StrumPattern = version.StrumPattern.ToString(),
        Rating = version.Rating,
        RatingCount = version.RatingCount,
        ContributorName = contributorName,
        DateScraped = version.DateScraped
    });
}
private string? GetUserId() =>
    User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name;



    }
}

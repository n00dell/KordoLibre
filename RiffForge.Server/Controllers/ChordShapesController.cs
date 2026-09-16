using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Services;
using RiffForge.Server.Services.Validation;

namespace RiffForge.Server.Controllers;
[Route("api/chords")]
[ApiController]
public class ChordShapesController : ControllerBase
{
    private readonly RiffForgeDbContext _db;
    public ChordShapesController(RiffForgeDbContext db) => _db = db;   
    
    public record ChordShapeDto(int Id, string FretPositions, bool IsBarreChord, string? ContributorName, int UpvoteCount, bool IsDefault);
    public record AddShapeRequest(string FretPositions, bool IsBarreChord);
    [HttpGet("{chordName}/shapes")]
    public async Task<ActionResult<List<ChordShapeDto>>> GetShapes(string chordName, CancellationToken ct)
    {
        var norm = ChordResolverService.Normalize(chordName);
        var chord = await _db.Chords.Include(c => c.Shapes)
            .FirstOrDefaultAsync(c => c.NormalizedName == norm, ct);
        if (chord == null) return Ok(new List<ChordShapeDto>());

        return Ok(chord.Shapes
            .OrderByDescending(s => s.UpvoteCount)
            .Select(s => new ChordShapeDto(s.Id, s.FretPositions, s.IsBarreChord, s.ContributorName, s.UpvoteCount, s.Id == chord.DefaultShapeId))
            .ToList());
    }
    [HttpPost("{chordName}/shapes")]
    public async Task<ActionResult<ChordShapeDto>> AddShape(string chordName, [FromBody] AddShapeRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.FretPositions)) return BadRequest("Fret positions required.");
        var frets = ChordArrangementValidator.NormalizeFrets(req.FretPositions);

        var norm = ChordResolverService.Normalize(chordName);
        var chord = await _db.Chords.Include(c => c.Shapes).FirstOrDefaultAsync(c => c.NormalizedName == norm, ct);
        if (chord == null)
        {
            chord = new Chord { Name = chordName, NormalizedName = norm };
            _db.Chords.Add(chord);
            await _db.SaveChangesAsync(ct);
        }

        var existing = chord.Shapes.FirstOrDefault(s => s.FretPositions == frets);
        if (existing != null)
            return Ok(new ChordShapeDto(existing.Id, existing.FretPositions, existing.IsBarreChord, existing.ContributorName, existing.UpvoteCount, existing.Id == chord.DefaultShapeId));

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name;
        var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);

        var shape = new ChordShape
        {
            ChordId = chord.Id,
            FretPositions = frets,
            IsBarreChord = req.IsBarreChord,
            ContributorUserId = userId,
            ContributorName = !string.IsNullOrWhiteSpace(profile?.DisplayName) ? profile!.DisplayName : "A fellow guitarist",
        };
        _db.ChordShapes.Add(shape);
        await _db.SaveChangesAsync(ct);

        return Ok(new ChordShapeDto(shape.Id, shape.FretPositions, shape.IsBarreChord, shape.ContributorName, 0, false));
    }
}
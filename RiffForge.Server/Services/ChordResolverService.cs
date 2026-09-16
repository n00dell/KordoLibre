using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services.Interfaces;
using RiffForge.Server.Services.Validation;

namespace RiffForge.Server.Services
{
    public class ChordResolverService : IChordResolverService
    {
        private readonly RiffForgeDbContext _db;
        public ChordResolverService(RiffForgeDbContext db) => _db = db;

        public static string Normalize(string input) =>
            string.IsNullOrWhiteSpace(input) ? string.Empty : input.Trim().ToLowerInvariant();

        // REPLACE the whole ResolveChordsAsync method with:
        public async Task<List<ChordShape>> ResolveChordShapesAsync(
            List<ChordDefinition> defs, Tuning tuning, Difficulty difficulty, CancellationToken ct)
        {
            var shapes = new List<ChordShape>();

            foreach (var def in defs)
            {
                var normName = Normalize(def.Name);
                var chord = await _db.Chords
                    .Include(c => c.Shapes)
                    .FirstOrDefaultAsync(c => c.NormalizedName == normName, ct);

                if (chord == null)
                {
                    chord = new Chord { Name = def.Name, NormalizedName = normName, Tuning = tuning };
                    _db.Chords.Add(chord);
                    await _db.SaveChangesAsync(ct); // need chord.Id before attaching a shape
                }

                var frets = ChordArrangementValidator.NormalizeFrets(def.Frets);
                var shape = chord.Shapes.FirstOrDefault(s => s.FretPositions == frets);

                if (shape == null)
                {
                    shape = new ChordShape
                    {
                        ChordId = chord.Id,
                        FretPositions = frets,
                        IsBarreChord = def.IsBarre,
                        Difficulty = difficulty,
                        ContributorName = "Gemini AI",
                    };
                    _db.ChordShapes.Add(shape);
                    await _db.SaveChangesAsync(ct);
                }

                chord.DefaultShapeId ??= shape.Id;
                shapes.Add(shape);
            }

            await _db.SaveChangesAsync(ct);
            return shapes;
        }

        // Turns resolved shapes into the join rows a SongVersion actually stores.
        public static List<SongVersionChordShape> ToVersionLinks(List<ChordShape> shapes) =>
            shapes.Select((s, i) => new SongVersionChordShape { ChordShapeId = s.Id, SortOrder = i }).ToList();
    }
}

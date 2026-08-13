using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services.Interfaces;

namespace RiffForge.Server.Services
{
    public class ChordResolverService : IChordResolverService
    {
        private readonly RiffForgeDbContext _db;
        public ChordResolverService(RiffForgeDbContext db) => _db = db;

        public static string Normalize(string input) =>
            string.IsNullOrWhiteSpace(input) ? string.Empty : input.Trim().ToLowerInvariant();

        public async Task<List<Chord>> ResolveChordsAsync(
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
                    await _db.SaveChangesAsync(ct);
                }
                else if (string.IsNullOrWhiteSpace(chord.FretPositions))
                {
                    chord.FretPositions = def.Frets;
                }
                chords.Add(chord);
            }
            return chords;
        }
    }
}

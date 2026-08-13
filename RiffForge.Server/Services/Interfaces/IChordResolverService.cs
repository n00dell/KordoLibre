using RiffForge.Server.Models;
using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;

namespace RiffForge.Server.Services.Interfaces
{
    public interface IChordResolverService
    {
        string Normalize(string input) =>
            string.IsNullOrWhiteSpace(input) ? string.Empty : input.Trim().ToLowerInvariant();
        Task<List<Chord>> ResolveChordsAsync(
           List<ChordDefinition> defs, Tuning tuning, Difficulty difficulty, CancellationToken ct);
    }
}

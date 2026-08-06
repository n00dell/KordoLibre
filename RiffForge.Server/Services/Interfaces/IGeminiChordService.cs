using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;

namespace RiffForge.Server.Services.Interfaces
{
    public interface IGeminiChordService
    {
        Task<GeminiChordResponse?> GenerateChordsAsync(
            string artist,
            string track,
            string? lyrics,
            Difficulty targetDifficulty,
            CancellationToken ct = default);
    }
}

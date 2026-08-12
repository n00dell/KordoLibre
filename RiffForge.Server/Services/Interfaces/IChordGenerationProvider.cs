using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;

namespace RiffForge.Server.Services.Interfaces
{
    public interface IChordGenerationProvider
    {
        // "gemini" | "claude" | later: "local-ollama" etc.
        string ProviderKey { get; }

        Task<GeminiChordResponse?> GenerateChordsAsync(
            string artist, string track, string? lyrics, Difficulty targetDifficulty,
            string? apiKeyOverride = null, CancellationToken ct = default);

        Task<ChordArrangement?> GenerateSingleArrangementAsync(
            string artist, string track, string? lyrics, Difficulty targetDifficulty,
            NotationType notationType, string? apiKeyOverride = null, CancellationToken ct = default);
    }
}


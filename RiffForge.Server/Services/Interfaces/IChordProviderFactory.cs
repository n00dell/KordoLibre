using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;

namespace RiffForge.Server.Services.Interfaces
{
    public interface IChordProviderFactory
    {
        Task<GeminiChordResponse> GenerateChordsAsync(
            string artist, string track, Difficulty difficulty,
            string? preferredProviderKey = null, string? apiKeyOverride = null, CancellationToken ct = default);

        Task<ChordArrangement> GenerateSingleArrangementAsync(
            string artist, string track, Difficulty difficulty, NotationType notationType,
            string? preferredProviderKey = null, string? apiKeyOverride = null, CancellationToken ct = default);
    }
}


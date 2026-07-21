using RiffForge.Server.Models.LastFm;

namespace RiffForge.Server.Services
{
    public interface ILastFmService
    {
        Task<List<LastFmTrackSummary>> SearchTracksAsync(string query, CancellationToken ct = default);
        Task<LastFmTrackDetail?> GetTrackInfoAsync(string artist, string track, CancellationToken ct = default);
    }
}

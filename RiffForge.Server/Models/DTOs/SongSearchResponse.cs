using RiffForge.Server.Models.LastFm;

namespace RiffForge.Server.Models.DTOs
{
    public record LocalSongMatch(int Id, string Name, string ArtistName, string? AlbumArtUrl);

    public class SongSearchResponse
    {
        public List<LocalSongMatch> LocalMatches { get; set; } = new();
        public List<LastFmTrackSummary> ExternalMatches { get; set; } = new();
    }
}

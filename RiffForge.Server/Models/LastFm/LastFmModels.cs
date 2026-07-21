namespace RiffForge.Server.Models.LastFm
{
    public class LastFmTrackSummary
    {
        public string Name { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int Listeners { get; set; }
    }

    // What we fetch once the user picks one, before we start scraping.
    public class LastFmTrackDetail
    {
        public string Name { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string? Album { get; set; }
        public string? ImageUrl { get; set; }
        public string? Summary { get; set; } // short bio/wiki text, NOT lyrics
        public List<string> Tags { get; set; } = new();
        public string? Url { get; set; } // last.fm page, useful as a fallback source link
    }

    // Raw shapes returned by ws.audioscrobbler.com — kept private to the service,
    // never sent to the frontend directly. Mapping raw->clean DTOs is a good habit:
    // it means if Last.fm changes their JSON shape, only this file needs to change.
    internal class LastFmSearchResponse
    {
        public LastFmResults? Results { get; set; }
    }
    internal class LastFmResults
    {
        public LastFmTrackMatches? TrackMatches { get; set; }
    }
    internal class LastFmTrackMatches
    {
        public List<LastFmRawTrack> Track { get; set; } = new();
    }
    internal class LastFmRawTrack
    {
        public string Name { get; set; } = string.Empty;
        public string Artist { get; set; } = string.Empty;
        public string Listeners { get; set; } = "0";
        public List<LastFmImage>? Image { get; set; }
    }
    internal class LastFmImage
    {
        public string Size { get; set; } = string.Empty;
        [System.Text.Json.Serialization.JsonPropertyName("#text")]
        public string Text { get; set; } = string.Empty;
    }
}

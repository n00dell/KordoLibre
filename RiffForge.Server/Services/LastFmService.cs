using RiffForge.Server.Models.LastFm;
using System.Text.Json;

namespace RiffForge.Server.Services
{
    public class LastFmService : ILastFmService
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;
        private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);
        //inject here rather than in Program.cs(prevents socket overload) so we can set the base address and api key in one place, and not have to worry about it elsewhere.
        public LastFmService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _http.BaseAddress = new Uri("https://ws.audioscrobbler.com/2.0/");
            _apiKey = config["LastFm:ApiKey"]
                ?? throw new InvalidOperationException("LastFm:ApiKey is not configured.");
        }

        public async Task<List<LastFmTrackSummary>> SearchTracksAsync(string query, CancellationToken ct = default)
        {
            var url = $"?method=track.search&track={Uri.EscapeDataString(query)}" +
                      $"&api_key={_apiKey}&format=json&limit=15";

            var response = await _http.GetFromJsonAsync<LastFmSearchResponse>(url, JsonOpts, ct);
            var rawTracks = response?.Results?.TrackMatches?.Track ?? new List<LastFmRawTrack>();

            return rawTracks
                .Select(t => new LastFmTrackSummary
                {
                    Name = t.Name,
                    Artist = t.Artist,
                    Listeners = int.TryParse(t.Listeners, out var l) ? l : 0,
                    // "extralarge" is the biggest size track.search gives you;
                    // full-res art usually needs album.getInfo, added later if needed.
                    ImageUrl = t.Image?.FirstOrDefault(i => i.Size == "extralarge")?.Text
                })
                .Where(t => !string.IsNullOrWhiteSpace(t.ImageUrl)) // drop the placeholder-only results
                .OrderByDescending(t => t.Listeners)
                .ToList();
        }

        public async Task<LastFmTrackDetail?> GetTrackInfoAsync(string artist, string track, CancellationToken ct = default)
        {
            var url = $"?method=track.getInfo&artist={Uri.EscapeDataString(artist)}" +
                      $"&track={Uri.EscapeDataString(track)}&api_key={_apiKey}&format=json";

            using var doc = JsonDocument.Parse(await _http.GetStringAsync(url, ct));
            if (!doc.RootElement.TryGetProperty("track", out var t)) return null;

            var album = t.TryGetProperty("album", out var a) ? a : default;
            var wiki = t.TryGetProperty("wiki", out var w) ? w : default;

            return new LastFmTrackDetail
            {
                Name = t.GetProperty("name").GetString() ?? track,
                Artist = t.GetProperty("artist").GetProperty("name").GetString() ?? artist,
                Album = album.ValueKind == JsonValueKind.Object ? album.GetProperty("title").GetString() : null,
                ImageUrl = album.ValueKind == JsonValueKind.Object
                    ? album.GetProperty("image").EnumerateArray().LastOrDefault().GetProperty("#text").GetString()
                    : null,
                Summary = wiki.ValueKind == JsonValueKind.Object ? wiki.GetProperty("summary").GetString() : null,
                Url = t.TryGetProperty("url", out var u) ? u.GetString() : null,
                Tags = t.TryGetProperty("toptags", out var tt) && tt.TryGetProperty("tag", out var tags)
                    ? tags.EnumerateArray().Select(x => x.GetProperty("name").GetString() ?? "").ToList()
                    : new List<string>()
            };
        }
    }
}

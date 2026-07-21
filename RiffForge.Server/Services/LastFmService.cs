using RiffForge.Server.Models.LastFm;
using RiffForge.Server.Services.Interfaces;
using System.Text.Json;

namespace RiffForge.Server.Services
{
    public class LastFmService : ILastFmService
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;
        private readonly IAlbumArtService _albumArtService;
        private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);
        //inject here rather than in Program.cs(prevents socket overload) so we can set the base address and api key in one place, and not have to worry about it elsewhere.
        public LastFmService(HttpClient http, IConfiguration config, IAlbumArtService albumArtService)
        {
            _http = http;
            _http.BaseAddress = new Uri("https://ws.audioscrobbler.com/2.0/");
            _apiKey = config["LastFm:ApiKey"]
                ?? throw new InvalidOperationException("LastFm:ApiKey is not configured.");
            _albumArtService = albumArtService;
        }

        public async Task<List<LastFmTrackSummary>> SearchTracksAsync(string query, CancellationToken ct = default)
        {
            var url = $"?method=track.search&track={Uri.EscapeDataString(query)}" +
                      $"&api_key={_apiKey}&format=json&limit=15";

            var response = await _http.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
                return new List<LastFmTrackSummary>();
            var tracks = await ParseLastFmSearchResultsAsync(response);

            // 2. Fetch iTunes artwork for all tracks in parallel
            var artTasks = tracks.Select(async track =>
            {
                var artUrl = await _albumArtService.GetCoverArtUrlAsync(track.Artist, track.Name);

                return new LastFmTrackSummary
                {
                    Name = track.Name,
                    Artist = track.Artist,
                    // Use iTunes art directly; fallback to Last.fm URL only if iTunes returns null
                    ImageUrl = artUrl ?? track.ImageUrl
                };
            });

            var enrichedResults = await Task.WhenAll(artTasks);
            return enrichedResults.ToList();
        }
        private static async Task<List<LastFmTrackSummary>> ParseLastFmSearchResultsAsync(HttpResponseMessage response)
        {
            var list = new List<LastFmTrackSummary>();

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

            // Last.fm wraps search results in: results -> trackmatches -> track
            if (!doc.RootElement.TryGetProperty("results", out var results) ||
                !results.TryGetProperty("trackmatches", out var trackmatches) ||
                !trackmatches.TryGetProperty("track", out var trackArray) ||
                trackArray.ValueKind != JsonValueKind.Array)
            {
                return list;
            }

            foreach (var t in trackArray.EnumerateArray())
            {
                var name = t.TryGetProperty("name", out var n) ? n.GetString() : null;
                var artist = t.TryGetProperty("artist", out var a) ? a.GetString() : null;

                if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(artist))
                    continue;

                // Try to read Last.fm's default image array as a fallback
                string? lastFmImage = null;
                if (t.TryGetProperty("image", out var imgArray) && imgArray.ValueKind == JsonValueKind.Array)
                {
                    // Fetch the largest available image from the array (usually index 2 or last)
                    lastFmImage = imgArray.EnumerateArray()
                        .LastOrDefault()
                        .TryGetProperty("#text", out var imgUrl) ? imgUrl.GetString() : null;
                }

                list.Add(new LastFmTrackSummary
                {
                    Name = name,
                    Artist = artist,
                    ImageUrl = string.IsNullOrWhiteSpace(lastFmImage) ? null : lastFmImage
                });
            }

            return list;
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

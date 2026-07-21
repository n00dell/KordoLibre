using RiffForge.Server.Services.Interfaces;
using System.Text.Json;

namespace RiffForge.Server.Services
{
    public class AlbumArtService : IAlbumArtService
    {
        private readonly HttpClient _http;

        public AlbumArtService(HttpClient http)
        {
            _http = http;
            // iTunes API requires a User-Agent header
            _http.DefaultRequestHeaders.UserAgent.ParseAdd("RiffForgeApp/1.0");
        }

        public async Task<string?> GetCoverArtUrlAsync(string artist, string track)
        {
            if (string.IsNullOrWhiteSpace(artist) || string.IsNullOrWhiteSpace(track))
                return null;

            // 1. Try iTunes API
            var itunesUrl = await FetchFromITunesAsync(artist, track);
            if (!string.IsNullOrWhiteSpace(itunesUrl)) return itunesUrl;

            // 2. Fallback: Try Deezer API (No auth required, great indie coverage)
            var deezerUrl = await FetchFromDeezerAsync(artist, track);
            if (!string.IsNullOrWhiteSpace(deezerUrl)) return deezerUrl;

            // 3. Fallback: Try MusicBrainz + Cover Art Archive
            var musicBrainzUrl = await FetchFromMusicBrainzAsync(artist, track);
            if (!string.IsNullOrWhiteSpace(musicBrainzUrl)) return musicBrainzUrl;

            return null;
        }
        // --- 1. iTunes Provider ---
        private async Task<string?> FetchFromITunesAsync(string artist, string track)
        {
            try
            {
                var query = Uri.EscapeDataString($"{artist} {track}");
                var url = $"https://itunes.apple.com/search?term={query}&entity=song&limit=1";

                var response = await _http.GetAsync(url);
                if (!response.IsSuccessStatusCode) return null;

                using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                var results = doc.RootElement.GetProperty("results");

                if (results.GetArrayLength() > 0)
                {
                    var artworkUrl = results[0].GetProperty("artworkUrl100").GetString();
                    return artworkUrl?.Replace("100x100bb", "600x600bb");
                }
            }
            catch { /* Ignore and allow next fallback */ }

            return null;
        }

        // --- 2. Deezer Provider ---
        private async Task<string?> FetchFromDeezerAsync(string artist, string track)
        {
            try
            {
                var query = Uri.EscapeDataString($"artist:\"{artist}\" track:\"{track}\"");
                var url = $"https://api.deezer.com/search?q={query}&limit=1";

                var response = await _http.GetAsync(url);
                if (!response.IsSuccessStatusCode) return null;

                using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                if (doc.RootElement.TryGetProperty("data", out var data) && data.GetArrayLength() > 0)
                {
                    var firstMatch = data[0];
                    if (firstMatch.TryGetProperty("album", out var album) &&
                        album.TryGetProperty("cover_big", out var cover))
                    {
                        var artworkUrl = cover.GetString();
                        if (!string.IsNullOrWhiteSpace(artworkUrl)) return artworkUrl;
                    }
                }
            }
            catch { /* Ignore and allow next fallback */ }

            return null;
        }

        // --- 3. MusicBrainz + Cover Art Archive Provider ---
        private async Task<string?> FetchFromMusicBrainzAsync(string artist, string track)
        {
            try
            {
                // Step A: Find the release MBID on MusicBrainz
                var query = Uri.EscapeDataString($"artist:\"{artist}\" AND release:\"{track}\"");
                var mbUrl = $"https://musicbrainz.org/ws/2/release/?query={query}&fmt=json&limit=1";

                var response = await _http.GetAsync(mbUrl);
                if (!response.IsSuccessStatusCode) return null;

                using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
                if (doc.RootElement.TryGetProperty("releases", out var releases) && releases.GetArrayLength() > 0)
                {
                    var mbid = releases[0].GetProperty("id").GetString();
                    if (string.IsNullOrWhiteSpace(mbid)) return null;

                    // Step B: Direct image redirect from Cover Art Archive
                    var caaUrl = $"https://coverartarchive.org/release/{mbid}/front-500";
                    var caaResponse = await _http.GetAsync(caaUrl, HttpCompletionOption.ResponseHeadersRead);

                    if (caaResponse.IsSuccessStatusCode)
                    {
                        return caaUrl;
                    }
                }
            }
            catch { /* Fallbacks exhausted */ }

            return null;
        }
    }
}

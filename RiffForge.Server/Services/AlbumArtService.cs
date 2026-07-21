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

                    // iTunes defaults to 100x100, but changing the URL string gets high-res 600x600!
                    return artworkUrl?.Replace("100x100bb", "600x600bb");
                }
            }
            catch
            {
                // Fallback gracefully if iTunes call fails
            }

            return null;
        }
    }
}

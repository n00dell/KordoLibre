using RiffForge.Server.Services.Interfaces;
using System.Text.Json;

namespace RiffForge.Server.Services
{
    public class LyricsService : ILyricsService
    {
        private readonly HttpClient _http;

        public LyricsService(HttpClient http)
        {
            _http = http;
            _http.BaseAddress = new Uri("https://api.lyrics.ovh/v1/");
        }
        public async Task<string?> GetLyricsAsync(string artist, string track, CancellationToken ct = default)
        {
            try
            {
                var url = $"{Uri.EscapeDataString(artist)}/{Uri.EscapeDataString(track)}";
                var response = await _http.GetAsync(url, ct);

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
                    if (doc.RootElement.TryGetProperty("lyrics", out var lyricsProp))
                    {
                        var text = lyricsProp.GetString();
                        if (!string.IsNullOrWhiteSpace(text)) return text;
                    }
                }
            }
            catch
            {
                // Fails silently so it doesn't crash the import process
            }

            // No fabricated placeholder — null means "we genuinely don't have lyrics",
            // which lyric search needs to be able to tell apart from real lyrics.
            return null;
        }
    }
}

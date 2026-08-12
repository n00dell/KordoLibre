using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services.Exceptions;
using RiffForge.Server.Services.Interfaces;
using System.Net;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace RiffForge.Server.Services
{
    public class GeminiChordService : IChordGenerationProvider
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        public string ProviderKey => "gemini";

        public GeminiChordService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["Gemini:ApiKey"] ?? string.Empty;
        }

        public async Task<ChordArrangement?> GenerateSingleArrangementAsync(
            string artist, string track, string? lyrics, Difficulty targetDifficulty,
            NotationType notationType, string? apiKeyOverride = null, CancellationToken ct = default)
        {
            var key = ResolveKey(apiKeyOverride);

            var formatInstruction = notationType == NotationType.TabNotation
                ? @"Produce this as standard ASCII guitar tablature (one line per
string, e|B|G|D|A|E, using '-' for rests and fret numbers for notes),
representing a fingerpicked or instrumental arrangement of the song.
Set 'notationType' to 1. Put the tab in 'tabData'."
                : @"Produce this as chords embedded directly into the lyrics: insert
bracketed chord names in line with the text immediately before the
syllable/word where the chord change happens, e.g.
'[C]I can't be the one to tell you that you're [G]wrong'.
This should be a strummed chord arrangement suited to accompanying the
vocal. Set 'notationType' to 0. Put the bracketed lyrics in 'tabData'.";

            var prompt = $@"
You are an expert musicologist, guitar transcriber, and instructor.
Transcribe accurate guitar chords/tab for:
Song: '{track}'
Artist: '{artist}'
Target player level: {targetDifficulty}
 
{formatInstruction}
 
Use the ORIGINAL RECORDED SONG's key, real chord voicings/notes, tuning,
and capo if used — this must be an authentic transcription, not simplified,
unless the target player level requires substituting easier voicings.
 
For each chord in 'chordDefinitions', set 'isBarre' to true only if the
voicing requires one finger to fret multiple strings at the same fret (a
true barre shape), not just because the chord starts above fret 0.
 
Base Lyrics (for timing/structure reference only):
{lyrics ?? "Use exact song lyrics."}";

            var requestBody = new
            {
                contents = new[] { new { parts = new[] { new { text = prompt } } } },
                generationConfig = new { responseMimeType = "application/json", responseSchema = GetSingleArrangementSchema() }
            };

            var url = BuildUrl(key);
            var rawText = await PostAndExtractTextAsync(url, requestBody, ct);
            if (rawText == null) return null;

            return Deserialize<ChordArrangement>(rawText);
        }

        public async Task<GeminiChordResponse?> GenerateChordsAsync(
            string artist, string track, string? lyrics, Difficulty targetDifficulty,
            string? apiKeyOverride = null, CancellationToken ct = default)
        {
            var key = ResolveKey(apiKeyOverride);

            var prompt = $@"
You are an expert musicologist, guitar transcriber, and instructor.
Transcribe and generate accurate guitar chords embedded directly into the lyrics for:
Song: '{track}'
Artist: '{artist}'

Requirements:
1. 'EstimatedBpm': Your best estimate of the song's actual tempo in beats per
   minute, based on its genre, feel, and known recording (a whole number,
   typically between 60 and 200).
2. 'OriginalVersion' (IsDefault): Must be an accurate, authentic chord transcription matching the ORIGINAL RECORDED SONG (exact key, real chord voicings, tuning, and capo if used).
3. 'AlternateVersion': An alternative arrangement tailored for a {targetDifficulty} player (e.g., if original uses difficult barre chords, use open chords with a capo; if original is simple, provide an advanced version).
4. 'TabData' formatting: You MUST insert bracketed chord names directly in line with the text immediately before the syllable/word where the chord change happens.
   Example output for TabData:
   [C]I can't be the one to tell you that you're [G]wrong
   [Am]I can only say how I feel when you're [F]gone

5. Map Enums to Integers:
   - Difficulty: Beginner=0, Easy=1, Intermediate=2, Advanced=3, Expert=4
   - CapoPos: None=0, 1st=1, 2nd=2, 3rd=3, 4th=4, 5th=5, 6th=6, 7th=7...
   - Tuning: Standard=0, DropD=1, HalfStepDown=2...
   - StrumPattern: DownDownUp=0...
6. For each chord in 'chordDefinitions', set 'isBarre' to true only if the voicing
   requires one finger to fret multiple strings at the same fret (a true barre
   shape), not just because the chord starts above fret 0.
7. Set 'notationType' to 1 (tab notation) if this song/arrangement is primarily
   fingerpicked or instrumental and is best represented as six-line ASCII guitar
   tablature. Otherwise set it to 0 (chords inline above/within the lyrics, using
   the bracket format described above). If notationType is 1, 'tabData' should
   contain standard ASCII tab (one line per string, e|B|G|D|A|E, using '-' for
   rests and fret numbers for notes) instead of bracketed lyrics.
Base Lyrics to embed chords into:
{lyrics ?? "Use exact song lyrics."}";

            var requestBody = new
            {
                contents = new[] { new { parts = new[] { new { text = prompt } } } },
                generationConfig = new { responseMimeType = "application/json", responseSchema = GetArrangementSchema() }
            };

            var url = BuildUrl(key);
            var rawText = await PostAndExtractTextAsync(url, requestBody, ct);
            if (rawText == null) return null;

            return Deserialize<GeminiChordResponse>(rawText);
        }

        // ---- shared plumbing ----

        private string ResolveKey(string? apiKeyOverride)
        {
            var key = !string.IsNullOrWhiteSpace(apiKeyOverride) ? apiKeyOverride : _apiKey;
            if (string.IsNullOrWhiteSpace(key))
                throw new ProviderAuthException(ProviderKey, "No Gemini API key configured (server default or user override).");
            return key.Trim();
        }

        private string BuildUrl(string key) =>
            $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={key}";

        private async Task<string?> PostAndExtractTextAsync(string url, object requestBody, CancellationToken ct)
        {
            HttpResponseMessage response;
            try
            {
                response = await PostWithRetryAsync(url, requestBody, ct);
            }
            catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
            {
                throw new ProviderUnavailableException(ProviderKey, "Gemini API request timed out.", ex);
            }
            catch (HttpRequestException ex)
            {
                throw new ProviderUnavailableException(ProviderKey, "Could not reach the Gemini API.", ex);
            }

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct);
                switch (response.StatusCode)
                {
                    case HttpStatusCode.Unauthorized:
                    case HttpStatusCode.Forbidden:
                        throw new ProviderAuthException(ProviderKey, "Gemini API rejected the API key.");
                    case HttpStatusCode.TooManyRequests:
                        throw new ProviderQuotaExceededException(ProviderKey, "Gemini API rate limit / quota exceeded.");
                    case HttpStatusCode.ServiceUnavailable:
                    case HttpStatusCode.GatewayTimeout:
                        throw new ProviderUnavailableException(ProviderKey, $"Gemini API unavailable ({response.StatusCode}).");
                    default:
                        throw new ProviderInvalidResponseException(ProviderKey, $"Gemini API error [{response.StatusCode}]: {errorBody}");
                }
            }

            try
            {
                var jsonContent = await response.Content.ReadAsStringAsync(ct);
                using var doc = JsonDocument.Parse(jsonContent);
                return doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();
            }
            catch (Exception ex) when (ex is JsonException or KeyNotFoundException or IndexOutOfRangeException)
            {
                throw new ProviderInvalidResponseException(ProviderKey, "Unexpected Gemini response shape.", ex);
            }
        }

        private T? Deserialize<T>(string rawText) where T : class
        {
            try
            {
                return JsonSerializer.Deserialize<T>(rawText, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    Converters = { new JsonStringEnumConverter() }
                });
            }
            catch (JsonException ex)
            {
                throw new ProviderInvalidResponseException(ProviderKey, "Gemini returned malformed JSON.", ex);
            }
        }

        private static JsonObject GetSingleArrangementSchema() => new()
        {
            ["type"] = "OBJECT",
            ["properties"] = new JsonObject
            {
                ["tabData"] = new JsonObject { ["type"] = "STRING" },
                ["strumPattern"] = new JsonObject { ["type"] = "INTEGER" },
                ["tuning"] = new JsonObject { ["type"] = "INTEGER" },
                ["capoPos"] = new JsonObject { ["type"] = "INTEGER" },
                ["difficulty"] = new JsonObject { ["type"] = "INTEGER" },
                ["notationType"] = new JsonObject { ["type"] = "INTEGER" },
                ["chordDefinitions"] = new JsonObject
                {
                    ["type"] = "ARRAY",
                    ["items"] = new JsonObject
                    {
                        ["type"] = "OBJECT",
                        ["properties"] = new JsonObject
                        {
                            ["name"] = new JsonObject { ["type"] = "STRING" },
                            ["frets"] = new JsonObject { ["type"] = "STRING" },
                            ["isBarre"] = new JsonObject { ["type"] = "BOOLEAN" }
                        },
                        ["required"] = new JsonArray { "name", "frets", "isBarre" }
                    }
                }
            },
            ["required"] = new JsonArray { "tabData", "strumPattern", "tuning", "capoPos", "difficulty", "notationType", "chordDefinitions" }
        };

        private static JsonObject GetArrangementSchema()
        {
            JsonObject BuildArrangement() => new JsonObject
            {
                ["type"] = "OBJECT",
                ["properties"] = new JsonObject
                {
                    ["tabData"] = new JsonObject { ["type"] = "STRING" },
                    ["strumPattern"] = new JsonObject { ["type"] = "INTEGER" },
                    ["tuning"] = new JsonObject { ["type"] = "INTEGER" },
                    ["capoPos"] = new JsonObject { ["type"] = "INTEGER" },
                    ["difficulty"] = new JsonObject { ["type"] = "INTEGER" },
                    ["notationType"] = new JsonObject { ["type"] = "INTEGER" },
                    ["chordDefinitions"] = new JsonObject
                    {
                        ["type"] = "ARRAY",
                        ["items"] = new JsonObject
                        {
                            ["type"] = "OBJECT",
                            ["properties"] = new JsonObject
                            {
                                ["name"] = new JsonObject { ["type"] = "STRING" },
                                ["frets"] = new JsonObject { ["type"] = "STRING" },
                                ["isBarre"] = new JsonObject { ["type"] = "BOOLEAN" }
                            },
                            ["required"] = new JsonArray { "name", "frets", "isBarre" }
                        }
                    }
                },
                ["required"] = new JsonArray { "tabData", "strumPattern", "tuning", "capoPos", "difficulty", "notationType", "chordDefinitions" }
            };

            return new JsonObject
            {
                ["type"] = "OBJECT",
                ["properties"] = new JsonObject
                {
                    ["estimatedBpm"] = new JsonObject { ["type"] = "INTEGER" },
                    ["originalVersion"] = BuildArrangement(),
                    ["alternateVersion"] = BuildArrangement()
                },
                ["required"] = new JsonArray { "estimatedBpm", "originalVersion", "alternateVersion" }
            };
        }

        private static readonly HttpStatusCode[] TransientStatuses =
        { HttpStatusCode.ServiceUnavailable, HttpStatusCode.TooManyRequests, HttpStatusCode.GatewayTimeout };

        private async Task<HttpResponseMessage> PostWithRetryAsync(string url, object body, CancellationToken ct)
        {
            const int maxAttempts = 3;
            HttpResponseMessage? response = null;

            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                response = await _httpClient.PostAsJsonAsync(url, body, ct);
                if (response.IsSuccessStatusCode || !TransientStatuses.Contains(response.StatusCode))
                    return response;

                if (attempt < maxAttempts)
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)), ct); // 2s, 4s
            }

            return response!;
        }
    }
}

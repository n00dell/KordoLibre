using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services.Interfaces;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace RiffForge.Server.Services
{
    public class GeminiChordService : IGeminiChordService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        public GeminiChordService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["Gemini:ApiKey"]
                ?? throw new InvalidOperationException("Gemini API key is missing.");
        }
        public async Task<GeminiChordResponse?> GenerateChordsAsync(
            string artist,
            string track,
            string? lyrics,
            Difficulty targetDifficulty,
            CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                throw new InvalidOperationException("Gemini API key is empty. Check your secrets.json configuration.");
            }


            var prompt = $@"
You are an expert musicologist, guitar transcriber, and instructor.
Transcribe and generate accurate guitar chords embedded directly into the lyrics for:
Song: '{track}'
Artist: '{artist}'

Requirements:
1. 'OriginalVersion' (IsDefault): Must be an accurate, authentic chord transcription matching the ORIGINAL RECORDED SONG (exact key, real chord voicings, tuning, and capo if used).
2. 'AlternateVersion': An alternative arrangement tailored for a {targetDifficulty} player (e.g., if original uses difficult barre chords, use open chords with a capo; if original is simple, provide an advanced version).
3. 'TabData' formatting: You MUST insert bracketed chord names directly in line with the text immediately before the syllable/word where the chord change happens.
   Example output for TabData:
   [C]I can't be the one to tell you that you're [G]wrong
   [Am]I can only say how I feel when you're [F]gone

4. Map Enums to Integers:
   - Difficulty: Beginner=0, Easy=1, Intermediate=2, Advanced=3, Expert=4
   - CapoPos: None=0, 1st=1, 2nd=2, 3rd=3, 4th=4, 5th=5, 6th=6, 7th=7...
   - Tuning: Standard=0, DropD=1, HalfStepDown=2...
   - StrumPattern: DownDownUp=0...
5. For each chord in 'chordDefinitions', set 'isBarre' to true only if the voicing
   requires one finger to fret multiple strings at the same fret (a true barre
   shape), not just because the chord starts above fret 0.
6. Set 'notationType' to 1 (tab notation) if this song/arrangement is primarily
   fingerpicked or instrumental and is best represented as six-line ASCII guitar
   tablature. Otherwise set it to 0 (chords inline above/within the lyrics, using
   the bracket format described above). If notationType is 1, 'tabData' should
   contain standard ASCII tab (one line per string, e|B|G|D|A|E, using '-' for
   rests and fret numbers for notes) instead of bracketed lyrics.
Base Lyrics to embed chords into:
{lyrics ?? "Use exact song lyrics."}";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json",
                    responseSchema = GetArrangementSchema()
                }
            };
            var cleanApiKey = _apiKey.Trim();
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={cleanApiKey}";
            var response = await _httpClient.PostAsJsonAsync(url, requestBody, ct);

            if (!response.IsSuccessStatusCode)
            {
                // Read the exact error details sent back by Gemini
                var errorResponseBody = await response.Content.ReadAsStringAsync(ct);
                throw new HttpRequestException(
                    $"Gemini API Error [{response.StatusCode}]: {errorResponseBody}");
            }

            var jsonContent = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(jsonContent);

            var rawText = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrEmpty(rawText)) return null;


            var result = JsonSerializer.Deserialize<GeminiChordResponse>(rawText, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Converters = { new JsonStringEnumConverter() }
            });

            if (result?.OriginalVersion == null || result.AlternateVersion == null)
            {
                throw new InvalidOperationException(
                    $"Gemini response missing expected fields. Raw response: {rawText}");
            }

            return result;

        }

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
                ["required"] = new JsonArray
        {
            "tabData", "strumPattern", "tuning", "capoPos", "difficulty", "notationType", "chordDefinitions"
        }
            };

            return new JsonObject
            {
                ["type"] = "OBJECT",
                ["properties"] = new JsonObject
                {
                    ["originalVersion"] = BuildArrangement(),
                    ["alternateVersion"] = BuildArrangement()
                },
                ["required"] = new JsonArray { "originalVersion", "alternateVersion" }
            };
        }

        //private static object GetArrangementSchema()
        //{
        //    return new
        //    {
        //        type = "OBJECT",
        //        properties = new
        //        {
        //            TabData = new { type = "STRING" },
        //            StrumPattern = new { type = "INTEGER" },
        //            Tuning = new { type = "INTEGER" },
        //            CapoPos = new { type = "INTEGER" },
        //            Difficulty = new { type = "INTEGER" }
        //        },
        //        required = new[] { "TabData", "StrumPattern", "Tuning", "CapoPos", "Difficulty" }
        //    };
        //}
    }
}

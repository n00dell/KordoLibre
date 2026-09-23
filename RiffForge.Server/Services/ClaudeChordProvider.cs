using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services.Exceptions;
using RiffForge.Server.Services.Interfaces;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace RiffForge.Server.Services
{
    public class ClaudeChordProvider : IChordGenerationProvider
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;
        private const string AnthropicVersion = "2023-06-01";
        private const string Endpoint = "https://api.anthropic.com/v1/messages";

        public string ProviderKey => "claude";

        public ClaudeChordProvider(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["Claude:ApiKey"] ?? string.Empty;
            _model = config["Claude:Model"] ?? "claude-haiku-4-5-20251001";
        }

        public async Task<GeminiChordResponse?> GenerateChordsAsync(
            string artist, string track, Difficulty targetDifficulty,
            string? apiKeyOverride = null, CancellationToken ct = default)
        {
            var key = ResolveKey(apiKeyOverride);

            var prompt = $@"
You are an expert musicologist and guitar transcriber.
Determine the accurate chord progression for:
Song: '{track}'
Artist: '{artist}'

Requirements:
1. 'estimatedBpm': Your best estimate of the song's actual tempo in beats per
   minute, based on its genre, feel, and known recording (whole number,
   typically 60-200).
2. 'originalVersion' (IsDefault): An accurate, authentic chord progression
   matching the ORIGINAL RECORDED SONG (exact key, real chord voicings,
   tuning, capo if used).
3. 'alternateVersion': An alternative arrangement tailored for an
   intermediate player (e.g. if the original uses difficult barre chords,
   use open chords with a capo; if the original is simple, provide a more
   advanced version).
4. 'tabData' formatting — DO NOT include any song lyrics or text of any
   kind. Organize the progression by song section. For each section, put
   the section name on its own line prefixed with '##' (e.g. '##Verse 1'),
   followed by one line of bracketed chord names in the order they're
   played, e.g. '[C][G][Am][F]'. Repeat a chord for repeated bars if the
   rhythm matters (e.g. '[C][C][G][G]'). Example:
   ##Verse 1
   [C][G][Am][F]
   ##Chorus
   [F][C][G][G]
5. For each chord in 'chordDefinitions', set 'isBarre' to true only if the
   voicing requires one finger to fret multiple strings at the same fret (a
   true barre shape), not just because the chord starts above fret 0.
6. Set 'notationType' to 1 (tab) if this song/arrangement is primarily
   fingerpicked or instrumental and is best represented as six-line ASCII
   guitar tablature (one line per string, e|B|G|D|A|E, '-' for rests, fret
   numbers for notes). Otherwise set it to 0 (the bracketed, section-organized
   chord progression described in requirement 4).
7. If notationType is 1 (tab), ALSO populate structuredTab: break the tab
   into sections by song part (Intro, Verse, Chorus, etc.), each with a
   columns array where each column is one rhythmic position and has a frets
   array of exactly 6 integers ordered low string (6th/E) to high string
   (1st/e), using -1 for a string not played in that column. Keep tabData
   populated too as a plain-text fallback of the same tab.";

            var body = BuildToolCallBody(prompt, GetFullArrangementToolSchema());
            var rawJson = await SendAndExtractToolInputAsync(body, key, ct);
            if (rawJson == null) return null;

            return Deserialize<GeminiChordResponse>(rawJson);
        }

        public async Task<ChordArrangement?> GenerateSingleArrangementAsync(
            string artist, string track, Difficulty targetDifficulty,
            NotationType notationType, string? apiKeyOverride = null, CancellationToken ct = default)
        {
            var key = ResolveKey(apiKeyOverride);

            var formatInstruction = notationType == NotationType.TabNotation
                ? @"Produce this as standard ASCII guitar tablature (one line per string,
e|B|G|D|A|E, using '-' for rests and fret numbers for notes), representing a
fingerpicked or instrumental arrangement of the song. Set 'notationType' to 1.
Put the tab in 'tabData'."
                : @"Produce ONLY the chord progression — do NOT include any lyrics or song
text. Organize it by song section. For each section, put the section name on
its own line prefixed with '##' (e.g. '##Verse 1'), followed by one line of
bracketed chord names in the order they're played, e.g. '[C][G][Am][F]'.
Repeat a chord for repeated bars if the rhythm matters (e.g. '[C][C][G][G]').
Set 'notationType' to 0. Put this chord-only structure in 'tabData'.";

            var prompt = $@"
You are an expert musicologist and guitar transcriber.
Determine the accurate chord progression for:
Song: '{track}'
Artist: '{artist}'
Target player level: {targetDifficulty}

{formatInstruction}

Use the ORIGINAL RECORDED SONG's key, real chord voicings/notes, tuning, and
capo if used — this must be an authentic transcription, not simplified,
unless the target player level requires substituting easier voicings.

For each chord in 'chordDefinitions', set 'isBarre' to true only if the
voicing requires one finger to fret multiple strings at the same fret (a
true barre shape), not just because the chord starts above fret 0.";

            var body = BuildToolCallBody(prompt, GetSingleArrangementToolSchema());
            var rawJson = await SendAndExtractToolInputAsync(body, key, ct);
            return rawJson == null ? null : Deserialize<ChordArrangement>(rawJson);
        }

        // ---- shared plumbing (unchanged from your current file) ----

        private string ResolveKey(string? apiKeyOverride)
        {
            var key = !string.IsNullOrWhiteSpace(apiKeyOverride) ? apiKeyOverride : _apiKey;
            if (string.IsNullOrWhiteSpace(key))
                throw new ProviderAuthException(ProviderKey, "No Claude API key configured (server default or user override).");
            return key.Trim();
        }

        private object BuildToolCallBody(string prompt, JsonObject inputSchema) => new
        {
            model = _model,
            max_tokens = 4000,
            tools = new object[]
            {
                new
                {
                    name = "emit_chord_arrangement",
                    description = "Return the transcribed guitar chord arrangement in the exact required structure.",
                    input_schema = inputSchema
                }
            },
            tool_choice = new { type = "tool", name = "emit_chord_arrangement" },
            messages = new object[]
            {
                new { role = "user", content = prompt }
            }
        };

        private async Task<string?> SendAndExtractToolInputAsync(object body, string apiKey, CancellationToken ct)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
            {
                Content = JsonContent.Create(body)
            };
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", AnthropicVersion);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            HttpResponseMessage response;
            try
            {
                response = await PostWithRetryAsync(request, ct);
            }
            catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
            {
                throw new ProviderUnavailableException(ProviderKey, "Claude API request timed out.", ex);
            }
            catch (HttpRequestException ex)
            {
                throw new ProviderUnavailableException(ProviderKey, "Could not reach the Claude API.", ex);
            }

            var responseBody = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                switch (response.StatusCode)
                {
                    case HttpStatusCode.Unauthorized:
                    case HttpStatusCode.Forbidden:
                        throw new ProviderAuthException(ProviderKey, "Claude API rejected the API key.");
                    case HttpStatusCode.TooManyRequests:
                        throw new ProviderQuotaExceededException(ProviderKey, "Claude API rate limit / quota exceeded.");
                    case HttpStatusCode.ServiceUnavailable:
                    case HttpStatusCode.GatewayTimeout:
                    case HttpStatusCode.BadGateway:
                        throw new ProviderUnavailableException(ProviderKey, $"Claude API unavailable ({response.StatusCode}).");
                    default:
                        throw new ProviderInvalidResponseException(
                            ProviderKey, $"Claude API error [{response.StatusCode}]: {responseBody}");
                }
            }

            try
            {
                using var doc = JsonDocument.Parse(responseBody);

                if (doc.RootElement.TryGetProperty("stop_reason", out var stopReasonEl) &&
                    stopReasonEl.GetString() == "max_tokens")
                {
                    throw new ProviderInvalidResponseException(ProviderKey, "Claude ran out of tokens before finishing the arrangement.");
                }

                var content = doc.RootElement.GetProperty("content");
                foreach (var block in content.EnumerateArray())
                {
                    if (block.TryGetProperty("type", out var typeEl) && typeEl.GetString() == "tool_use")
                    {
                        return block.GetProperty("input").GetRawText();
                    }
                }

                throw new ProviderInvalidResponseException(ProviderKey, "Claude response contained no tool_use block.");
            }
            catch (JsonException ex)
            {
                throw new ProviderInvalidResponseException(ProviderKey, "Claude response was not valid JSON.", ex);
            }
        }

        private static readonly HttpStatusCode[] TransientStatuses =
        {
            HttpStatusCode.ServiceUnavailable, HttpStatusCode.TooManyRequests,
            HttpStatusCode.GatewayTimeout, HttpStatusCode.BadGateway
        };

        private async Task<HttpResponseMessage> PostWithRetryAsync(HttpRequestMessage request, CancellationToken ct)
        {
            const int maxAttempts = 3;
            HttpResponseMessage? response = null;

            for (int attempt = 1; attempt <= maxAttempts; attempt++)
            {
                var attemptRequest = attempt == 1 ? request : await CloneRequestAsync(request);
                response = await _httpClient.SendAsync(attemptRequest, ct);

                if (response.IsSuccessStatusCode || !TransientStatuses.Contains(response.StatusCode))
                    return response;

                if (attempt < maxAttempts)
                    await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)), ct);
            }

            return response!;
        }

        private static async Task<HttpRequestMessage> CloneRequestAsync(HttpRequestMessage original)
        {
            var clone = new HttpRequestMessage(original.Method, original.RequestUri);
            if (original.Content != null)
            {
                var bytes = await original.Content.ReadAsByteArrayAsync();
                clone.Content = new ByteArrayContent(bytes);
                foreach (var header in original.Content.Headers)
                    clone.Content.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
            foreach (var header in original.Headers)
                clone.Headers.TryAddWithoutValidation(header.Key, header.Value);
            return clone;
        }

        private T? Deserialize<T>(string json) where T : class
        {
            try
            {
                return JsonSerializer.Deserialize<T>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    Converters = { new JsonStringEnumConverter() }
                });
            }
            catch (JsonException ex)
            {
                throw new ProviderInvalidResponseException(ProviderKey, "Could not deserialize Claude's tool input.", ex);
            }
        }

        // ---- schemas (unchanged) ----

        private static JsonObject BuildArrangementSchema() => new()
        {
            ["structuredTab"] = new JsonObject
            {
                ["type"] = "object",
                ["properties"] = new JsonObject
                {
                    ["sections"] = new JsonObject
                    {
                        ["type"] = "array",
                        ["items"] = new JsonObject
                        {
                            ["type"] = "object",
                            ["properties"] = new JsonObject
                            {
                                ["label"] = new JsonObject { ["type"] = "string" },
                                ["columns"] = new JsonObject
                                {
                                    ["type"] = "array",
                                    ["items"] = new JsonObject
                                    {
                                        ["type"] = "object",
                                        ["properties"] = new JsonObject
                                        {
                                            ["frets"] = new JsonObject { ["type"] = "array", ["items"] = new JsonObject { ["type"] = "integer" } }
                                        },
                                        ["required"] = new JsonArray { "frets" }
                                    }
                                }
                            },
                            ["required"] = new JsonArray { "columns" }
                        }
                    }
                }
            }
        };

        private static JsonObject GetSingleArrangementToolSchema() => BuildArrangementSchema();

        private static JsonObject GetFullArrangementToolSchema() => new()
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["estimatedBpm"] = new JsonObject { ["type"] = "integer" },
                ["originalVersion"] = BuildArrangementSchema(),
                ["alternateVersion"] = BuildArrangementSchema()
            },
            ["required"] = new JsonArray { "estimatedBpm", "originalVersion", "alternateVersion" }
        };
    }
}
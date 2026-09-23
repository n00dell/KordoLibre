using Microsoft.Extensions.Options;
using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services.Exceptions;
using RiffForge.Server.Services.Interfaces;
using RiffForge.Server.Services.Validation;

namespace RiffForge.Server.Services
{
    public class AiSettings
    {
        public string DefaultProvider { get; set; } = "gemini";
        public List<string> FallbackProviders { get; set; } = new() { "claude" };
    }
    public class ChordProviderFactory : IChordProviderFactory
    {
        private readonly Dictionary<string, IChordGenerationProvider> _providers;
        private readonly IOptionsMonitor<AiSettings> _settings;
        private readonly ChordArrangementValidator _validator;
        private readonly ILogger<ChordProviderFactory> _logger;

        public ChordProviderFactory(
            IEnumerable<IChordGenerationProvider> providers,
            IOptionsMonitor<AiSettings> settings,
            ChordArrangementValidator validator,
            ILogger<ChordProviderFactory> logger)
        {
            _providers = providers.ToDictionary(p => p.ProviderKey, StringComparer.OrdinalIgnoreCase);
            _settings = settings;
            _validator = validator;
            _logger = logger;
        }

        private IEnumerable<IChordGenerationProvider> ResolveProviderChain(string? preferredProviderKey)
        {
            if (!string.IsNullOrWhiteSpace(preferredProviderKey))
            {
                if (!_providers.TryGetValue(preferredProviderKey, out var provider))
                    throw new ProviderAuthException(preferredProviderKey, $"Unknown or unconfigured provider '{preferredProviderKey}'.");
                return new[] { provider }; // explicit choice — no fallback chain
            }

            var s = _settings.CurrentValue;
            var order = new List<string> { s.DefaultProvider };
            order.AddRange(s.FallbackProviders);
            return order.Distinct(StringComparer.OrdinalIgnoreCase)
                        .Where(k => _providers.ContainsKey(k))
                        .Select(k => _providers[k]);
        }

        public async Task<GeminiChordResponse> GenerateChordsAsync(
            string artist, string track, Difficulty difficulty,
            string? preferredProviderKey = null, string? apiKeyOverride = null, CancellationToken ct = default)
        {
            var providers = ResolveProviderChain(preferredProviderKey);
            var attempts = new List<ChordGenerationException>();

            foreach (var provider in providers)
            {
                try
                {
                    var keyToUse = preferredProviderKey != null ? apiKeyOverride : null;
                    var result = await provider.GenerateChordsAsync(artist, track, difficulty, keyToUse, ct);
                    if (result == null) throw new ProviderInvalidResponseException(provider.ProviderKey, "Provider returned no content.");
                    _validator.ValidateAndSanitize(result, provider.ProviderKey);
                    return result;
                }
                catch (ChordGenerationException ex)
                {
                    _logger.LogWarning(ex, "Provider {Provider} failed ({Type}).", provider.ProviderKey, ex.GetType().Name);
                    attempts.Add(ex);
                }
            }

            throw new AllProvidersFailedException(attempts);
        }

        public async Task<ChordArrangement> GenerateSingleArrangementAsync(
            string artist, string track, Difficulty difficulty, NotationType notationType,
            string? preferredProviderKey = null, string? apiKeyOverride = null, CancellationToken ct = default)
        {
            var attempts = new List<ChordGenerationException>();
            foreach (var provider in ResolveProviderChain(preferredProviderKey))
            {
                try
                {
                    var keyToUse = preferredProviderKey != null ? apiKeyOverride : null;
                    var result = await provider.GenerateSingleArrangementAsync(artist, track, difficulty, notationType, keyToUse, ct);
                    if (result == null)
                        throw new ProviderInvalidResponseException(provider.ProviderKey, "Provider returned no content.");

                    _validator.ValidateAndSanitize(result, provider.ProviderKey);
                    return result;
                }
                catch (ChordGenerationException ex)
                {
                    _logger.LogWarning(ex, "Provider {Provider} failed ({Type}); trying next provider if available.",
                        provider.ProviderKey, ex.GetType().Name);
                    attempts.Add(ex);
                }
            }

            throw new AllProvidersFailedException(attempts);
        }
    }

}

using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services.Interfaces;

namespace RiffForge.Server.Services
{
    public class AiProviderResolver
    {
        private readonly RiffForgeDbContext _db;
        private readonly IApiKeyProtector _protector;

        public AiProviderResolver(RiffForgeDbContext db, IApiKeyProtector protector)
        {
            _db = db; _protector = protector;
        }

        public async Task<(string? providerKey, string? apiKey)> ResolveAsync(string? userId, CancellationToken ct)
        {
            if (string.IsNullOrEmpty(userId)) return (null, null); // no user context -> Auto

            var profile = await _db.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
            var providerKey = profile?.PreferredProvider.ToProviderKey();// null if Auto

            if (providerKey == null) return (null, null);

            var saved = await _db.UserAiProviderKeys
                .FirstOrDefaultAsync(k => k.UserId == userId && k.ProviderKey == providerKey, ct);

            // User picked a specific provider but hasn't added their own key — fall back
            // to the server's own key for that provider (apiKeyOverride: null), still no
            // cascading to other providers since providerKey is explicit.
            var apiKey = saved != null ? _protector.Unprotect(saved.ProtectedApiKey) : null;
            return (providerKey, apiKey);
        }
    }
}

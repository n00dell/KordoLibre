using Microsoft.AspNetCore.DataProtection;
using RiffForge.Server.Services.Interfaces;

namespace RiffForge.Server.Services
{
    public class ApiKeyProtector : IApiKeyProtector
    {
        private readonly IDataProtector _protector;

        // Purpose string scopes this protector — changing it invalidates
        // previously-protected data, so don't change it casually later.
        public ApiKeyProtector(IDataProtectionProvider provider) =>
            _protector = provider.CreateProtector("RiffForge.UserAiProviderKey.v1");

        public string Protect(string plaintextKey) => _protector.Protect(plaintextKey);

        public string Unprotect(string protectedKey)
        {
            try
            {
                return _protector.Unprotect(protectedKey);
            }
            catch (System.Security.Cryptography.CryptographicException)
            {
                // Key ring rotated/lost, or data corrupted — treat as "key no longer usable"
                // rather than crashing the request.
                throw new Exceptions.ProviderAuthException("unknown", "Stored API key could not be decrypted; please re-enter it.");
            }
        }
    }
}

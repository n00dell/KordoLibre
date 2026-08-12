namespace RiffForge.Server.Services.Exceptions
{
    public abstract class ChordGenerationException : Exception
    {
        public string ProviderKey { get; }
        protected ChordGenerationException(string providerKey, string message, Exception? inner = null)
            : base(message, inner) => ProviderKey = providerKey;
    }

    public class ProviderUnavailableException : ChordGenerationException
    {
        public ProviderUnavailableException(string providerKey, string message, Exception? inner = null)
            : base(providerKey, message, inner) { }
    }

    public class ProviderAuthException : ChordGenerationException
    {
        public ProviderAuthException(string providerKey, string message, Exception? inner = null)
            : base(providerKey, message, inner) { }
    }

    public class ProviderQuotaExceededException : ChordGenerationException
    {
        public ProviderQuotaExceededException(string providerKey, string message, Exception? inner = null)
            : base(providerKey, message, inner) { }
    }

    public class ProviderInvalidResponseException : ChordGenerationException
    {
        public ProviderInvalidResponseException(string providerKey, string message, Exception? inner = null)
            : base(providerKey, message, inner) { }
    }

    public class AiOutputValidationException : ChordGenerationException
    {
        public AiOutputValidationException(string providerKey, string message)
            : base(providerKey, message) { }
    }

    // Thrown by the factory once the default provider AND every fallback have failed.
    public class AllProvidersFailedException : ChordGenerationException
    {
        public IReadOnlyList<ChordGenerationException> Attempts { get; }
        public AllProvidersFailedException(IReadOnlyList<ChordGenerationException> attempts)
            : base("all", $"All {attempts.Count} configured AI provider(s) failed.")
            => Attempts = attempts;
    }
}

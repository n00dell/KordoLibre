namespace RiffForge.Server.Models.Enums
{
    public enum AiProviderPreference
    {
        Auto = 0,   // server default (Gemini) + fallback chain, as configured today
        Gemini = 1,
        Claude = 2,
        Local = 3  // once Ollama support lands
    }
    public static class AiProviderPreferenceExtensions
    {
        // Maps the user-facing enum to the string key IChordGenerationProvider.ProviderKey
        // and UserAiProviderKey.ProviderKey use. Auto -> null tells the factory to use
        // its own default+fallback chain instead of a single provider.
        public static string? ToProviderKey(this AiProviderPreference pref) => pref switch
        {
            AiProviderPreference.Gemini => "gemini",
            AiProviderPreference.Claude => "claude",
            _ => null
        };
    }
}

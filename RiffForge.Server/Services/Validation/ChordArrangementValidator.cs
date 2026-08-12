using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using RiffForge.Server.Services.Exceptions;
using System.Text.RegularExpressions;

namespace RiffForge.Server.Services.Validation
{
    public class ChordArrangementValidator
    {
        private const int MaxTabDataLength = 10000; // SongVersion.TabData [MaxLength(10000)]
        private const int MaxChordNameLength = 20;  // Chord.Name [MaxLength(20)]

        public void ValidateAndSanitize(GeminiChordResponse response, string providerKey)
        {
            if (response?.OriginalVersion == null || response.AlternateVersion == null)
                throw new ProviderInvalidResponseException(providerKey, "Response is missing originalVersion/alternateVersion.");

            ValidateAndSanitize(response.OriginalVersion, providerKey);
            ValidateAndSanitize(response.AlternateVersion, providerKey);
        }

        public void ValidateAndSanitize(ChordArrangement? arrangement, string providerKey)
        {
            if (arrangement == null)
                throw new ProviderInvalidResponseException(providerKey, "Provider returned a null arrangement.");

            if (string.IsNullOrWhiteSpace(arrangement.TabData))
                throw new AiOutputValidationException(providerKey, "Arrangement has no tabData.");

            if (arrangement.TabData.Length > MaxTabDataLength)
                arrangement.TabData = arrangement.TabData[..MaxTabDataLength];

            if (!Enum.IsDefined(typeof(NotationType), arrangement.NotationType) ||
                !Enum.IsDefined(typeof(Difficulty), arrangement.Difficulty) ||
                !Enum.IsDefined(typeof(Tuning), arrangement.Tuning) ||
                !Enum.IsDefined(typeof(CapoPos), arrangement.CapoPos) ||
                !Enum.IsDefined(typeof(StrumPattern), arrangement.StrumPattern))
            {
                throw new AiOutputValidationException(providerKey, "Provider returned an out-of-range enum value.");
            }

            // Shape must match the declared notation type, or the frontend renders
            // garbage: TabBlock.tsx expects e|B|G|D|A|E lines, ChordLyricLine.tsx
            // expects bracketed [Chord] tokens. Mixing them up silently is worse
            // than failing loudly here.
            bool looksLikeTab = Regex.IsMatch(arrangement.TabData, @"^\s*[eEbBgGdDaA]\s*\|", RegexOptions.Multiline);
            if (arrangement.NotationType == NotationType.TabNotation && !looksLikeTab)
                throw new AiOutputValidationException(providerKey, "notationType=Tab but tabData isn't ASCII tab.");
            if (arrangement.NotationType != NotationType.TabNotation && !arrangement.TabData.Contains('['))
                throw new AiOutputValidationException(providerKey, "notationType=Chords but tabData has no bracketed chords.");

            if (arrangement.ChordDefinitions == null || arrangement.ChordDefinitions.Count == 0)
                throw new AiOutputValidationException(providerKey, "Arrangement has no chordDefinitions.");

            foreach (var chord in arrangement.ChordDefinitions)
            {
                if (string.IsNullOrWhiteSpace(chord.Name))
                    throw new AiOutputValidationException(providerKey, "A chord definition is missing a name.");
                if (chord.Name.Length > MaxChordNameLength)
                    chord.Name = chord.Name[..MaxChordNameLength];

                chord.Frets = NormalizeFrets(chord.Frets);
            }
        }

        // Guarantees exactly 6 characters (one per string) — matches what
        // ChordDiagram.tsx assumes client-side, but we shouldn't rely on the
        // client to quietly fix up bad server data.
        public static string NormalizeFrets(string? frets)
        {
            var clean = (frets ?? string.Empty).Trim();
            if (clean.Length > 6) return clean[..6];
            if (clean.Length < 6) return clean.PadRight(6, 'x');
            return clean;
        }
    }
}

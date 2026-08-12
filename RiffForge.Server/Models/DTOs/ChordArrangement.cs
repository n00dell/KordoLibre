using RiffForge.Server.Models.Enums;
using System.Text.Json.Serialization;

namespace RiffForge.Server.Models.DTOs
{
    public class ChordDefinition
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        [JsonPropertyName("frets")]
        public string Frets { get; set; } = string.Empty; // e.g. "242222"
        [JsonPropertyName("isBarre")]
        public bool IsBarre { get; set; }
    }
    public class ChordArrangement
    {
        [JsonPropertyName("tabData")]
        public string TabData { get; set; } = string.Empty;
        [JsonPropertyName("strumPattern")]
        public StrumPattern StrumPattern { get; set; }
        [JsonPropertyName("tuning")]
        public Tuning Tuning { get; set; }
        [JsonPropertyName("capoPos")]
        public CapoPos CapoPos { get; set; }
        [JsonPropertyName("difficulty")]
        public Difficulty Difficulty { get; set; }
        [JsonPropertyName("notationType")]
        public NotationType NotationType { get; set; }
        [JsonPropertyName("chordDefinitions")]
        public List<ChordDefinition> ChordDefinitions { get; set; } = new();
    }

    public class GeminiChordResponse
    {
        [JsonPropertyName("estimatedBpm")]
        public int EstimatedBpm { get; set; }
        [JsonPropertyName("originalVersion")]
        public ChordArrangement OriginalVersion { get; set; } = null!;
        [JsonPropertyName("alternateVersion")]
        public ChordArrangement AlternateVersion { get; set; } = null!;
    }
}

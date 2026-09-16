namespace RiffForge.Server.Models.DTOs;

public class UserSubmission
{
    public record SubmitVersionRequest(
        string TabData,
        string Tuning,
        string CapoPos,
        string Difficulty,
        string StrumPattern,
        List<ChordShapeOverride>? ChordShapes = null
    );

    public record ChordShapeOverride(string Name, string FretPositions, bool IsBarreChord);

    public class UserSubmissionDto
    {
        public int Id { get; set; }
        public string TabData { get; set; } = string.Empty;
        public string Tuning { get; set; } = string.Empty;
        public string CapoPos { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public string StrumPattern { get; set; } = string.Empty;
        public decimal Rating { get; set; }
        public int RatingCount { get; set; }
        public string ContributorName { get; set; } = string.Empty;
        public DateTime DateScraped { get; set; }
    }
}
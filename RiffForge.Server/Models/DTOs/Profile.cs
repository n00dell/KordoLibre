namespace RiffForge.Server.Models.DTOs
{
    public class ProfileDto
    {
        public string Email { get; set; } = string.Empty;
        public string SkillLevel { get; set; } = string.Empty; // enum name as string, e.g. "Intermediate"
        public int DailyPracticeGoalMinutes { get; set; }
        public List<int> FavoriteGenreIds { get; set; } = new();
        public List<int> MasteredTechniqueIds { get; set; } = new();

        public string PreferredProvider { get; set; } = "Auto";
        public List<string> ConfiguredProviders { get; set; } = new();
    }

    public class UpdateProfileRequest
    {
        public string SkillLevel { get; set; } = string.Empty;
        public int DailyPracticeGoalMinutes { get; set; }
        public List<int> FavoriteGenreIds { get; set; } = new();
        public List<int> MasteredTechniqueIds { get; set; } = new();
        public string PreferredProvider { get; set; } = "Auto";
    }

    public record ProfileOptionItem(int Id, string Name);

    public class ProfileOptionsDto
    {
        public List<ProfileOptionItem> Genres { get; set; } = new();
        public List<ProfileOptionItem> Techniques { get; set; } = new();
    }
}

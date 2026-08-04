using RiffForge.Server.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace RiffForge.Server.Models
{
    public class UserProfile 
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty; // If using Identity

        public Difficulty SkillLevel { get; set; }

        //public List<string> FavoriteGenres { get; set; } = new List<string>();

        //public List<string> MasteredTechniques { get; set; } = new List<string>();

        public int DailyPracticeGoalMinutes { get; set; } = 15;

        //public List<int> CompletedSongIds { get; set; } = new List<int>();

        public ICollection<Genre> FavoriteGenres { get; set; } = new List<Genre>();
        public ICollection<Technique> MasteredTechniques { get; set; } = new List<Technique>();

        public ICollection<Song> LibrarySongs { get; set; } = new List<Song>();
    }
}

using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace RiffForge.Server.Models
{
    [Index(nameof(UserId), nameof(ProviderKey), IsUnique = true)]
    public class UserAiProviderKey
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string ProviderKey { get; set; } = string.Empty; // "gemini" | "claude" — matches IChordGenerationProvider.ProviderKey, not the enum

        [Required]
        public string ProtectedApiKey { get; set; } = string.Empty; // never store plaintext

        public DateTime DateAdded { get; set; } = DateTime.UtcNow;
        public DateTime? LastUsed { get; set; }

        public DateTime? LastVerified { get; set; }
    }
}

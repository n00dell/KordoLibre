using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Models.DTOs;
using RiffForge.Server.Models.Enums;
using System.Security.Claims;

namespace RiffForge.Server.Controllers
{
    [Route("api/profile")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly RiffForgeDbContext _db;
        private readonly UserManager<IdentityUser> _userManager;

        public ProfileController(RiffForgeDbContext db, UserManager<IdentityUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }
        // GET /api/profile — get-or-create, so the frontend never has to
        // handle a 404 on first login (register already creates one, but
        // this covers accounts created before that existed, or edge cases).
        [HttpGet]
        public async Task<ActionResult<ProfileDto>> Get(CancellationToken ct)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            var profile = await GetOrCreateProfile(userId, ct);
            var email = User.FindFirstValue(ClaimTypes.Email) ?? User.Identity?.Name ?? string.Empty;

            return Ok(ToDto(profile, email));
        }

        [HttpPut]
        public async Task<ActionResult<ProfileDto>> Update([FromBody] UpdateProfileRequest req, CancellationToken ct)
        {
            var userId = GetUserId();
            if (userId is null) return Unauthorized();

            if (!Enum.TryParse<Difficulty>(req.SkillLevel, ignoreCase: true, out var skillLevel))
                return BadRequest($"Invalid skill level: {req.SkillLevel}");
            if (!Enum.TryParse<AiProviderPreference>(req.PreferredProvider, ignoreCase: true, out var preferredProvider))
                return BadRequest($"Invalid provider preference: {req.PreferredProvider}");
            var profile = await _db.UserProfiles
                .Include(p => p.FavoriteGenres)
                .Include(p => p.MasteredTechniques)
                .FirstOrDefaultAsync(p => p.UserId == userId, ct);

            if (profile is null)
            {
                profile = new UserProfile { UserId = userId };
                _db.UserProfiles.Add(profile);
            }

            profile.SkillLevel = skillLevel;
            profile.DailyPracticeGoalMinutes = req.DailyPracticeGoalMinutes;
            profile.PreferredProvider = preferredProvider;

            var genres = await _db.Genres.Where(g => req.FavoriteGenreIds.Contains(g.Id)).ToListAsync(ct);
            profile.FavoriteGenres.Clear();
            foreach (var g in genres) profile.FavoriteGenres.Add(g);

            var techniques = await _db.Techniques.Where(t => req.MasteredTechniqueIds.Contains(t.Id)).ToListAsync(ct);
            profile.MasteredTechniques.Clear();
            foreach (var t in techniques) profile.MasteredTechniques.Add(t);

            await _db.SaveChangesAsync(ct);

            var email = User.FindFirstValue(ClaimTypes.Email) ?? User.Identity?.Name ?? string.Empty;
            return Ok(ToDto(profile, email));
        }

        // GET /api/profile/options — populates the multi-select lists on the profile form
        [HttpGet("options")]
        public async Task<ActionResult<ProfileOptionsDto>> Options(CancellationToken ct)
        {
            var genres = await _db.Genres
                .OrderBy(g => g.Name)
                .Select(g => new ProfileOptionItem(g.Id, g.Name))
                .ToListAsync(ct);

            var techniques = await _db.Techniques
                .OrderBy(t => t.Name)
                .Select(t => new ProfileOptionItem(t.Id, t.Name))
                .ToListAsync(ct);

            return Ok(new ProfileOptionsDto { Genres = genres, Techniques = techniques });
        }

        private async Task<UserProfile> GetOrCreateProfile(string userId, CancellationToken ct)
        {
            var profile = await _db.UserProfiles
                .Include(p => p.FavoriteGenres)
                .Include(p => p.MasteredTechniques)
                .FirstOrDefaultAsync(p => p.UserId == userId, ct);

            if (profile is null)
            {
                profile = new UserProfile { UserId = userId };
                _db.UserProfiles.Add(profile);
                await _db.SaveChangesAsync(ct);
            }

            return profile;
        }

        private static ProfileDto ToDto(UserProfile profile, string email) => new()
        {
            Email = email,
            SkillLevel = profile.SkillLevel.ToString(),
            DailyPracticeGoalMinutes = profile.DailyPracticeGoalMinutes,
            FavoriteGenreIds = profile.FavoriteGenres.Select(g => g.Id).ToList(),
            MasteredTechniqueIds = profile.MasteredTechniques.Select(t => t.Id).ToList(),
            PreferredProvider = profile.PreferredProvider.ToString()
        };

        private string? GetUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name;
    }
}

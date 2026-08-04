using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RiffForge.Server.Data;
using RiffForge.Server.Models;

namespace RiffForge.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<IdentityUser> _userManager;
        private readonly SignInManager<IdentityUser> _signInManager;
        private readonly RiffForgeDbContext _db;
        public AuthController(
            UserManager<IdentityUser> userManager,
            SignInManager<IdentityUser> signInManager,
            RiffForgeDbContext db)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _db = db;
        }

        public record RegisterRequest(string Email, string Password);
        public record LoginRequest(string Email, string Password);

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken ct)
        {
            var user = new IdentityUser { UserName = req.Email, Email = req.Email };
            var result = await _userManager.CreateAsync(user, req.Password);

            if (!result.Succeeded)
                return BadRequest(result.Errors.Select(e => e.Description));

            // Create the app-specific profile alongside the Identity user,
            // rather than lazily on first library action — avoids a null
            // UserProfile edge case anywhere else that assumes it exists.
            _db.UserProfiles.Add(new UserProfile { UserId = user.Id });
            await _db.SaveChangesAsync(ct);

            await _signInManager.SignInAsync(user, isPersistent: true);
            return Ok(new { user.Id, user.Email });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var result = await _signInManager.PasswordSignInAsync(
                req.Email, req.Password, isPersistent: true, lockoutOnFailure: true);

            if (result.IsLockedOut) return StatusCode(423, "Account locked — too many failed attempts.");
            if (!result.Succeeded) return Unauthorized("Invalid email or password.");

            var user = await _userManager.FindByEmailAsync(req.Email);
            return Ok(new { user!.Id, user.Email });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok();
        }

        // Frontend calls this on app load to check "am I logged in?"
        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            var email = User.Identity?.Name;
            return Ok(new { email });
        }
    }
}

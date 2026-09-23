using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;
using RiffForge.Server.Services.Exceptions;
using RiffForge.Server.Services.Interfaces;
using System.Security.Claims;

namespace RiffForge.Server.Controllers
{
    public record AddKeyRequest(string ProviderKey, string ApiKey);
    public record ProviderKeyStatus(string ProviderKey, bool Configured, DateTime? LastVerified);

    [Route("api/profile/ai-keys")]
    [Authorize]
    [ApiController]
    public class AiKeysController : ControllerBase
    {

        private readonly RiffForgeDbContext _db;
        private readonly IApiKeyProtector _protector;
        private readonly IChordProviderFactory _chordFactory;

        private static readonly string[] SupportedProviders = { "gemini", "claude" };

        public AiKeysController(RiffForgeDbContext db, IApiKeyProtector protector, IChordProviderFactory chordFactory)
        {
            _db = db;
            _protector = protector;
            _chordFactory = chordFactory;
        }

        // GET /api/profile/ai-keys — presence only, never the key itself
        [HttpGet]
        public async Task<ActionResult<List<ProviderKeyStatus>>> List(CancellationToken ct)
        {
            var userId = GetUserId();
            var saved = await _db.UserAiProviderKeys
                .Where(k => k.UserId == userId)
                .ToDictionaryAsync(k => k.ProviderKey, ct);

            var result = SupportedProviders.Select(p => saved.TryGetValue(p, out var k)
                ? new ProviderKeyStatus(p, true, k.LastVerified)
                : new ProviderKeyStatus(p, false, null)).ToList();

            return Ok(result);
        }

        // POST /api/profile/ai-keys  { providerKey, apiKey }
        [HttpPost]
        public async Task<IActionResult> AddOrUpdate([FromBody] AddKeyRequest req, CancellationToken ct)
        {
            if (!SupportedProviders.Contains(req.ProviderKey))
                return BadRequest($"Unknown provider '{req.ProviderKey}'.");
            if (string.IsNullOrWhiteSpace(req.ApiKey))
                return BadRequest("API key cannot be empty.");

            var userId = GetUserId();
            var existing = await _db.UserAiProviderKeys
                .FirstOrDefaultAsync(k => k.UserId == userId && k.ProviderKey == req.ProviderKey, ct);

            var protectedKey = _protector.Protect(req.ApiKey.Trim());

            if (existing == null)
            {
                _db.UserAiProviderKeys.Add(new UserAiProviderKey
                {
                    UserId = userId,
                    ProviderKey = req.ProviderKey,
                    ProtectedApiKey = protectedKey
                });
            }
            else
            {
                existing.ProtectedApiKey = protectedKey;
                existing.LastVerified = null; // needs re-testing after a key change
            }

            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // DELETE /api/profile/ai-keys/gemini
        [HttpDelete("{providerKey}")]
        public async Task<IActionResult> Delete(string providerKey, CancellationToken ct)
        {
            var userId = GetUserId();
            var existing = await _db.UserAiProviderKeys
                .FirstOrDefaultAsync(k => k.UserId == userId && k.ProviderKey == providerKey, ct);
            if (existing == null) return NotFound();

            _db.UserAiProviderKeys.Remove(existing);
            await _db.SaveChangesAsync(ct);
            return NoContent();
        }

        // POST /api/profile/ai-keys/gemini/test — cheap round-trip so the UI
        // can show "✓ working" before the user relies on it during real generation.
        [HttpPost("{providerKey}/test")]
        public async Task<IActionResult> Test(string providerKey, CancellationToken ct)
        {
            var userId = GetUserId();
            var existing = await _db.UserAiProviderKeys
                .FirstOrDefaultAsync(k => k.UserId == userId && k.ProviderKey == providerKey, ct);
            if (existing == null) return NotFound("No key saved for that provider.");

            var plaintext = _protector.Unprotect(existing.ProtectedApiKey);

            try
            {
                // Cheapest real call available: ask for a single tiny arrangement.
                // (Swap for a lighter health-check endpoint per provider later if cost matters.)
                await _chordFactory.GenerateSingleArrangementAsync(
                    "Test Artist", "Test Song",
                    Models.Enums.Difficulty.Beginner, Models.Enums.NotationType.ChordsOverLyrics,
                    preferredProviderKey: providerKey, apiKeyOverride: plaintext, ct);

                existing.LastVerified = DateTime.UtcNow;
                await _db.SaveChangesAsync(ct);
                return Ok(new { success = true });
            }
            catch (ChordGenerationException ex)
            {
                return Ok(new { success = false, error = ex.Message });
            }
        }

        private string? GetUserId() =>
            User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name;
    }
}

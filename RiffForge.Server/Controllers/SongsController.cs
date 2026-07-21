using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Data;
using RiffForge.Server.Models;

namespace RiffForge.Server.Controllers
{
    [Route("api/songs")]
    [ApiController]
    public class SongsController : ControllerBase
    {
        private readonly RiffForgeDbContext _db;

        public SongsController(RiffForgeDbContext db)
        {
            _db = db;
        }

        // GET /api/songs/19
        [HttpGet("{id}")]
        public async Task<ActionResult<Song>> GetSong(int id)
        {
            var song = await _db.Songs
                .Include(s => s.PrimaryArtist)
                .Include(s => s.Versions)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (song == null) return NotFound();

            return Ok(song);
        }
    }
}

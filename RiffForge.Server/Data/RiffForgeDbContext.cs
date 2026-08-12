using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RiffForge.Server.Models;

namespace RiffForge.Server.Data
{
    public class RiffForgeDbContext :  IdentityDbContext<IdentityUser>
    {
        public RiffForgeDbContext(DbContextOptions<RiffForgeDbContext> options)
            : base(options) { }
        public RiffForgeDbContext()
        {
        }
        public DbSet<Song> Songs { get; set; }
        public DbSet<Artist> Artists { get; set; }
        public DbSet<Chord> Chords { get; set; }
        public DbSet<Genre> Genres { get; set; }
        public DbSet<Technique> Techniques { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<UserSongProgress> UserSongProgresses { get; set; }
        public DbSet<ScrapeRequest> ScrapeRequests { get; set; }

        public DbSet<SongVersion> SongVersions { get; set; }
        public DbSet<UserAiProviderKey> UserAiProviderKeys { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasPostgresExtension("pg_trgm");

            // Song -> PrimaryArtist
            modelBuilder.Entity<Song>()
                .HasOne(s => s.PrimaryArtist)
                .WithMany()
                .HasForeignKey(s => s.PrimaryArtistId)
                .OnDelete(DeleteBehavior.Restrict);

            // Song <-> FeaturedArtists
            modelBuilder.Entity<Song>()
                .HasMany(s => s.FeaturedArtists)
                .WithMany(a => a.Songs);

            // Song <-> Genres
            modelBuilder.Entity<Song>()
                .HasMany(s => s.Genres)
                .WithMany(g => g.Songs);

            // Song -> SongVersions
            modelBuilder.Entity<SongVersion>()
                .HasOne(sv => sv.Song)
                .WithMany(s => s.Versions)
                .HasForeignKey(sv => sv.SongId)
                .OnDelete(DeleteBehavior.Cascade); // delete song, its versions go too

            // SongVersion <-> Chords
            modelBuilder.Entity<SongVersion>()
                .HasMany(sv => sv.Chords)
                .WithMany(c => c.SongVersions);

            // SongVersion <-> Techniques
            modelBuilder.Entity<SongVersion>()
                .HasMany(sv => sv.Techniques)
                .WithMany(t => t.SongVersions);

            // UserSongProgress -> SongVersion
            modelBuilder.Entity<UserSongProgress>()
                .HasOne(usp => usp.SongVersion)
                .WithMany()
                .HasForeignKey(usp => usp.SongVersionId)
                .OnDelete(DeleteBehavior.Cascade);

            // ScrapeRequest -> Song (result)
            modelBuilder.Entity<ScrapeRequest>()
                .HasOne(sr => sr.ResultSong)
                .WithMany()
                .HasForeignKey(sr => sr.ResultSongId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ScrapeRequest>()
                .HasIndex(sr => new { sr.Query, sr.Status, sr.RequestedAt });

            // Decimal precision
            modelBuilder.Entity<SongVersion>()
                .Property(sv => sv.Rating)
                .HasPrecision(3, 2);

            modelBuilder.Entity<SongVersion>()
        .HasIndex(v => v.SongId)
        .IsUnique(false);

            // Only one default version per song
            modelBuilder.Entity<SongVersion>()
                .HasIndex(sv => new { sv.SongId, sv.IsDefault })
                .HasFilter("\"IsDefault\" = true")
                .IsUnique();
            modelBuilder.Entity<UserProfile>()
                .HasMany(u => u.FavoriteGenres)
                .WithMany();
            modelBuilder.Entity<UserProfile>()
               .HasMany(u => u.MasteredTechniques)
               .WithMany();
        }
    }
}

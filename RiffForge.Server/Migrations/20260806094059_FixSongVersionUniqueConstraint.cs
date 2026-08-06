using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RiffForge.Server.Migrations
{
    /// <inheritdoc />
    public partial class FixSongVersionUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SongVersions_SongId",
                table: "SongVersions");

            migrationBuilder.DropIndex(
                name: "IX_SongVersions_SongId_IsDefault",
                table: "SongVersions");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_SongId",
                table: "SongVersions",
                column: "SongId");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_SongId_IsDefault",
                table: "SongVersions",
                columns: new[] { "SongId", "IsDefault" },
                unique: true,
                filter: "\"IsDefault\" = true");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SongVersions_SongId",
                table: "SongVersions");

            migrationBuilder.DropIndex(
                name: "IX_SongVersions_SongId_IsDefault",
                table: "SongVersions");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_SongId",
                table: "SongVersions",
                column: "SongId",
                unique: true,
                filter: "\"IsDefault\" = true");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_SongId_IsDefault",
                table: "SongVersions",
                columns: new[] { "SongId", "IsDefault" });
        }
    }
}

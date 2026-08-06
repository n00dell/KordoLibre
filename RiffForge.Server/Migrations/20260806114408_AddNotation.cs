using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RiffForge.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddNotation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NotationType",
                table: "SongVersions",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NotationType",
                table: "SongVersions");
        }
    }
}

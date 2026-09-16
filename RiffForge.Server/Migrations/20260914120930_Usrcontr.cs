using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RiffForge.Server.Migrations
{
    /// <inheritdoc />
    public partial class Usrcontr : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContributorUserId",
                table: "SongVersions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsUserSubmission",
                table: "SongVersions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContributorUserId",
                table: "SongVersions");

            migrationBuilder.DropColumn(
                name: "IsUserSubmission",
                table: "SongVersions");
        }
    }
}

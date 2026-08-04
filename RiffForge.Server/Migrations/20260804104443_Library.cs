using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RiffForge.Server.Migrations
{
    /// <inheritdoc />
    public partial class Library : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserProfileId",
                table: "Songs",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Songs_UserProfileId",
                table: "Songs",
                column: "UserProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_Songs_UserProfiles_UserProfileId",
                table: "Songs",
                column: "UserProfileId",
                principalTable: "UserProfiles",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Songs_UserProfiles_UserProfileId",
                table: "Songs");

            migrationBuilder.DropIndex(
                name: "IX_Songs_UserProfileId",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "UserProfileId",
                table: "Songs");
        }
    }
}

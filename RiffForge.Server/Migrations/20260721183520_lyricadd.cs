using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RiffForge.Server.Migrations
{
    /// <inheritdoc />
    public partial class lyricadd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChordSongVersion_SongVersion_SongVersionsId",
                table: "ChordSongVersion");

            migrationBuilder.DropForeignKey(
                name: "FK_SongVersion_Songs_SongId",
                table: "SongVersion");

            migrationBuilder.DropForeignKey(
                name: "FK_SongVersionTechnique_SongVersion_SongVersionsId",
                table: "SongVersionTechnique");

            migrationBuilder.DropForeignKey(
                name: "FK_UserSongProgresses_SongVersion_SongVersionId",
                table: "UserSongProgresses");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SongVersion",
                table: "SongVersion");

            migrationBuilder.RenameTable(
                name: "SongVersion",
                newName: "SongVersions");

            migrationBuilder.RenameIndex(
                name: "IX_SongVersion_SongId_IsDefault",
                table: "SongVersions",
                newName: "IX_SongVersions_SongId_IsDefault");

            migrationBuilder.RenameIndex(
                name: "IX_SongVersion_SongId",
                table: "SongVersions",
                newName: "IX_SongVersions_SongId");

            migrationBuilder.AddColumn<string>(
                name: "AlbumArtUrl",
                table: "Songs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Lyrics",
                table: "Songs",
                type: "text",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_SongVersions",
                table: "SongVersions",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChordSongVersion_SongVersions_SongVersionsId",
                table: "ChordSongVersion",
                column: "SongVersionsId",
                principalTable: "SongVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SongVersions_Songs_SongId",
                table: "SongVersions",
                column: "SongId",
                principalTable: "Songs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SongVersionTechnique_SongVersions_SongVersionsId",
                table: "SongVersionTechnique",
                column: "SongVersionsId",
                principalTable: "SongVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserSongProgresses_SongVersions_SongVersionId",
                table: "UserSongProgresses",
                column: "SongVersionId",
                principalTable: "SongVersions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChordSongVersion_SongVersions_SongVersionsId",
                table: "ChordSongVersion");

            migrationBuilder.DropForeignKey(
                name: "FK_SongVersions_Songs_SongId",
                table: "SongVersions");

            migrationBuilder.DropForeignKey(
                name: "FK_SongVersionTechnique_SongVersions_SongVersionsId",
                table: "SongVersionTechnique");

            migrationBuilder.DropForeignKey(
                name: "FK_UserSongProgresses_SongVersions_SongVersionId",
                table: "UserSongProgresses");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SongVersions",
                table: "SongVersions");

            migrationBuilder.DropColumn(
                name: "AlbumArtUrl",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Lyrics",
                table: "Songs");

            migrationBuilder.RenameTable(
                name: "SongVersions",
                newName: "SongVersion");

            migrationBuilder.RenameIndex(
                name: "IX_SongVersions_SongId_IsDefault",
                table: "SongVersion",
                newName: "IX_SongVersion_SongId_IsDefault");

            migrationBuilder.RenameIndex(
                name: "IX_SongVersions_SongId",
                table: "SongVersion",
                newName: "IX_SongVersion_SongId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SongVersion",
                table: "SongVersion",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChordSongVersion_SongVersion_SongVersionsId",
                table: "ChordSongVersion",
                column: "SongVersionsId",
                principalTable: "SongVersion",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SongVersion_Songs_SongId",
                table: "SongVersion",
                column: "SongId",
                principalTable: "Songs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SongVersionTechnique_SongVersion_SongVersionsId",
                table: "SongVersionTechnique",
                column: "SongVersionsId",
                principalTable: "SongVersion",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserSongProgresses_SongVersion_SongVersionId",
                table: "UserSongProgresses",
                column: "SongVersionId",
                principalTable: "SongVersion",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

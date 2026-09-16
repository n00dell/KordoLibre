using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RiffForge.Server.Migrations
{
    /// <inheritdoc />
    public partial class StrumPatImprov : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChordSongVersion");

            migrationBuilder.DropColumn(
                name: "DiagramJson",
                table: "Chords");

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "Chords");

            migrationBuilder.DropColumn(
                name: "FingeringPattern",
                table: "Chords");

            migrationBuilder.DropColumn(
                name: "FretPositions",
                table: "Chords");

            migrationBuilder.DropColumn(
                name: "IsBarreChord",
                table: "Chords");

            migrationBuilder.DropColumn(
                name: "LastScraped",
                table: "Chords");

            migrationBuilder.DropColumn(
                name: "SourceName",
                table: "Chords");

            migrationBuilder.DropColumn(
                name: "SourceUrl",
                table: "Chords");

            migrationBuilder.AlterColumn<string>(
                name: "StrumPattern",
                table: "SongVersions",
                type: "character varying(16)",
                maxLength: 16,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "ChordId",
                table: "SongVersions",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DefaultShapeId",
                table: "Chords",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ChordShapes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ChordId = table.Column<int>(type: "integer", nullable: false),
                    FretPositions = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FingeringPattern = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IsBarreChord = table.Column<bool>(type: "boolean", nullable: false),
                    Difficulty = table.Column<int>(type: "integer", nullable: false),
                    ContributorUserId = table.Column<string>(type: "text", nullable: true),
                    ContributorName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    UpvoteCount = table.Column<int>(type: "integer", nullable: false),
                    DateAdded = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChordShapes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChordShapes_Chords_ChordId",
                        column: x => x.ChordId,
                        principalTable: "Chords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SongVersionChordShapes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SongVersionId = table.Column<int>(type: "integer", nullable: false),
                    ChordShapeId = table.Column<int>(type: "integer", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SongVersionChordShapes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SongVersionChordShapes_ChordShapes_ChordShapeId",
                        column: x => x.ChordShapeId,
                        principalTable: "ChordShapes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SongVersionChordShapes_SongVersions_SongVersionId",
                        column: x => x.SongVersionId,
                        principalTable: "SongVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SongVersions_ChordId",
                table: "SongVersions",
                column: "ChordId");

            migrationBuilder.CreateIndex(
                name: "IX_Chords_DefaultShapeId",
                table: "Chords",
                column: "DefaultShapeId");

            migrationBuilder.CreateIndex(
                name: "IX_ChordShapes_ChordId",
                table: "ChordShapes",
                column: "ChordId");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersionChordShapes_ChordShapeId",
                table: "SongVersionChordShapes",
                column: "ChordShapeId");

            migrationBuilder.CreateIndex(
                name: "IX_SongVersionChordShapes_SongVersionId",
                table: "SongVersionChordShapes",
                column: "SongVersionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Chords_ChordShapes_DefaultShapeId",
                table: "Chords",
                column: "DefaultShapeId",
                principalTable: "ChordShapes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SongVersions_Chords_ChordId",
                table: "SongVersions",
                column: "ChordId",
                principalTable: "Chords",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Chords_ChordShapes_DefaultShapeId",
                table: "Chords");

            migrationBuilder.DropForeignKey(
                name: "FK_SongVersions_Chords_ChordId",
                table: "SongVersions");

            migrationBuilder.DropTable(
                name: "SongVersionChordShapes");

            migrationBuilder.DropTable(
                name: "ChordShapes");

            migrationBuilder.DropIndex(
                name: "IX_SongVersions_ChordId",
                table: "SongVersions");

            migrationBuilder.DropIndex(
                name: "IX_Chords_DefaultShapeId",
                table: "Chords");

            migrationBuilder.DropColumn(
                name: "ChordId",
                table: "SongVersions");

            migrationBuilder.DropColumn(
                name: "DefaultShapeId",
                table: "Chords");

            migrationBuilder.AlterColumn<int>(
                name: "StrumPattern",
                table: "SongVersions",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(16)",
                oldMaxLength: 16);

            migrationBuilder.AddColumn<string>(
                name: "DiagramJson",
                table: "Chords",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Difficulty",
                table: "Chords",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FingeringPattern",
                table: "Chords",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FretPositions",
                table: "Chords",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBarreChord",
                table: "Chords",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastScraped",
                table: "Chords",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceName",
                table: "Chords",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceUrl",
                table: "Chords",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ChordSongVersion",
                columns: table => new
                {
                    ChordsId = table.Column<int>(type: "integer", nullable: false),
                    SongVersionsId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChordSongVersion", x => new { x.ChordsId, x.SongVersionsId });
                    table.ForeignKey(
                        name: "FK_ChordSongVersion_Chords_ChordsId",
                        column: x => x.ChordsId,
                        principalTable: "Chords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChordSongVersion_SongVersions_SongVersionsId",
                        column: x => x.SongVersionsId,
                        principalTable: "SongVersions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChordSongVersion_SongVersionsId",
                table: "ChordSongVersion",
                column: "SongVersionsId");
        }
    }
}

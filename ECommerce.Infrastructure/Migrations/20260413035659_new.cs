using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class @new : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_Storefront_Active",
                table: "Products");

            migrationBuilder.AddColumn<DateTime>(
                name: "BannersUpdatedAt",
                table: "SiteSettings",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "CategoriesUpdatedAt",
                table: "SiteSettings",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "PagesUpdatedAt",
                table: "SiteSettings",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "ProductsUpdatedAt",
                table: "SiteSettings",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Products_Gallery_Performance",
                table: "Products",
                columns: new[] { "IsActive", "CategoryId", "CreatedAt" },
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Products_NewArrivals_Performance",
                table: "Products",
                columns: new[] { "IsActive", "IsNew", "CreatedAt" },
                filter: "[IsActive] = 1 AND [IsNew] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_Gallery_Performance",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_NewArrivals_Performance",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "BannersUpdatedAt",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "CategoriesUpdatedAt",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "PagesUpdatedAt",
                table: "SiteSettings");

            migrationBuilder.DropColumn(
                name: "ProductsUpdatedAt",
                table: "SiteSettings");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Storefront_Active",
                table: "Products",
                columns: new[] { "IsActive", "CategoryId" },
                filter: "[IsActive] = 1");
        }
    }
}

import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class ImageUrlService {
  /**
   * Converts relative image URLs to optimized absolute URLs handling resizing and WebP conversion
   * @param imageUrl - The image URL (can be relative or absolute)
   * @param w - Optional width
   * @param h - Optional height
   * @returns Absolute URL to the optimized image
   */
  getImageUrl(
    imageUrl: string | null | undefined,
    w?: number,
    h?: number,
  ): string {
    if (!imageUrl || typeof imageUrl !== "string") {
      return "assets/images/placeholder.png";
    }

    const trimmedUrl = imageUrl.trim();

    // If it's a data URI or blob URL (local preview), return as is
    if (trimmedUrl.startsWith("data:") || trimmedUrl.startsWith("blob:")) {
      return trimmedUrl;
    }

    // If it's already an absolute URL, return as is
    if (/^https?:\/\//i.test(trimmedUrl)) {
      return trimmedUrl;
    }

    // We route through our API image optimizer
    // environment.apiBaseUrl is typically something like "https://api.example.com/api"
    const apiBase = environment.apiBaseUrl.endsWith("/")
      ? environment.apiBaseUrl.slice(0, -1)
      : environment.apiBaseUrl;

    const cleanPath = trimmedUrl.startsWith("/")
      ? trimmedUrl.substring(1)
      : trimmedUrl;

    let finalUrl = `${apiBase}/images/${cleanPath}`;

    // Append resizing parameters if provided
    const params: string[] = [];
    if (w) params.push(`w=${w}`);
    if (h) params.push(`h=${h}`);

    if (params.length > 0) {
      finalUrl += `?${params.join("&")}`;
    }

    return finalUrl;
  }
}

import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class ImageUrlService {
  /**
   * Converts relative image URLs to absolute URLs pointing to the backend server
   * @param imageUrl - The image URL (can be relative or absolute)
   * @returns Absolute URL to the image
   */
  getImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) {
      return "assets/images/placeholder.png"; // Fallback for missing images
    }

    // If it's a data URI or blob URL (local preview), return as is
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
      return imageUrl;
    }

    // If it's already an absolute URL, return as is
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // Convert relative URL to absolute URL using backend base URL
    const baseUrl = environment.apiBaseUrl.replace("/api", "");
    const cleanUrl = imageUrl.startsWith("/") ? imageUrl : "/" + imageUrl;
    return `${baseUrl}${cleanUrl}`;
  }
}

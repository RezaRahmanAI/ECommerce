namespace ECommerce.Core.Interfaces;

public interface IImageService
{
    /// <summary>
    /// Processes an uploaded image stream: resizes it to a max width, converts to WebP, and saves.
    /// </summary>
    /// <param name="imageStream">The image content stream</param>
    /// <param name="fileName">Original file name (to extract extension if needed)</param>
    /// <param name="folderName">Target subfolder (e.g. "products", "banners")</param>
    /// <returns>The relative URL of the processed image</returns>
    Task<string> ProcessAndSaveImageAsync(Stream imageStream, string fileName, string folderName);

    /// <summary>
    /// Saves a media file (image or video) to the filesystem without processing if it's a video.
    /// </summary>
    Task<string> SaveMediaAsync(Stream mediaStream, string fileName, string folderName);

    /// <summary>
    /// Deletes an image from the filesystem.
    /// </summary>
    Task DeleteImageAsync(string imageUrl);
}

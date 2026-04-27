import { v2 as cloudinary } from "cloudinary";

import { env } from "~/env";

export interface MediaProvider {
  productImage(
    url: string,
    options?: { width?: number; height?: number },
  ): string;
}

class CloudinaryMediaProvider implements MediaProvider {
  constructor() {
    if (env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });
    }
  }

  productImage(url: string, options?: { width?: number; height?: number }) {
    if (
      !env.CLOUDINARY_CLOUD_NAME ||
      url.startsWith("https://images.unsplash.com")
    ) {
      return url;
    }

    return cloudinary.url(url, {
      crop: "fill",
      gravity: "auto",
      width: options?.width ?? 900,
      height: options?.height ?? 900,
      quality: "auto",
      fetch_format: "auto",
    });
  }
}

export const mediaProvider: MediaProvider = new CloudinaryMediaProvider();

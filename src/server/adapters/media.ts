import { v2 as cloudinary } from "cloudinary";

import { env } from "~/env";

export type ServiceAttachmentUpload = {
  bytes: number;
  contentType: string;
  file: File;
  originalFilename: string;
};

export type ServiceAttachmentUploadResult = {
  bytes: number;
  contentType: string;
  height?: number;
  originalFilename: string;
  provider: string;
  publicId: string;
  secureUrl: string;
  width?: number;
};

export interface MediaProvider {
  productImage(
    url: string,
    options?: { width?: number; height?: number },
  ): string;
  uploadServiceAttachment(
    upload: ServiceAttachmentUpload,
  ): Promise<ServiceAttachmentUploadResult>;
}

class CloudinaryMediaProvider implements MediaProvider {
  constructor() {
    if (hasCloudinaryUploadConfig()) {
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

  async uploadServiceAttachment(upload: ServiceAttachmentUpload) {
    if (!hasCloudinaryUploadConfig()) {
      if (env.NODE_ENV === "production") {
        throw new Error(
          "Cloudinary credentials are required before uploading service request files.",
        );
      }

      return {
        bytes: upload.bytes,
        contentType: upload.contentType,
        originalFilename: upload.originalFilename,
        provider: "mock",
        publicId: `mock/service-requests/${Date.now()}-${sanitizeFilename(
          upload.originalFilename,
        )}`,
        secureUrl: "",
      };
    }

    const buffer = Buffer.from(await upload.file.arrayBuffer());
    const result = await uploadBuffer(buffer, {
      folder: "elysia/service-requests",
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    });

    return {
      bytes: upload.bytes,
      contentType: upload.contentType,
      height: result.height,
      originalFilename: upload.originalFilename,
      provider: "cloudinary",
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
    };
  }
}

export const mediaProvider: MediaProvider = new CloudinaryMediaProvider();

function hasCloudinaryUploadConfig() {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET,
  );
}

function uploadBuffer(
  buffer: Buffer,
  options: Record<string, unknown>,
): Promise<{
  height?: number;
  public_id: string;
  secure_url: string;
  width?: number;
}> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error || !result) {
          reject(
            error instanceof Error
              ? error
              : new Error("Cloudinary upload failed."),
          );
          return;
        }

        resolve({
          height: result.height,
          public_id: result.public_id,
          secure_url: result.secure_url,
          width: result.width,
        });
      },
    );

    stream.end(buffer);
  });
}

function sanitizeFilename(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

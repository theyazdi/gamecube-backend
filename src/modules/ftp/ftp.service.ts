import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as Client from 'basic-ftp';
import { Readable } from 'stream';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FtpService {
  private readonly ftpConfig = {
    host: '2193182636.cloudydl.com',
    user: 'pz22325',
    password: 'HnVil3Q7',
    port: 21,
    baseUrl: 'https://storage.gamecube.ir',
  };

  async uploadFile(
    file: Express.Multer.File,
    directory: string,
  ): Promise<{ url: string; fileName: string }> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type (only images)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed');
    }

    // Generate unique file name
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
    
    // Normalize directory path (remove leading/trailing slashes)
    const normalizedDirectory = directory.replace(/^\/+|\/+$/g, '');
    
    // Add public_html prefix to directory for FTP path
    const fullDirectoryPath = normalizedDirectory
      ? `public_html/${normalizedDirectory}`
      : 'public_html';

    const client = new Client.Client();

    try {
      // Connect to FTP server
      await client.access({
        host: this.ftpConfig.host,
        user: this.ftpConfig.user,
        password: this.ftpConfig.password,
        port: this.ftpConfig.port,
      });

      // Ensure directory exists (always use fullDirectoryPath which includes public_html)
      await this.ensureDirectory(client, fullDirectoryPath);
      // Go back to root and then change to the directory
      await client.cd('/');
      await client.cd(fullDirectoryPath);

      // Convert buffer to stream
      const fileStream = Readable.from(file.buffer);

      // Upload file (use only filename since we're already in the directory)
      await client.uploadFrom(fileStream, uniqueFileName);

      // Construct URL
      const baseUrl = this.ftpConfig.baseUrl.endsWith('/')
        ? this.ftpConfig.baseUrl.slice(0, -1)
        : this.ftpConfig.baseUrl;
      const dirUrl = normalizedDirectory
        ? `/${normalizedDirectory}`
        : '';
      const url = `${baseUrl}${dirUrl}/${uniqueFileName}`.replace(/\/+/g, '/');

      return {
        url,
        fileName: uniqueFileName,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to upload file: ${errorMessage}`,
      );
    } finally {
      // Ensure connection is always closed
      try {
        client.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }

  private async ensureDirectory(client: Client.Client, directory: string): Promise<void> {
    // Go to root directory first
    try {
      await client.cd('/');
    } catch {
      // Ignore if can't go to root
    }
    
    // Use ensureDir which creates the full path recursively
    try {
      await client.ensureDir(directory);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to create directory: ${directory}. Error: ${errorMessage}`,
      );
    }
  }

  /**
   * Generate random 10-character ID with alphanumeric characters (uppercase, lowercase, numbers)
   */
  private generateLogoId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get file extension based on mime type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: { [key: string]: string } = {
      'image/png': '.png',
      'image/webp': '.webp',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
    };
    return mimeToExt[mimeType] || '.webp';
  }

  async uploadLogo(
    compressedLogo: Express.Multer.File,
    fullCompressedLogo: Express.Multer.File,
  ): Promise<{ logoId: string; compressedLogoUrl: string; fullCompressedLogoUrl: string }> {
    // Validate files
    if (!compressedLogo || !fullCompressedLogo) {
      throw new BadRequestException('Both compressedLogo and fullCompressedLogo files are required');
    }

    // Validate file types (png, webp, jpg)
    const allowedMimeTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
    if (!allowedMimeTypes.includes(compressedLogo.mimetype)) {
      throw new BadRequestException('compressedLogo must be png, webp, or jpg');
    }
    if (!allowedMimeTypes.includes(fullCompressedLogo.mimetype)) {
      throw new BadRequestException('fullCompressedLogo must be png, webp, or jpg');
    }

    // Generate logo ID
    const logoId = this.generateLogoId();

    // Get file extensions based on mime types
    const compressedExtension = this.getExtensionFromMimeType(compressedLogo.mimetype);
    const fullCompressedExtension = this.getExtensionFromMimeType(fullCompressedLogo.mimetype);

    // Create file names
    const compressedFileName = `${logoId}-400${compressedExtension}`;
    const fullCompressedFileName = `${logoId}-100${fullCompressedExtension}`;

    // Directory for logos
    const directory = 'logo';
    const fullDirectoryPath = `public_html/${directory}`;

    const client = new Client.Client();

    try {
      // Connect to FTP server
      await client.access({
        host: this.ftpConfig.host,
        user: this.ftpConfig.user,
        password: this.ftpConfig.password,
        port: this.ftpConfig.port,
      });

      // Ensure directory exists
      await this.ensureDirectory(client, fullDirectoryPath);
      await client.cd('/');
      await client.cd(fullDirectoryPath);

      // Upload compressed logo
      const compressedStream = Readable.from(compressedLogo.buffer);
      await client.uploadFrom(compressedStream, compressedFileName);

      // Upload full compressed logo
      const fullCompressedStream = Readable.from(fullCompressedLogo.buffer);
      await client.uploadFrom(fullCompressedStream, fullCompressedFileName);

      // Construct URLs
      const baseUrl = this.ftpConfig.baseUrl.endsWith('/')
        ? this.ftpConfig.baseUrl.slice(0, -1)
        : this.ftpConfig.baseUrl;

      const compressedLogoUrl = `${baseUrl}/${directory}/${compressedFileName}`;
      const fullCompressedLogoUrl = `${baseUrl}/${directory}/${fullCompressedFileName}`;

      return {
        logoId,
        compressedLogoUrl,
        fullCompressedLogoUrl,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to upload logo: ${errorMessage}`,
      );
    } finally {
      // Ensure connection is always closed
      try {
        client.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }

  async uploadIndexImage(
    indexImage400: Express.Multer.File,
    indexImage90: Express.Multer.File,
  ): Promise<{ indexImageId: string; indexImage400Url: string; indexImage90Url: string }> {
    // Validate files
    if (!indexImage400 || !indexImage90) {
      throw new BadRequestException('Both indexImage400 and indexImage90 files are required');
    }

    // Validate file types (png, webp, jpg)
    const allowedMimeTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
    if (!allowedMimeTypes.includes(indexImage400.mimetype)) {
      throw new BadRequestException('indexImage400 must be png, webp, or jpg');
    }
    if (!allowedMimeTypes.includes(indexImage90.mimetype)) {
      throw new BadRequestException('indexImage90 must be png, webp, or jpg');
    }

    // Generate index image ID
    const indexImageId = this.generateLogoId();

    // Get file extensions based on mime types
    const image400Extension = this.getExtensionFromMimeType(indexImage400.mimetype);
    const image90Extension = this.getExtensionFromMimeType(indexImage90.mimetype);

    // Create file names
    const image400FileName = `${indexImageId}-400${image400Extension}`;
    const image90FileName = `${indexImageId}-90${image90Extension}`;

    // Directory for index images
    const directory = 'index-image';
    const fullDirectoryPath = `public_html/${directory}`;

    const client = new Client.Client();

    try {
      // Connect to FTP server
      await client.access({
        host: this.ftpConfig.host,
        user: this.ftpConfig.user,
        password: this.ftpConfig.password,
        port: this.ftpConfig.port,
      });

      // Ensure directory exists
      await this.ensureDirectory(client, fullDirectoryPath);
      await client.cd('/');
      await client.cd(fullDirectoryPath);

      // Upload index image 400
      const image400Stream = Readable.from(indexImage400.buffer);
      await client.uploadFrom(image400Stream, image400FileName);

      // Upload index image 90
      const image90Stream = Readable.from(indexImage90.buffer);
      await client.uploadFrom(image90Stream, image90FileName);

      // Construct URLs
      const baseUrl = this.ftpConfig.baseUrl.endsWith('/')
        ? this.ftpConfig.baseUrl.slice(0, -1)
        : this.ftpConfig.baseUrl;

      const indexImage400Url = `${baseUrl}/${directory}/${image400FileName}`;
      const indexImage90Url = `${baseUrl}/${directory}/${image90FileName}`;

      return {
        indexImageId,
        indexImage400Url,
        indexImage90Url,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to upload index image: ${errorMessage}`,
      );
    } finally {
      // Ensure connection is always closed
      try {
        client.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }

  async uploadGalleryImages(
    files: Express.Multer.File[],
  ): Promise<{ galleryId: string; imageUrls: string[]; count: number }> {
    // Validate files
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required');
    }

    if (files.length > 15) {
      throw new BadRequestException('Maximum 15 images are allowed');
    }

    // Validate file types (png, webp, jpg)
    const allowedMimeTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(`File ${file.originalname} must be png, webp, or jpg`);
      }
    }

    // Generate gallery ID
    const galleryId = this.generateLogoId();

    // Directory for gallery
    const galleryDirectory = `gallery/${galleryId}`;
    const fullDirectoryPath = `public_html/${galleryDirectory}`;

    const client = new Client.Client();
    const imageUrls: string[] = [];

    try {
      // Connect to FTP server
      await client.access({
        host: this.ftpConfig.host,
        user: this.ftpConfig.user,
        password: this.ftpConfig.password,
        port: this.ftpConfig.port,
      });

      // Ensure directory exists
      await this.ensureDirectory(client, fullDirectoryPath);
      await client.cd('/');
      await client.cd(fullDirectoryPath);

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = this.getExtensionFromMimeType(file.mimetype);
        const fileName = `${galleryId}-${i + 1}${fileExtension}`;

        // Upload file
        const fileStream = Readable.from(file.buffer);
        await client.uploadFrom(fileStream, fileName);

        // Construct URL
        const baseUrl = this.ftpConfig.baseUrl.endsWith('/')
          ? this.ftpConfig.baseUrl.slice(0, -1)
          : this.ftpConfig.baseUrl;
        const imageUrl = `${baseUrl}/${galleryDirectory}/${fileName}`;
        imageUrls.push(imageUrl);
      }

      return {
        galleryId,
        imageUrls,
        count: files.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to upload gallery images: ${errorMessage}`,
      );
    } finally {
      // Ensure connection is always closed
      try {
        client.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }
}

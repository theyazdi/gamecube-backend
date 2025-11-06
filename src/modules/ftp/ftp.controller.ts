import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { FtpService } from './ftp.service';
import { UploadFileDto, UploadFileResponseDto, UploadLogoResponseDto, UploadIndexImageResponseDto, UploadGalleryImageResponseDto } from './dto/upload.dto';

@ApiTags('ftp')
@Controller('ftp')
export class FtpController {
  constructor(private readonly ftpService: FtpService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload image file via FTP',
    description: 'Uploads an image file to the specified directory on FTP server and returns the file URL',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
        directory: {
          type: 'string',
          description: 'Directory path on FTP server (e.g., "images/products")',
          example: 'images/products',
        },
      },
      required: ['file', 'directory'],
    },
  })
  @ApiCreatedResponse({
    description: 'File uploaded successfully',
    type: UploadFileResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid file or directory',
    schema: {
      example: {
        statusCode: 400,
        message: 'Only image files are allowed',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'FTP upload failed',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to upload file: Connection timeout',
        error: 'Internal Server Error',
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ): Promise<UploadFileResponseDto> {
    const result = await this.ftpService.uploadFile(file, uploadFileDto.directory);

    return {
      message: 'File uploaded successfully',
      url: result.url,
      fileName: result.fileName,
    };
  }

  @Post('upload-logo')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'Upload logo files via FTP',
    description: 'Uploads two logo files (compressedLogo and fullCompressedLogo) and generates a random 10-character logo ID',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        compressedLogo: {
          type: 'string',
          format: 'binary',
          description: 'Compressed logo file (will be saved as [logoId]-400.webp)',
        },
        fullCompressedLogo: {
          type: 'string',
          format: 'binary',
          description: 'Full compressed logo file (will be saved as [logoId]-100.webp)',
        },
      },
      required: ['compressedLogo', 'fullCompressedLogo'],
    },
  })
  @ApiCreatedResponse({
    description: 'Logo uploaded successfully',
    type: UploadLogoResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid files',
    schema: {
      example: {
        statusCode: 400,
        message: 'Both compressedLogo and fullCompressedLogo files are required',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'FTP upload failed',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to upload logo: Connection timeout',
        error: 'Internal Server Error',
      },
    },
  })
  async uploadLogo(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadLogoResponseDto> {
    // Extract files from array (order matters: compressedLogo first, then fullCompressedLogo)
    // But actually we need to get them by field name, so we'll use a different approach
    const compressedLogo = files?.find(f => f.fieldname === 'compressedLogo');
    const fullCompressedLogo = files?.find(f => f.fieldname === 'fullCompressedLogo');

    // Validate files exist (will also be validated in service, but needed for TypeScript)
    if (!compressedLogo || !fullCompressedLogo) {
      throw new BadRequestException('Both compressedLogo and fullCompressedLogo files are required');
    }

    const result = await this.ftpService.uploadLogo(compressedLogo, fullCompressedLogo);

    return {
      message: 'Logo uploaded successfully',
      logoId: result.logoId,
      compressedLogoUrl: result.compressedLogoUrl,
      fullCompressedLogoUrl: result.fullCompressedLogoUrl,
    };
  }

  @Post('upload-index-image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({
    summary: 'Upload index image files via FTP',
    description: 'Uploads two index image files (indexImage400 and indexImage90) and generates a random 10-character index image ID',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        indexImage400: {
          type: 'string',
          format: 'binary',
          description: 'Index image file 400x (will be saved as [indexImageId]-400.webp)',
        },
        indexImage90: {
          type: 'string',
          format: 'binary',
          description: 'Index image file 90x (will be saved as [indexImageId]-90.webp)',
        },
      },
      required: ['indexImage400', 'indexImage90'],
    },
  })
  @ApiCreatedResponse({
    description: 'Index image uploaded successfully',
    type: UploadIndexImageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid files',
    schema: {
      example: {
        statusCode: 400,
        message: 'Both indexImage400 and indexImage90 files are required',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'FTP upload failed',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to upload index image: Connection timeout',
        error: 'Internal Server Error',
      },
    },
  })
  async uploadIndexImage(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadIndexImageResponseDto> {
    // Extract files by field name
    const indexImage400 = files?.find(f => f.fieldname === 'indexImage400');
    const indexImage90 = files?.find(f => f.fieldname === 'indexImage90');

    // Validate files exist (will also be validated in service, but needed for TypeScript)
    if (!indexImage400 || !indexImage90) {
      throw new BadRequestException('Both indexImage400 and indexImage90 files are required');
    }

    const result = await this.ftpService.uploadIndexImage(indexImage400, indexImage90);

    return {
      message: 'Index image uploaded successfully',
      indexImageId: result.indexImageId,
      indexImage400Url: result.indexImage400Url,
      indexImage90Url: result.indexImage90Url,
    };
  }

  @Post('upload-gallery-image')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('images', 15))
  @ApiOperation({
    summary: 'Upload gallery images via FTP',
    description: 'Uploads up to 15 image files and generates a random 10-character gallery ID. Creates a folder with gallery ID inside gallery directory.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files to upload (1-15 files). Files will be saved as [galleryId]-1.webp, [galleryId]-2.webp, etc.',
        },
      },
      required: ['images'],
    },
  })
  @ApiCreatedResponse({
    description: 'Gallery images uploaded successfully',
    type: UploadGalleryImageResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid files',
    schema: {
      example: {
        statusCode: 400,
        message: 'At least one image file is required',
        error: 'Bad Request',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'FTP upload failed',
    schema: {
      example: {
        statusCode: 500,
        message: 'Failed to upload gallery images: Connection timeout',
        error: 'Internal Server Error',
      },
    },
  })
  async uploadGalleryImages(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadGalleryImageResponseDto> {
    // Validate files exist (will also be validated in service, but needed for TypeScript)
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required');
    }

    const result = await this.ftpService.uploadGalleryImages(files);

    return {
      message: 'Gallery images uploaded successfully',
      galleryId: result.galleryId,
      imageUrls: result.imageUrls,
      count: result.count,
    };
  }
}

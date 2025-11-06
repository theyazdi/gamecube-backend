import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UploadFileDto {
  @ApiProperty({
    description: 'Directory path on FTP server where the file should be uploaded',
    example: 'images/products',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  directory: string;
}

export class UploadFileResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'File uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Full URL of the uploaded file',
    example: 'https://example.com/images/products/image-123456.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'File name on the server',
    example: 'image-123456.jpg',
  })
  fileName: string;
}

export class UploadLogoResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Logo uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Random 10-character logo ID',
    example: 'aB3dEfGhIj',
  })
  logoId: string;

  @ApiProperty({
    description: 'URL of the compressed logo (400x)',
    example: 'https://storage.gamecube.ir/logo/aB3dEfGhIj-400.webp',
  })
  compressedLogoUrl: string;

  @ApiProperty({
    description: 'URL of the full compressed logo (100x)',
    example: 'https://storage.gamecube.ir/logo/aB3dEfGhIj-100.webp',
  })
  fullCompressedLogoUrl: string;
}

export class UploadIndexImageResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Index image uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Random 10-character index image ID',
    example: 'xY9zAbCdEf',
  })
  indexImageId: string;

  @ApiProperty({
    description: 'URL of the index image (400x)',
    example: 'https://storage.gamecube.ir/index-image/xY9zAbCdEf-400.webp',
  })
  indexImage400Url: string;

  @ApiProperty({
    description: 'URL of the index image (90x)',
    example: 'https://storage.gamecube.ir/index-image/xY9zAbCdEf-90.webp',
  })
  indexImage90Url: string;
}

export class UploadGalleryImageResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Gallery images uploaded successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Random 10-character gallery ID',
    example: 'mK8pQrStUv',
  })
  galleryId: string;

  @ApiProperty({
    description: 'Array of uploaded image URLs',
    type: [String],
    example: [
      'https://storage.gamecube.ir/gallery/mK8pQrStUv/mK8pQrStUv-1.webp',
      'https://storage.gamecube.ir/gallery/mK8pQrStUv/mK8pQrStUv-2.webp',
    ],
  })
  imageUrls: string[];

  @ApiProperty({
    description: 'Number of uploaded images',
    example: 2,
  })
  count: number;
}

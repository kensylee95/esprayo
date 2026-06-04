import { CurrentUser } from '@modules/auth/src';
import { SupabaseStorageService } from '@modules/superbase-storage/superbase-storage.service';
import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('storage')
export class StorageController {
  constructor(private readonly storage: SupabaseStorageService) {}

  // UPLOAD SINGLE FILE
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadFile(
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const { path, publicUrl } = await this.storage.upload({
      path: `uploads/${userId}/${Date.now()}-${file.originalname}`,
      file: file.buffer,
      mimetype: file.mimetype,
    });

    return { path, publicUrl };
  }

  // UPLOAD MULTIPLE FILES
  @Post('upload/bulk')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadFiles(
    @CurrentUser('id') userId: string,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('No files provided');

    const uploaded = await Promise.all(
      files.map((file) =>
        this.storage.upload({
          path: `uploads/${userId}/${Date.now()}-${file.originalname}`,
          file: file.buffer,
          mimetype: file.mimetype,
        }),
      ),
    );

    return uploaded;
  }

  // DELETE SINGLE FILE
  @Delete('delete')
  async deleteFile(@Param('path') path: string) {
    if (!path) throw new BadRequestException('No path provided');
    await this.storage.delete(path);
    return { deleted: true, path };
  }

  // DELETE MULTIPLE FILES
  @Delete('delete/bulk')
  async deleteFiles(@Param('paths') paths: string) {
    if (!paths) throw new BadRequestException('No paths provided');
    const pathList = paths.split(',');
    await this.storage.delete(pathList);
    return { deleted: true, paths: pathList };
  }
}

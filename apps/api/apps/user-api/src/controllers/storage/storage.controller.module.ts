import { Module } from '@nestjs/common';
import { SupabaseStorageModule } from '@modules/superbase-storage/superbase-storage.module';
import { StorageController } from './storage.controller';

@Module({
  imports: [SupabaseStorageModule],
  controllers: [StorageController],
})
export class StorageControllerModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import supabaseStorageConfig from './superbase-storage.config';
import { SupabaseStorageService } from './superbase-storage.service';

@Module({
  imports: [ConfigModule.forFeature(supabaseStorageConfig)],
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class SupabaseStorageModule {}

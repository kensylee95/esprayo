import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import supabaseStorageConfig from './superbase-storage.config';
import {
  CopyFileOptions,
  MoveFileOptions,
  UploadFileOptions,
  UploadFileResponse,
} from './superbase-storage.interfaces';

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly client: SupabaseClient<unknown>;
  private readonly bucket: string;

  constructor(
    @Inject(supabaseStorageConfig.KEY)
    private readonly config: ConfigType<typeof supabaseStorageConfig>,
  ) {
    this.bucket = config.bucket;
    this.client = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private throwOnError(error: { message: string } | null, context: string) {
    if (error) {
      this.logger.error(
        `Supabase Storage error [${context}]: ${error.message}`,
      );
      throw new Error(error.message);
    }
  }

  /**
   * Returns the public URL for a given path without making a network call.
   */
  getPublicUrl(path: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  async upload(options: UploadFileOptions): Promise<UploadFileResponse> {
    const { path, file, mimetype, upsert = true } = options;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, file, { contentType: mimetype, upsert });

    this.throwOnError(error, 'upload');

    return {
      path,
      publicUrl: this.getPublicUrl(path),
    };
  }

  // ── Download ───────────────────────────────────────────────────────────────

  async download(path: string): Promise<Blob> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(path);

    this.throwOnError(error, 'download');
    return data!;
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async delete(paths: string | string[]): Promise<void> {
    const targets = Array.isArray(paths) ? paths : [paths];

    const { error } = await this.client.storage
      .from(this.bucket)
      .remove(targets);

    this.throwOnError(error, 'delete');
  }

  // ── Move ───────────────────────────────────────────────────────────────────

  async move(options: MoveFileOptions): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .move(options.fromPath, options.toPath);

    this.throwOnError(error, 'move');
  }

  // ── Copy ───────────────────────────────────────────────────────────────────

  async copy(options: CopyFileOptions): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .copy(options.fromPath, options.toPath);

    this.throwOnError(error, 'copy');
  }

  // ── Signed URL (private buckets) ───────────────────────────────────────────

  async createSignedUrl(
    path: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);

    this.throwOnError(error, 'createSignedUrl');
    return data!.signedUrl;
  }
}

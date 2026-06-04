export type UploadFileOptions = {
  /** Destination path inside the bucket e.g. "events/cover.jpg" */
  path: string;
  file: Buffer | Uint8Array;
  mimetype: string;
  /** Overwrite if file already exists. Defaults to true. */
  upsert?: boolean;
};

export type UploadFileResponse = {
  path: string;
  publicUrl: string;
};

export type MoveFileOptions = {
  fromPath: string;
  toPath: string;
};

export type CopyFileOptions = {
  fromPath: string;
  toPath: string;
};

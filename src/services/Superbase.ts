import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "";

const client: SupabaseClient = createClient(url, anonKey);

export async function uploadImage(
  file: File,
  folder = "events",
): Promise<string> {
  if (!url || !anonKey || !bucket) {
    throw new Error("Supabase env vars not configured");
  }

  const path = `${folder}/${Date.now()}-${file.name}`;

  const { error } = await client.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) throw new Error(error.message);

  const { data } = client.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
}

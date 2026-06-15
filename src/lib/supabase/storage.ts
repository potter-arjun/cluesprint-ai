import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const BUCKETS = {
  SUBMISSIONS: 'submissions',
  AVATARS: 'avatars',
} as const

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS]

/**
 * Upload a file to a Supabase Storage bucket.
 * Returns the public URL on success or an error message on failure.
 */
export async function uploadFile(
  supabase: SupabaseClient<Database>,
  bucket: BucketName,
  path: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })

  if (error) {
    return { url: null, error: error.message }
  }

  const url = getPublicUrl(supabase, bucket, path)
  return { url, error: null }
}

/**
 * Delete a file from a Supabase Storage bucket.
 */
export async function deleteFile(
  supabase: SupabaseClient<Database>,
  bucket: BucketName,
  path: string
): Promise<void> {
  await supabase.storage.from(bucket).remove([path])
}

/**
 * Retrieve the public URL for a stored file without making a network request.
 */
export function getPublicUrl(
  supabase: SupabaseClient<Database>,
  bucket: BucketName,
  path: string
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload a submission media file and return its public URL.
 * Storage path: submissions/{teamId}/{missionId}/{uuid}.{ext}
 */
export async function uploadSubmissionMedia(
  supabase: SupabaseClient<Database>,
  teamId: string,
  missionId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const uuid = crypto.randomUUID()
  const path = `${teamId}/${missionId}/${uuid}.${ext}`

  const { url, error } = await uploadFile(supabase, BUCKETS.SUBMISSIONS, path, file)

  if (error || !url) {
    throw new Error(error ?? 'Failed to upload submission media')
  }

  return url
}

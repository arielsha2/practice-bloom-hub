import { supabase } from '@/integrations/supabase/client';

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const PHOTO_MAX_INPUT_BYTES = 10 * 1024 * 1024;
const PHOTO_MAX_SIDE = 1200;

// Scales the photo down to at most 1200px on the long side and re-encodes it as JPEG (about 100-300KB), so a phone
// photo does not cost storage and bandwidth every time the page loads. A photo that cannot be decoded is rejected.
async function shrinkPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('unreadable image');
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
  if (!blob) throw new Error('encode failed');
  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
}

export type PhotoResult = { ok: true; url: string } | { ok: false; message: string };

export async function uploadSitePhoto(userId: string, original: File): Promise<PhotoResult> {
  if (!PHOTO_TYPES.includes(original.type)) return { ok: false, message: 'אפשר להעלות תמונה בפורמט JPG, PNG או WebP בלבד' };
  if (original.size > PHOTO_MAX_INPUT_BYTES) return { ok: false, message: 'התמונה גדולה מדי. אפשר להעלות תמונה עד 10MB' };
  try {
    const file = await shrinkPhoto(original);
    const path = `${userId}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('therapist-websites').upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return { ok: true, url: supabase.storage.from('therapist-websites').getPublicUrl(path).data.publicUrl };
  } catch (e) {
    console.error(e);
    return { ok: false, message: 'העלאת התמונה נכשלה' };
  }
}

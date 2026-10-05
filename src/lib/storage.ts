/**
 * Storage URL utility for Portfolio Demo
 * 
 * In demo mode, we don't have a backend to serve images.
 * Returns placeholder URLs or null for missing images.
 */

export function storageUrl(path: string | null | undefined, bustCache?: string | number): string | null {
  if (!path) return null;
  
  // Return directly if it's already an absolute URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // In demo mode, return a placeholder avatar/image
  // This prevents broken image links across the app
  return null;
}

export function thumbnailUrl(path: string | null | undefined, type: 'students' | 'teachers'): string | null {
  if (!path) return null;
  return null;
}

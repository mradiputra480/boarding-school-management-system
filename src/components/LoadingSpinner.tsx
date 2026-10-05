import { Loader2 } from 'lucide-react';

/**
 * Full-screen loading spinner shown during lazy-loaded page transitions.
 * Uses the IIS Islamic Green theme color for consistency.
 */
export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="animate-spin"
          style={{ color: '#2d7a50', width: 48, height: 48 }}
        />
        <p className="text-sm text-muted-foreground animate-pulse">
          Memuat halaman...
        </p>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';

export default function Chip({ children, onDismiss }: { children: ReactNode; onDismiss?: () => void }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
      {children}
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Remove"
          className="text-neutral-400 transition-colors duration-150 hover:text-black dark:text-neutral-500 dark:hover:text-white"
        >
          ×
        </button>
      )}
    </span>
  );
}

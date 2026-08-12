// iOS has no beforeinstallprompt event — Add to Home Screen only works
// through this manual Safari flow, so it needs its own explanation.
export default function InstallInstructions() {
  return (
    <div className="border-t border-neutral-200 pt-4 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
      <h2 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">Install on iPhone</h2>
      <ol className="list-inside list-decimal space-y-1">
        <li>Open this page in Safari.</li>
        <li>Tap the Share icon (square with an arrow) in the toolbar.</li>
        <li>Scroll down and tap "Add to Home Screen".</li>
        <li>Tap "Add" — OneLife then opens full-screen from your Home Screen, no browser chrome.</li>
      </ol>
    </div>
  );
}

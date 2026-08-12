// Grows to 'habits' | 'settings' as those screens land in later phases —
// not stubbed in ahead of time.
export type Screen = 'today' | 'inbox';

const TABS: { id: Screen; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'inbox', label: 'Inbox' },
];

export default function BottomTabBar({
  active,
  onChange,
}: {
  active: Screen;
  onChange: (screen: Screen) => void;
}) {
  return (
    <nav
      className="flex border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 py-3 text-xs uppercase tracking-wide ${
            active === tab.id ? 'text-black dark:text-white' : 'text-neutral-400 dark:text-neutral-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

export type Screen = 'today' | 'inbox' | 'habits' | 'calendar' | 'settings';

const TABS: { id: Screen; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'inbox', label: 'Inbox' },
  { id: 'habits', label: 'Habits' },
  { id: 'calendar', label: 'Agenda' },
  { id: 'settings', label: 'Settings' },
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
          className={`flex-1 py-3 text-xs uppercase tracking-wide transition-colors duration-150 ${
            active === tab.id ? 'text-black dark:text-white' : 'text-neutral-400 dark:text-neutral-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

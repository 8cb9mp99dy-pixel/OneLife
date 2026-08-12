// 0 = Sunday .. 6 = Saturday, matching Date.prototype.getDay().
export const WEEKDAYS: Record<string, number> = {
  dimanche: 0,
  sunday: 0,
  lundi: 1,
  monday: 1,
  mardi: 2,
  tuesday: 2,
  mercredi: 3,
  wednesday: 3,
  jeudi: 4,
  thursday: 4,
  vendredi: 5,
  friday: 5,
  samedi: 6,
  saturday: 6,
};

export const TOMORROW_PATTERN = /\b(demain|tomorrow)\b/i;
export const TONIGHT_PATTERN = /\b(ce soir|tonight)\b/i;
export const IN_N_DAYS_PATTERN = /\b(?:dans\s+(\d+)\s+jours?|in\s+(\d+)\s+days?)\b/i;
export const WEEKDAY_PATTERN = new RegExp(`\\b(${Object.keys(WEEKDAYS).join('|')})\\b`, 'i');

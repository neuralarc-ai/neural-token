import type { TokenEntry, ChartDataItem, Period } from '@/types';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subWeeks, subMonths, getWeek, getMonth, getYear } from 'date-fns';

export const aggregateTokenData = (
  tokenEntries: TokenEntry[],
  apiKeyId: string | null, // Can be null if "All Keys" is selected
  period: Period,
  numPeriods: number = 12 // Number of past periods to show (e.g., 12 days, 12 weeks, 12 months)
): ChartDataItem[] => {
  const now = new Date();
  let intervalStart: Date;
  let intervalEnd: Date = now;
  let datePoints: Date[];

  const filteredEntries = apiKeyId 
    ? tokenEntries.filter(entry => entry.apiKeyId === apiKeyId)
    : tokenEntries;

  switch (period) {
    case 'daily':
      intervalStart = subDays(now, numPeriods -1);
      datePoints = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
      return datePoints.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const tokens = filteredEntries
          .filter(entry => entry.date === dateStr)
          .reduce((sum, entry) => sum + entry.tokens, 0);
        return { name: format(date, 'MMM d'), tokens };
      });

    case 'weekly':
      intervalStart = startOfWeek(subWeeks(now, numPeriods -1));
      datePoints = eachWeekOfInterval({ start: intervalStart, end: intervalEnd }, { weekStartsOn: 1 }); // Monday
      return datePoints.map(weekStartDate => {
        const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
        const tokens = filteredEntries
          .filter(entry => {
            const entryDate = parseISO(entry.date);
            return entryDate >= weekStartDate && entryDate <= weekEndDate;
          })
          .reduce((sum, entry) => sum + entry.tokens, 0);
        return { name: `W${getWeek(weekStartDate)} ${format(weekStartDate, 'MMM d')}`, tokens };
      });

    case 'monthly':
      intervalStart = startOfMonth(subMonths(now, numPeriods-1));
      datePoints = eachMonthOfInterval({ start: intervalStart, end: intervalEnd });
      return datePoints.map(monthStartDate => {
        const monthEndDate = endOfMonth(monthStartDate);
        const tokens = filteredEntries
          .filter(entry => {
            const entryDate = parseISO(entry.date);
            return entryDate >= monthStartDate && entryDate <= monthEndDate;
          })
          .reduce((sum, entry) => sum + entry.tokens, 0);
        return { name: format(monthStartDate, 'MMM yyyy'), tokens };
      });
      
    default:
      return [];
  }
};

export const getTotalTokens = (
  tokenEntries: TokenEntry[],
  apiKeyId: string | null,
  period: Period
): number => {
  const now = new Date();
  let startDate: Date;

  const filteredEntries = apiKeyId 
    ? tokenEntries.filter(entry => entry.apiKeyId === apiKeyId)
    : tokenEntries;

  switch (period) {
    case 'daily':
      startDate = now; // Only today
      break;
    case 'weekly':
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'monthly':
      startDate = startOfMonth(now);
      break;
    default:
      return 0;
  }

  return filteredEntries
    .filter(entry => parseISO(entry.date) >= startDate)
    .reduce((sum, entry) => sum + entry.tokens, 0);
};

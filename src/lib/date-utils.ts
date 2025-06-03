
import type { TokenEntry, ChartDataItem, Period, StoredApiKey } from '@/types';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subWeeks, subMonths, getWeek, getYear } from 'date-fns';

export const aggregateTokenData = (
  tokenEntries: TokenEntry[],
  allApiKeys: StoredApiKey[], // All available API keys
  selectedApiKeyId: string | null, // Can be null if "All Keys" is selected
  period: Period,
  numPeriods: number = 12
): ChartDataItem[] => {
  const now = new Date();
  let intervalStart: Date;
  let intervalEnd: Date = now;
  let datePoints: Date[];

  // Determine which API keys to process based on selection
  const relevantApiKeys = selectedApiKeyId
    ? allApiKeys.filter(key => key.id === selectedApiKeyId)
    : allApiKeys;

  if (relevantApiKeys.length === 0 && selectedApiKeyId) {
    // If a specific key is selected but not found in allApiKeys (should not happen with good data)
    return [];
  }


  const getDatePointName = (date: Date, p: Period, weekStartDate?: Date): string => {
    switch (p) {
      case 'daily':
        return format(date, 'MMM d');
      case 'weekly':
        // For weekly, ensure the year is included if the week spans across year end/start
        // or if the period being displayed might cross a year boundary.
        // A simple way is to always include year for weekly for consistency if numPeriods is large.
        // For now, just formatting based on the week's start date.
        return `W${getWeek(weekStartDate || date)} ${format(weekStartDate || date, 'MMM d')}`;
      case 'monthly':
        return format(date, 'MMM yyyy');
      default:
        return '';
    }
  };

  const processPeriod = (
    getIntervals: (start: Date, end: Date) => Date[],
    getRange: (datePoint: Date) => { start: Date; end: Date }
  ): ChartDataItem[] => {
    datePoints = getIntervals(intervalStart, intervalEnd);
    return datePoints.map(datePoint => {
      const range = getRange(datePoint);
      const chartItem: ChartDataItem = {
        name: getDatePointName(datePoint, period, period === 'weekly' ? datePoint : undefined),
      };

      relevantApiKeys.forEach(apiKey => {
        const tokensForApiKey = tokenEntries
          .filter(entry => {
            if (entry.apiKeyId !== apiKey.id) return false;
            const entryDate = parseISO(entry.date); // entry.date is 'yyyy-MM-dd'
            // Ensure comparison is date-only by normalizing times if necessary,
            // though start/end of day/week/month from date-fns handles this.
            return entryDate >= range.start && entryDate <= range.end;
          })
          .reduce((sum, entry) => sum + entry.tokens, 0);
        chartItem[apiKey.name] = tokensForApiKey;
      });
      return chartItem;
    });
  };


  switch (period) {
    case 'daily':
      intervalStart = subDays(now, numPeriods - 1);
      // For daily, we directly filter by the 'yyyy-MM-dd' string, so getRange is simpler.
      // The mapping to 'MMM d' is for display.
      datePoints = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
      return datePoints.map(datePoint => {
        const chartItem: ChartDataItem = {
          name: getDatePointName(datePoint, 'daily'),
        };
        const dateForFilteringStr = format(datePoint, 'yyyy-MM-dd');
        relevantApiKeys.forEach(apiKey => {
          const dailyTokens = tokenEntries
            .filter(entry => entry.apiKeyId === apiKey.id && entry.date === dateForFilteringStr)
            .reduce((sum, entry) => sum + entry.tokens, 0);
          chartItem[apiKey.name] = dailyTokens;
        });
        return chartItem;
      });


    case 'weekly':
      intervalStart = startOfWeek(subWeeks(now, numPeriods - 1), { weekStartsOn: 1 });
      const customEachWeekOfInterval = (start: Date, end: Date) => eachWeekOfInterval({start,end}, {weekStartsOn: 1});

      return processPeriod(
        customEachWeekOfInterval,
        datePoint => ({ start: startOfWeek(datePoint, { weekStartsOn: 1 }), end: endOfWeek(datePoint, { weekStartsOn: 1 }) })
      );

    case 'monthly':
      intervalStart = startOfMonth(subMonths(now, numPeriods - 1));
      return processPeriod(
        (start, end) => eachMonthOfInterval({ start, end }),
        datePoint => ({ start: startOfMonth(datePoint), end: endOfMonth(datePoint) })
      );

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
  let endDate: Date = now; // For weekly/monthly, sum up to current date within the period

  const filteredEntries = apiKeyId
    ? tokenEntries.filter(entry => entry.apiKeyId === apiKeyId)
    : tokenEntries;

  switch (period) {
    case 'daily':
      const todayStr = format(now, 'yyyy-MM-dd');
      return filteredEntries
        .filter(entry => entry.date === todayStr)
        .reduce((sum, entry) => sum + entry.tokens, 0);
    case 'weekly':
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      // endDate is already 'now'
      break;
    case 'monthly':
      startDate = startOfMonth(now);
      // endDate is already 'now'
      break;
    default:
      return 0;
  }
  
  // For weekly and monthly, filter entries on or after the period's start date and up to 'now'
  return filteredEntries
    .filter(entry => {
      const entryDate = parseISO(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    })
    .reduce((sum, entry) => sum + entry.tokens, 0);
};

// Helper to reconstruct year for daily items if needed, though simpler approach is to use yyyy-MM-dd directly for filtering
// This was part of the problematic line and is now handled differently.
// Keeping it commented for context if complex date parsing was intended.
// const getYearFromDailyName = (name: string, currentYear: number): number => {
//   // This logic would be needed if 'MMM d' names could span year boundaries for daily view,
//   // but daily view is usually within a shorter, recent timeframe.
//   // For simplicity, we assume daily names are for the current year context unless specified.
//   return currentYear;
// };


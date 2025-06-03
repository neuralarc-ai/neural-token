
import type { TokenEntry, ChartDataItem, Period, StoredApiKey } from '@/types';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subWeeks, subMonths, getWeek } from 'date-fns';

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
            const entryDate = parseISO(entry.date);
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
      return processPeriod(
        (start, end) => eachDayOfInterval({ start, end }),
        datePoint => ({ start: datePoint, end: datePoint }) // Daily entries match exact date
      ).map(item => { // Ensure correct date string for daily entries matching
        const dateForFiltering = parseISO(item.name === format(now, 'MMM d') ? format(now, 'yyyy-MM-dd') : format(parseISO(item.name + ` ${getYear(now)}`), 'yyyy-MM-dd'));
         relevantApiKeys.forEach(apiKey => {
            const dailyTokens = tokenEntries
            .filter(entry => entry.apiKeyId === apiKey.id && entry.date === format(dateForFiltering, 'yyyy-MM-dd'))
            .reduce((sum, entry) => sum + entry.tokens, 0);
            item[apiKey.name] = dailyTokens;
        });
        return item;
      });


    case 'weekly':
      intervalStart = startOfWeek(subWeeks(now, numPeriods - 1), { weekStartsOn: 1 });
      // Ensure eachWeekOfInterval uses the same weekStartSystem
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

  const filteredEntries = apiKeyId
    ? tokenEntries.filter(entry => entry.apiKeyId === apiKeyId)
    : tokenEntries;

  switch (period) {
    case 'daily':
      // Sum for 'today' based on entries matching today's date string
      const todayStr = format(now, 'yyyy-MM-dd');
      return filteredEntries
        .filter(entry => entry.date === todayStr)
        .reduce((sum, entry) => sum + entry.tokens, 0);
    case 'weekly':
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'monthly':
      startDate = startOfMonth(now);
      break;
    default:
      return 0;
  }
  
  // For weekly and monthly, filter entries on or after the period's start date
  if (period === 'weekly' || period === 'monthly') {
    return filteredEntries
      .filter(entry => parseISO(entry.date) >= startDate)
      .reduce((sum, entry) => sum + entry.tokens, 0);
  }
  return 0; // Should be covered by daily case
};

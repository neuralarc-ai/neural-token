
import type { TokenEntry, ChartDataItem, Period, StoredApiKey } from '@/types';
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subWeeks, subMonths, getWeek } from 'date-fns';

export const aggregateTokenData = (
  tokenEntries: TokenEntry[],
  allApiKeys: StoredApiKey[], 
  selectedApiKeyId: string | null, 
  period: Period,
  activeProvider: string, // Added to determine if we are on the "Home" view for aggregation
  numPeriods: number = 12
): ChartDataItem[] => {
  const now = new Date();
  let intervalStart: Date;
  let intervalEnd: Date = now;
  let datePoints: Date[];

  const isHomeViewAggregation = activeProvider === "Home" && selectedApiKeyId === null;

  const relevantApiKeys = selectedApiKeyId
    ? allApiKeys.filter(key => key.id === selectedApiKeyId)
    : allApiKeys;

  if (!isHomeViewAggregation && relevantApiKeys.length === 0 && selectedApiKeyId) {
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

      if (isHomeViewAggregation) {
        let totalTokensForDatePoint = 0;
        allApiKeys.forEach(apiKey => { // Iterate over ALL keys for home aggregation
          const tokensForThisKey = tokenEntries
            .filter(entry => {
              if (entry.apiKeyId !== apiKey.id) return false;
              const entryDate = parseISO(entry.date);
              return entryDate >= range.start && entryDate <= range.end;
            })
            .reduce((sum, entry) => sum + entry.tokens, 0);
          totalTokensForDatePoint += tokensForThisKey;
        });
        chartItem["Total Usage"] = totalTokensForDatePoint;
      } else {
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
      }
      return chartItem;
    });
  };

  switch (period) {
    case 'daily':
      intervalStart = subDays(now, numPeriods - 1);
      datePoints = eachDayOfInterval({ start: intervalStart, end: intervalEnd });
      return datePoints.map(datePoint => {
        const chartItem: ChartDataItem = {
          name: getDatePointName(datePoint, 'daily'),
        };
        const dateForFilteringStr = format(datePoint, 'yyyy-MM-dd');

        if (isHomeViewAggregation) {
          let totalTokensForDatePoint = 0;
          allApiKeys.forEach(apiKey => {
            const dailyTokens = tokenEntries
              .filter(entry => entry.apiKeyId === apiKey.id && entry.date === dateForFilteringStr)
              .reduce((sum, entry) => sum + entry.tokens, 0);
            totalTokensForDatePoint += dailyTokens;
          });
          chartItem["Total Usage"] = totalTokensForDatePoint;
        } else {
          relevantApiKeys.forEach(apiKey => {
            const dailyTokens = tokenEntries
              .filter(entry => entry.apiKeyId === apiKey.id && entry.date === dateForFilteringStr)
              .reduce((sum, entry) => sum + entry.tokens, 0);
            chartItem[apiKey.name] = dailyTokens;
          });
        }
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
  apiKeyId: string | null, // If null, calculates for ALL keys (used for Home view summary)
  period: Period,
  activeProvider: string, // Added to help determine context
  allApiKeysForProvider?: StoredApiKey[] // Used when activeProvider is specific
): number => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  let entriesToConsider = tokenEntries;

  if (activeProvider === "Home" && apiKeyId === null) {
    // No specific key filtering, consider all entries
  } else if (apiKeyId) {
    entriesToConsider = tokenEntries.filter(entry => entry.apiKeyId === apiKeyId);
  } else if (allApiKeysForProvider) { // Provider specific "All Keys"
    const providerKeyIds = new Set(allApiKeysForProvider.map(k => k.id));
    entriesToConsider = tokenEntries.filter(entry => providerKeyIds.has(entry.apiKeyId));
  }


  switch (period) {
    case 'daily':
      const todayStr = format(now, 'yyyy-MM-dd');
      return entriesToConsider
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
  
  return entriesToConsider
    .filter(entry => {
      const entryDate = parseISO(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    })
    .reduce((sum, entry) => sum + entry.tokens, 0);
};

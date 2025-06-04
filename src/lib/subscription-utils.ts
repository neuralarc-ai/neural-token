
import type { SubscriptionEntry } from '@/types';

export const calculateTotalMonthlySubscriptionCost = (subscriptions: SubscriptionEntry[]): number => {
  if (!subscriptions || subscriptions.length === 0) {
    return 0;
  }

  return subscriptions.reduce((total, sub) => {
    if (sub.billingCycle === 'yearly') {
      return total + sub.amount / 12;
    }
    return total + sub.amount;
  }, 0);
};


"use client";

import type { SubscriptionEntry, BillingCycle } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Save, X, CreditCard, Loader2 } from 'lucide-react'; // Added Loader2
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
// useToast removed as it's handled by React Query's onSuccess/onError in page.tsx

const subscriptionSchema = z.object({
  name: z.string().min(1, 'Subscription name is required').max(100, 'Name must be 100 characters or less'),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  billingCycle: z.enum(['monthly', 'yearly'], { required_error: 'Billing cycle is required.' }),
  startDate: z.date({ required_error: 'Start date is required.' }),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

interface SubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscription: SubscriptionEntry) => void;
  existingSubscription?: SubscriptionEntry; 
  isSaving?: boolean; // Added isSaving prop
}

export function SubscriptionDialog({ isOpen, onClose, onSave, existingSubscription, isSaving }: SubscriptionDialogProps) {
  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: existingSubscription
      ? {
          name: existingSubscription.name,
          amount: existingSubscription.amount,
          billingCycle: existingSubscription.billingCycle,
          startDate: new Date(existingSubscription.startDate),
          category: existingSubscription.category || "",
          notes: existingSubscription.notes || "",
        }
      : {
          name: '',
          amount: undefined, 
          billingCycle: 'monthly',
          startDate: new Date(),
          category: "",
          notes: "",
        },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(existingSubscription
        ? {
            name: existingSubscription.name,
            amount: existingSubscription.amount,
            billingCycle: existingSubscription.billingCycle,
            startDate: new Date(existingSubscription.startDate),
            category: existingSubscription.category || "",
            notes: existingSubscription.notes || "",
          }
        : {
            name: '',
            amount: undefined,
            billingCycle: 'monthly',
            startDate: new Date(),
            category: "",
            notes: "",
          }
      );
    }
  }, [isOpen, existingSubscription, form]);

  const onSubmit = (data: SubscriptionFormData) => {
    const subscriptionToSave: SubscriptionEntry = {
      id: existingSubscription?.id || crypto.randomUUID(),
      createdAt: existingSubscription?.createdAt || new Date().toISOString(),
      name: data.name,
      amount: data.amount,
      billingCycle: data.billingCycle as BillingCycle,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      category: data.category || undefined,
      notes: data.notes || undefined,
    };
    onSave(subscriptionToSave);
    // Toast handled by mutation in page.tsx
    // onClose(); // onClose is typically called by the mutation's onSuccess
  };

  const dialogTitle = existingSubscription ? 'Edit Subscription' : 'Add New Subscription';
  const dialogDescription = existingSubscription
    ? 'Update the details for your subscription.'
    : 'Enter the details for your new subscription.';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSaving) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground rounded-xl shadow-neo border-2 border-black p-0">
        <DialogHeader className="p-6 pb-4 border-b-2 border-black">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Subscription Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Netflix, Spotify Premium" {...field} className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo" disabled={isSaving}/>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Amount (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="E.g., 10.99" {...field} className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo" disabled={isSaving}/>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billingCycle"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-semibold">Billing Cycle</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4 pt-1"
                      disabled={isSaving}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="monthly" id="monthly" className="border-black text-primary focus:ring-primary checked:border-primary" disabled={isSaving}/>
                        </FormControl>
                        <FormLabel htmlFor="monthly" className="font-medium text-sm">Monthly</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="yearly" id="yearly" className="border-black text-primary focus:ring-primary checked:border-primary" disabled={isSaving}/>
                        </FormControl>
                        <FormLabel htmlFor="yearly" className="font-medium text-sm">Yearly</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-semibold">Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-medium text-sm h-11 rounded-md border-2 border-black shadow-neo-sm hover:shadow-neo focus:shadow-neo',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isSaving}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-md border-2 border-black shadow-neo bg-card" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('2000-01-01') || !!isSaving}
                        initialFocus
                        className="rounded-md"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs text-destructive"/>
                </FormItem>
              )}
            />
            {/* Optional fields can be added later if needed: category, notes */}
            <DialogFooter className="pt-5 gap-3 sm:gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-11 text-sm px-5 rounded-md border-2 border-black shadow-neo-sm hover:shadow-neo active:shadow-none font-semibold" disabled={isSaving}>
                <X className="mr-1.5 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" className="h-11 text-sm px-5 rounded-md border-2 border-black shadow-neo hover:shadow-neo-sm active:shadow-none font-semibold" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Subscription"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

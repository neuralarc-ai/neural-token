
"use client";

import type { TokenEntry, StoredApiKey } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Save, X, Loader2 } from 'lucide-react'; // Added Loader2
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
import { cn } from '@/lib/utils';
// useToast removed as it's handled by React Query's onSuccess/onError in page.tsx

const tokenEntrySchema = z.object({
  date: z.date({ required_error: 'Date is required.' }),
  tokens: z.string()
    .min(1, 'Tokens amount is required.')
    .transform((val, ctx) => {
      const lowerVal = val.toLowerCase().trim().replace(/\s/g, '');
      let numericValue: number;

      if (lowerVal.endsWith('k')) {
        const numPartString = lowerVal.substring(0, lowerVal.length - 1);
        if (numPartString === "") {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Invalid "k" format. Number is missing before "k". E.g., 1.5k',
            });
            return z.NEVER; 
        }
        const numPart = parseFloat(numPartString);
        if (isNaN(numPart)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid number before "k". E.g., 1.5k',
          });
          return z.NEVER;
        }
        numericValue = numPart * 1000;
      } else {
        if (lowerVal === "" && val.trim() !== "") { 
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Tokens amount is required.',
            });
            return z.NEVER;
        }
        numericValue = parseFloat(lowerVal);
        if (isNaN(numericValue)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid format. Must be a number (e.g., 1500) or use "k" suffix (e.g., 1.5k).',
          });
          return z.NEVER;
        }
      }
      
      if (numericValue < 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tokens must be a non-negative number.',
          });
        return z.NEVER;
      }
      return numericValue;
    }),
});

type TokenEntryFormData = z.infer<typeof tokenEntrySchema>;

interface TokenEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tokenEntry: TokenEntry) => void;
  apiKey: StoredApiKey | null;
  existingEntry?: TokenEntry;
  isSaving?: boolean; // Added isSaving prop
}

export function TokenEntryDialog({ isOpen, onClose, onSave, apiKey, existingEntry, isSaving }: TokenEntryDialogProps) {
  const form = useForm<TokenEntryFormData>({
    resolver: zodResolver(tokenEntrySchema),
    defaultValues: {
        date: new Date(),
        tokens: "", 
    }
  });

  useEffect(() => {
    if (isOpen) {
        form.reset(existingEntry
            ? { date: new Date(existingEntry.date), tokens: existingEntry.tokens.toString() }
            : { date: new Date(), tokens: "" } 
        );
    }
  }, [isOpen, existingEntry, form]);


  if (!apiKey) return null;

  const onSubmit = (data: TokenEntryFormData) => {
    const tokenEntryToSave: TokenEntry = {
      id: existingEntry?.id || crypto.randomUUID(),
      apiKeyId: apiKey.id,
      date: format(data.date, 'yyyy-MM-dd'),
      tokens: data.tokens, 
      createdAt: existingEntry?.createdAt || new Date().toISOString(),
    };
    onSave(tokenEntryToSave);
    // Toast handled by mutation in page.tsx
    // onClose(); // onClose is typically called by the mutation's onSuccess
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSaving) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground rounded-xl shadow-neo border-2 border-black p-0">
        <DialogHeader className="p-6 pb-4 border-b-2 border-black">
          <DialogTitle className="text-xl font-bold">Log Token Usage</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            For API Key: <span className="font-semibold text-primary">{apiKey.name}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-semibold">Date of Usage</FormLabel>
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
                        disabled={(date) =>
                          date > new Date() || date < new Date('2000-01-01') || !!isSaving
                        }
                        initialFocus
                        className="rounded-md"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs text-destructive"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Tokens Used</FormLabel>
                  <FormControl>
                    <Input 
                      type="text" 
                      placeholder="e.g., 1500 or 1.5k" 
                      {...field} 
                      className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo"
                      disabled={isSaving}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-destructive"/>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-5 gap-3 sm:gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-11 text-sm px-5 rounded-md border-2 border-black shadow-neo-sm hover:shadow-neo active:shadow-none font-semibold" disabled={isSaving}>
                <X className="mr-1.5 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" className="h-11 text-sm px-5 rounded-md border-2 border-black shadow-neo hover:shadow-neo-sm active:shadow-none font-semibold" disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import type { TokenEntry, ApiKey } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Save, X } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const tokenEntrySchema = z.object({
  date: z.date({ required_error: 'Date is required.' }),
  tokens: z.coerce.number().min(0, 'Tokens must be a positive number.'),
});

type TokenEntryFormData = z.infer<typeof tokenEntrySchema>;

interface TokenEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tokenEntry: TokenEntry) => void;
  apiKey: ApiKey | null;
  existingEntry?: TokenEntry; // For editing, though prompt focuses on daily input
}

export function TokenEntryDialog({ isOpen, onClose, onSave, apiKey, existingEntry }: TokenEntryDialogProps) {
  const { toast } = useToast();
  const form = useForm<TokenEntryFormData>({
    resolver: zodResolver(tokenEntrySchema),
    defaultValues: existingEntry
      ? { date: new Date(existingEntry.date), tokens: existingEntry.tokens }
      : { date: new Date(), tokens: 0 },
  });

  useEffect(() => {
    if (isOpen) {
        form.reset(existingEntry
            ? { date: new Date(existingEntry.date), tokens: existingEntry.tokens }
            : { date: new Date(), tokens: 0 }
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
    toast({ title: 'Token Entry Saved', description: `Tokens for ${apiKey.name} on ${format(data.date, 'PPP')} recorded.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>Add Token Usage for {apiKey.name}</DialogTitle>
          <DialogDescription>
            Enter the number of tokens used on a specific date.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tokens Used</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 15000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> Save Entry
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

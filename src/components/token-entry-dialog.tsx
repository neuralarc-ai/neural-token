
"use client";

import type { TokenEntry, StoredApiKey } from '@/types'; // Changed ApiKey to StoredApiKey
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
  tokens: z.coerce.number().min(0, 'Tokens must be a non-negative number.'),
});

type TokenEntryFormData = z.infer<typeof tokenEntrySchema>;

interface TokenEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tokenEntry: TokenEntry) => void;
  apiKey: StoredApiKey | null; // Changed ApiKey to StoredApiKey
  existingEntry?: TokenEntry;
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
            : { date: new Date(), tokens: undefined } // Set tokens to undefined to show placeholder
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
    toast({ title: 'Token Entry Saved', description: `Tokens for ${apiKey.name} on ${format(data.date, 'PP')} recorded.` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground rounded-lg shadow-xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-lg">Log Token Usage</DialogTitle>
          <DialogDescription className="text-xs">
            For API Key: <span className="font-medium text-primary">{apiKey.name}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 pb-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs">Date of Usage</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal text-sm h-9',
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
                          date > new Date() || date < new Date('2000-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tokens Used</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 15000" {...field} className="text-sm h-9"/>
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs px-3">
                <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
              </Button>
              <Button type="submit" className="h-9 text-xs px-3">
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save Entry
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

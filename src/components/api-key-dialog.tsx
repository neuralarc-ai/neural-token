
"use client";

import type { StoredApiKey } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';

const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  model: z.string().min(1, 'Model is required').max(50, 'Model must be 50 characters or less'),
  fullKey: z.string().min(1, 'API Key is required'),
});

type ApiKeyFormData = z.infer<typeof apiKeySchema>;

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: StoredApiKey) => void;
  existingApiKey?: StoredApiKey;
}

export function ApiKeyDialog({ isOpen, onClose, onSave, existingApiKey }: ApiKeyDialogProps) {
  const { toast } = useToast();
  const form = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: existingApiKey || { name: '', model: '', fullKey: '' },
  });

  useEffect(() => {
    if (isOpen) { // Reset form only when dialog opens or existingApiKey changes
        if (existingApiKey) {
        form.reset(existingApiKey);
        } else {
        form.reset({ name: '', model: '', fullKey: '' });
        }
    }
  }, [existingApiKey, form, isOpen]);

  const onSubmit = (data: ApiKeyFormData) => {
    const keyFragment = data.fullKey.substring(0, 4) + '...' + data.fullKey.substring(data.fullKey.length - 4);
    const apiKeyToSave: StoredApiKey = {
      id: existingApiKey?.id || crypto.randomUUID(),
      createdAt: existingApiKey?.createdAt || new Date().toISOString(),
      ...data,
      keyFragment,
    };
    onSave(apiKeyToSave);
    toast({ title: existingApiKey ? 'API Key Updated' : 'API Key Added', description: `"${data.name}" has been saved.` });
    onClose(); // Ensure onClose is called to close the dialog
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground rounded-lg shadow-xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <DialogTitle className="text-lg">{existingApiKey ? 'Edit API Key' : 'Add New API Key'}</DialogTitle>
          <DialogDescription className="text-xs">
            {existingApiKey ? 'Update the details for your API key.' : 'Enter the details for your new API key.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 pb-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Key Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., My OpenAI Key" {...field} className="text-sm h-9"/>
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">AI Model</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., OpenAI GPT-4, Gemini Pro" {...field} className="text-sm h-9"/>
                  </FormControl>
                  <FormMessage className="text-xs"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">API Key Value</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="sk-xxxxxxxxxxxx" {...field} className="text-sm h-9"/>
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
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save Key
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

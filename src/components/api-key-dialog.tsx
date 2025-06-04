
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
  defaultProvider?: string; // Used to pre-fill model or name if applicable
}

export function ApiKeyDialog({ isOpen, onClose, onSave, existingApiKey, defaultProvider }: ApiKeyDialogProps) {
  const { toast } = useToast();
  
  const getInitialValues = () => {
    if (existingApiKey) {
      return { name: existingApiKey.name, model: existingApiKey.model, fullKey: existingApiKey.fullKey };
    }
    if (defaultProvider && defaultProvider !== "Home") {
      // You can customize how the defaultProvider influences the form.
      // For example, pre-fill model with common model for that provider or part of the name.
      return { name: `${defaultProvider} Key`, model: `${defaultProvider} Model (e.g., gpt-4, gemini-pro)`, fullKey: '' };
    }
    return { name: '', model: '', fullKey: '' };
  };

  const form = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: getInitialValues(),
  });

  useEffect(() => {
    if (isOpen) {
      form.reset(getInitialValues());
    }
  }, [existingApiKey, defaultProvider, form, isOpen]);

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
    onClose();
  };

  const dialogTitle = existingApiKey 
    ? 'Edit API Key' 
    : defaultProvider && defaultProvider !== "Home" 
    ? `Add New ${defaultProvider} API Key` 
    : 'Add New API Key';

  const dialogDescription = existingApiKey
    ? 'Update the details for your API key.'
    : `Enter the details for your new ${defaultProvider && defaultProvider !== "Home" ? defaultProvider + " " : ""}API key.`;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground rounded-xl shadow-neo border-2 border-black p-0">
        <DialogHeader className="p-6 pb-4 border-b-2 border-black">
          <DialogTitle className="text-xl font-bold">{dialogTitle}</DialogTitle>
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
                  <FormLabel className="text-sm font-semibold">Key Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., My Personal Key" {...field} className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo"/>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">AI Model / Provider</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., OpenAI GPT-4, Gemini Pro, Claude Opus" {...field} className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo"/>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive"/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">API Key Value</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="sk-xxxxxxxxxxxx" {...field} className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo"/>
                  </FormControl>
                  <FormMessage className="text-xs text-destructive"/>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-5 gap-3 sm:gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-11 text-sm px-5 rounded-md border-2 border-black shadow-neo-sm hover:shadow-neo active:shadow-none font-semibold">
                <X className="mr-1.5 h-4 w-4" /> Cancel
              </Button>
              <Button type="submit" className="h-11 text-sm px-5 rounded-md border-2 border-black shadow-neo hover:shadow-neo-sm active:shadow-none font-semibold">
                <Save className="mr-1.5 h-4 w-4" /> Save Key
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

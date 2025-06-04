
"use client";

import type { StoredApiKey } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const modelOptions = ["OpenAI", "Gemini", "Claude", "Deepseek", "Grok"] as const;

const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  model: z.enum(modelOptions, { required_error: 'Please select a model provider.' }),
  fullKey: z.string().min(1, 'API Key is required'),
});

type ApiKeyFormData = z.infer<typeof apiKeySchema>;

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: StoredApiKey) => void;
  existingApiKey?: StoredApiKey;
  defaultProvider?: string;
  isSaving?: boolean;
}

export function ApiKeyDialog({ isOpen, onClose, onSave, existingApiKey, defaultProvider, isSaving }: ApiKeyDialogProps) {
  
  const getInitialValues = () => {
    if (existingApiKey) {
      // Ensure existingApiKey.model is a valid enum value, otherwise zod will complain
      const modelIsValid = (modelOptions as readonly string[]).includes(existingApiKey.model);
      return { 
        name: existingApiKey.name, 
        model: modelIsValid ? existingApiKey.model as typeof modelOptions[number] : modelOptions[0], 
        fullKey: existingApiKey.fullKey 
      };
    }

    let determinedModel: typeof modelOptions[number] = modelOptions[0]; // Default to the first option
    let keyName = `New ${determinedModel} API Key`; // Default key name

    if (defaultProvider && (modelOptions as readonly string[]).includes(defaultProvider)) {
      determinedModel = defaultProvider as typeof modelOptions[number];
      keyName = `${defaultProvider} API Key`;
    }
    
    return { name: keyName, model: determinedModel, fullKey: '' };
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
  };

  const dialogTitle = existingApiKey ? 'Edit API Key' : 'Add New API Key';
  const dialogDescription = existingApiKey
    ? 'Update the details for your API key.'
    : 'Enter the details for your new API key. Select the model provider below.';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSaving) onClose(); }}>
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
                    <Input placeholder="E.g., My Personal Key" {...field} className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo" disabled={isSaving}/>
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
                  <FormLabel className="text-sm font-semibold">AI Model Provider</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                    <FormControl>
                      <SelectTrigger className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo">
                        <SelectValue placeholder="Select a model provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="text-sm border-2 border-black shadow-neo bg-card rounded-md">
                      {modelOptions.map((option) => (
                        <SelectItem key={option} value={option} className="text-sm cursor-pointer focus:bg-primary focus:text-primary-foreground">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Input type="password" placeholder="sk-xxxxxxxxxxxx" {...field} className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo" disabled={isSaving}/>
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
                {isSaving ? "Saving..." : "Save Key"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

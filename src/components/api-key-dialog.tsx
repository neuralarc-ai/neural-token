
"use client";

import type { StoredApiKey } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X, Loader2, Eye, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';

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
  existingApiKey?: StoredApiKey | null;
  mode?: 'add' | 'edit' | 'view';
  defaultProvider?: string;
  isSaving?: boolean;
}

export function ApiKeyDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  existingApiKey, 
  mode = 'add', 
  defaultProvider, 
  isSaving 
}: ApiKeyDialogProps) {
  const { toast } = useToast();
  const [showFullKey, setShowFullKey] = useState(false);

  const getInitialValues = () => {
    if (existingApiKey) {
      const modelIsValid = (modelOptions as readonly string[]).includes(existingApiKey.model);
      return { 
        name: existingApiKey.name, 
        model: modelIsValid ? existingApiKey.model as typeof modelOptions[number] : modelOptions[0], 
        fullKey: existingApiKey.fullKey 
      };
    }

    let determinedModel: typeof modelOptions[number] = modelOptions[0];
    let keyName = `New ${determinedModel} API Key`;

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
      setShowFullKey(mode === 'view'); // Automatically show key in view mode
    }
  }, [existingApiKey, defaultProvider, form, isOpen, mode]);

  const onSubmit = (data: ApiKeyFormData) => {
    if (mode === 'view') return; // Should not happen as save button is hidden

    const keyFragment = data.fullKey.length > 8 
        ? data.fullKey.substring(0, 4) + '...' + data.fullKey.substring(data.fullKey.length - 4)
        : data.fullKey.substring(0,4) + '****';
    const apiKeyToSave: StoredApiKey = {
      id: existingApiKey?.id || crypto.randomUUID(),
      createdAt: existingApiKey?.createdAt || new Date().toISOString(),
      ...data,
      keyFragment,
    };
    onSave(apiKeyToSave);
  };

  const handleCopyToClipboard = async () => {
    if (existingApiKey?.fullKey) {
      try {
        await navigator.clipboard.writeText(existingApiKey.fullKey);
        toast({ title: 'API Key Copied', description: 'The full API key has been copied to your clipboard.' });
      } catch (err) {
        toast({ variant: 'destructive', title: 'Copy Failed', description: 'Could not copy API key to clipboard.' });
      }
    }
  };

  let dialogTitle = 'Add New API Key';
  let dialogDescription = 'Enter the details for your new API key. Select the model provider below.';
  if (mode === 'edit') {
    dialogTitle = 'Edit API Key';
    dialogDescription = 'Update the details for your API key.';
  } else if (mode === 'view') {
    dialogTitle = 'View API Key';
    dialogDescription = 'Details of the API key. The full key is shown below.';
  }
  

  const isViewMode = mode === 'view';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSaving && !isViewMode) onClose(); else if (!open && isViewMode) onClose(); }}>
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
                    <Input 
                      placeholder="E.g., My Personal Key" 
                      {...field} 
                      className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo" 
                      disabled={isSaving || isViewMode}
                      readOnly={isViewMode}
                    />
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
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value} 
                    disabled={isSaving || isViewMode}
                  >
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
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={isViewMode || showFullKey ? "text" : "password"} 
                        placeholder={isViewMode ? "" : "sk-xxxxxxxxxxxx"} 
                        {...field} 
                        className="text-sm h-11 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo pr-10" // Added pr-10 for icon
                        disabled={isSaving || (isViewMode && !showFullKey)} // In view mode, disabled until "show" is clicked
                        readOnly={isViewMode && showFullKey} // Fully read-only once shown in view mode
                      />
                    </FormControl>
                    {!isViewMode && (
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => setShowFullKey(!showFullKey)}
                        disabled={isSaving}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">{showFullKey ? "Hide key" : "Show key"}</span>
                      </Button>
                    )}
                     {isViewMode && existingApiKey?.fullKey && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={handleCopyToClipboard}
                            title="Copy API Key"
                        >
                            <Copy className="h-4 w-4" />
                            <span className="sr-only">Copy API Key</span>
                        </Button>
                    )}
                  </div>
                  <FormMessage className="text-xs text-destructive"/>
                </FormItem>
              )}
            />
            <DialogFooter className="pt-5 gap-3 sm:gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="h-11 text-sm px-5 rounded-md border-2 border-black shadow-neo-sm hover:shadow-neo active:shadow-none font-semibold" disabled={isSaving && !isViewMode}>
                <X className="mr-1.5 h-4 w-4" /> {isViewMode ? "Close" : "Cancel"}
              </Button>
              {!isViewMode && (
                <Button type="submit" className="h-11 text-sm px-5 rounded-md border-2 border-black shadow-neo hover:shadow-neo-sm active:shadow-none font-semibold" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                  {isSaving ? "Saving..." : (mode === 'edit' ? "Update Key" : "Save Key")}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


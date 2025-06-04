
"use client";

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PinLoginProps {
  onLoginSuccess: () => void;
  correctPin: string;
}

export function PinLogin({ onLoginSuccess, correctPin }: PinLoginProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (pin === correctPin) {
      setError('');
      toast({ title: 'Access Granted', description: 'Welcome to NeuralTokens!' });
      onLoginSuccess();
    } else {
      setError('Invalid PIN. Please try again.');
      setPin(''); // Clear PIN input on error
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Incorrect PIN entered.' });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-page-background p-4">
      <Card className="w-full max-w-xs sm:max-w-sm bg-card border-2 border-black shadow-neo rounded-xl">
        <CardHeader className="text-center border-b-2 border-black pb-4 pt-6">
          <KeyRound className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary mb-2 sm:mb-3" />
          <CardTitle className="text-xl sm:text-2xl font-bold font-headline">Enter PIN</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
            Enter your 4-digit PIN to access NeuralTokens.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-5 sm:pt-6 space-y-3 sm:space-y-4">
            <Input
              type="password"
              value={pin}
              onChange={(e) => {
                const newPin = e.target.value.replace(/\D/g, ''); // Allow only digits
                setPin(newPin.slice(0, 4));
              }}
              maxLength={4}
              placeholder="••••"
              className="text-center text-xl sm:text-2xl tracking-[0.3em] sm:tracking-[0.5em] h-12 sm:h-14 rounded-md border-2 border-black shadow-neo-sm focus:shadow-neo font-mono"
              autoFocus
              pattern="\d{4}"
              inputMode="numeric"
            />
            {error && <p className="text-xs sm:text-sm text-destructive text-center pt-1">{error}</p>}
          </CardContent>
          <CardFooter className="pt-3 sm:pt-4 pb-5 sm:pb-6">
            <Button
              type="submit"
              className="w-full text-sm sm:text-md border-2 border-black shadow-neo hover:shadow-neo-sm active:shadow-none font-semibold"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Unlock
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}


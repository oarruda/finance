'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { loginWithEmailPassword } from '@/lib/auth';

export function LoginForm() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setIsLoading(true);

    const result = await loginWithEmailPassword(email, password);
    
    if (!result.success) {
      setError(result.message);
      setIsLoading(false);
    }
    // Se sucesso, o useEffect acima vai redirecionar
  };

  if (isUserLoading || user) {
    return (
        <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="rafael@rafaelarruda.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

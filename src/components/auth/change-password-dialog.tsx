'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface ChangePasswordDialogProps {
  open: boolean;
  userId: string;
  onPasswordChanged: () => void;
}

export function ChangePasswordDialog({ open, userId, onPasswordChanged }: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Senha inválida',
        description: 'A senha deve ter no mínimo 8 caracteres.',
      });
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      toast({
        variant: 'destructive',
        title: 'Senha inválida',
        description: 'A senha deve conter letras e números.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas não coincidem',
        description: 'A nova senha e a confirmação devem ser iguais.',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!auth?.currentUser || !firestore) {
        throw new Error('Usuário não autenticado');
      }

      // Atualizar senha no Firebase Auth
      await updatePassword(auth.currentUser, newPassword);

      // Marcar no Firestore que a senha não é mais temporária
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        isTemporaryPassword: false,
        updatedAt: new Date(),
      });

      toast({
        title: 'Senha atualizada!',
        description: 'Sua senha foi alterada com sucesso.',
      });

      onPasswordChanged();
    } catch (error: any) {
      console.error('Erro ao trocar senha:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao trocar senha',
        description: error.message || 'Ocorreu um erro ao atualizar sua senha.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} modal={true}>
      <DialogContent 
        className="sm:max-w-[450px]" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>🔐 Alterar Senha Obrigatória</DialogTitle>
          <DialogDescription>
            Por motivos de segurança, você precisa alterar sua senha temporária antes de continuar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres (letras e números)"
                minLength={8}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="space-y-1 text-xs">
                <div className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                  {newPassword.length >= 8 ? '✓' : '✗'} Mínimo 8 caracteres
                </div>
                <div className={`flex items-center gap-1 ${/[a-zA-Z]/.test(newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                  {/[a-zA-Z]/.test(newPassword) ? '✓' : '✗'} Contém letras
                </div>
                <div className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-red-600'}`}>
                  {/[0-9]/.test(newPassword) ? '✓' : '✗'} Contém números
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && (
              <div className={`text-xs ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                {newPassword === confirmPassword ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
              </div>
            )}
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>⚠️ Importante:</strong> Memorize sua nova senha. Você precisará dela para acessar o sistema.
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando senha...
              </>
            ) : (
              'Atualizar Senha'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

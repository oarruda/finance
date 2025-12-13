'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AddUserDialogProps {
  onUserAdded?: () => void;
}

export function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    phoneCountryCode: '+55',
    cpf: '',
    role: 'viewer' as 'master' | 'admin' | 'viewer',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha nome, email e senha.',
        variant: 'destructive',
      });
      return;
    }

    // Validar senha
    if (formData.password.length < 8) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    if (!hasLetter || !hasNumber) {
      toast({
        title: 'Senha inválida',
        description: 'A senha deve conter letras e números.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Verificar se está autenticado
      if (!auth || !auth.currentUser) {
        throw new Error('Você precisa estar autenticado para criar usuários');
      }

      // Obter token do usuário atual
      const token = await auth.currentUser.getIdToken();
      if (!token) {
        throw new Error('Não foi possível obter token de autenticação');
      }

      // Combinar código do país com telefone se houver telefone
      const phoneWithCountryCode = formData.phone 
        ? `${formData.phoneCountryCode} ${formData.phone}` 
        : '';

      // Chamar API para criar usuário
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          phone: phoneWithCountryCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário');
      }

      // Criar documento do usuário no Firestore
      if (firestore && result.userData) {
        const userRef = doc(firestore, 'users', result.userId);
        await setDoc(userRef, {
          ...result.userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Se for master ou admin, criar documento de role
        if (result.userData.role === 'master' || result.userData.role === 'admin') {
          const roleCollection = result.userData.role === 'master' ? 'roles_master' : 'roles_admin';
          const roleRef = doc(firestore, roleCollection, result.userId);
          await setDoc(roleRef, {
            email: result.userData.email,
            role: result.userData.role,
            createdAt: new Date(),
          });
        }
      }

      toast({
        title: 'Usuário criado!',
        description: `${formData.name} foi adicionado com sucesso.`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        phoneCountryCode: '+55',
        cpf: '',
        role: 'viewer',
        password: '',
      });

      setOpen(false);
      onUserAdded?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo usuário. A senha será enviada por email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="João Silva"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Digite o seu melhor email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha Temporária *</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres (letras e números)"
                  minLength={8}
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
                    let password = '';
                    for (let i = 0; i < 12; i++) {
                      password += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    setFormData({ ...formData, password });
                  }}
                  title="Gerar senha segura"
                >
                  Gerar
                </Button>
              </div>
              {formData.password && (
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.password.length >= 8 ? '✓' : '✗'} Mínimo 8 caracteres
                  </div>
                  <div className={`flex items-center gap-1 ${/[a-zA-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                    {/[a-zA-Z]/.test(formData.password) ? '✓' : '✗'} Contém letras
                  </div>
                  <div className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}`}>
                    {/[0-9]/.test(formData.password) ? '✓' : '✗'} Contém números
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.phoneCountryCode}
                  onValueChange={(value) => setFormData({ ...formData, phoneCountryCode: value })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+55">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/br.png" alt="Brasil" className="w-5 h-4" />
                        <span>+55 (BR)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+351">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/pt.png" alt="Portugal" className="w-5 h-4" />
                        <span>+351 (PT)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+1">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/us.png" alt="EUA" className="w-5 h-4" />
                        <span>+1 (US)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+44">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/gb.png" alt="Reino Unido" className="w-5 h-4" />
                        <span>+44 (UK)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+34">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/es.png" alt="Espanha" className="w-5 h-4" />
                        <span>+34 (ES)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+33">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/fr.png" alt="França" className="w-5 h-4" />
                        <span>+33 (FR)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+49">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/de.png" alt="Alemanha" className="w-5 h-4" />
                        <span>+49 (DE)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+39">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/it.png" alt="Itália" className="w-5 h-4" />
                        <span>+39 (IT)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+54">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/ar.png" alt="Argentina" className="w-5 h-4" />
                        <span>+54 (AR)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+56">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/cl.png" alt="Chile" className="w-5 h-4" />
                        <span>+56 (CL)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+57">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/co.png" alt="Colômbia" className="w-5 h-4" />
                        <span>+57 (CO)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="+52">
                      <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w20/mx.png" alt="México" className="w-5 h-4" />
                        <span>+52 (MX)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={formData.phoneCountryCode === '+55' ? '(11) 99999-9999' : 'Digite seu telefone'}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
                  let formatted = value;
                  
                  // Formata: 000.000.000-00
                  if (value.length > 3) {
                    formatted = value.slice(0, 3) + '.' + value.slice(3);
                  }
                  if (value.length > 6) {
                    formatted = formatted.slice(0, 7) + '.' + value.slice(6);
                  }
                  if (value.length > 9) {
                    formatted = formatted.slice(0, 11) + '-' + value.slice(9, 11);
                  }
                  
                  setFormData({ ...formData, cpf: formatted });
                }}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Função *</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'master' | 'admin' | 'viewer') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Visualização (Apenas Leitura)</SelectItem>
                  <SelectItem value="admin">Administrador (Gerenciar Conteúdo)</SelectItem>
                  <SelectItem value="master">Master (Controle Total)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

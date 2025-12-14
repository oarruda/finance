'use client';

import * as React from 'react';
import type { User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Loader2, Trash2, Eye, Mail, Ban, CheckCircle } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export function UserManagementTable() {
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [resendingEmailId, setResendingEmailId] = React.useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = React.useState<string | null>(null);
  const [viewingUser, setViewingUser] = React.useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const { toast } = useToast();
  const { firestore, user: currentUser, auth } = useFirebase();

  const usersQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, isLoading, setData } = useCollection<User>(usersQuery);

  // Debug: Log dos usuários carregados
  React.useEffect(() => {
    console.log('=== USER MANAGEMENT TABLE DEBUG ===');
    console.log('Current user:', currentUser?.uid, currentUser?.email);
    console.log('Firestore instance:', firestore ? 'Available' : 'Not available');
    console.log('Users query:', usersQuery ? 'Created' : 'Not created');
    console.log('Is loading:', isLoading);
    console.log('Users data:', users);
    console.log('Users count:', users?.length || 0);
    console.log('===================================');
  }, [users, isLoading, currentUser, firestore, usersQuery]);


  const handleRoleChange = async (userId: string, newRole: 'master' | 'admin' | 'viewer') => {
    setUpdatingId(userId);
    try {
      // Atualizar o documento do usuário no Firestore
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });

      // Atualizar lista local
      if (setData && users) {
        setData(
          users.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
      }

      toast({
        title: 'Sucesso',
        description: 'Função do usuário atualizada.',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar função do usuário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error?.message || 'Falha ao atualizar função do usuário. Você precisa ter permissões de Master.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    // Não permitir deletar o próprio usuário
    if (userToDelete.id === currentUser?.uid) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você não pode deletar sua própria conta.',
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      return;
    }

    setDeletingId(userToDelete.id);
    try {
      // Deletar documento do usuário
      await deleteDoc(doc(firestore, 'users', userToDelete.id));

      // Atualizar lista local
      if (setData && users) {
        setData(users.filter(u => u.id !== userToDelete.id));
      }

      toast({
        title: 'Sucesso',
        description: 'Usuário deletado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao deletar usuário. Você precisa ter permissões de Master.',
      });
    } finally {
      setDeletingId(null);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleResendEmail = async (user: User) => {
    setResendingEmailId(user.id);
    try {
      // Obter token do usuário atual
      const token = await auth?.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Não foi possível obter token de autenticação');
      }

      const response = await fetch('/api/admin/resend-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao reenviar email');
      }

      toast({
        title: 'Email de reset enviado!',
        description: `Um link para redefinir a senha foi enviado para ${user.email}. O usuário poderá criar uma nova senha.`,
      });
    } catch (error: any) {
      console.error('Erro ao reenviar email:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar email',
        description: error.message,
      });
    } finally {
      setResendingEmailId(null);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    // Não permitir desativar o próprio usuário
    if (user.id === currentUser?.uid) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você não pode desativar sua própria conta.',
      });
      return;
    }

    const newDisabledStatus = !user.disabled;
    setTogglingStatusId(user.id);
    
    try {
      // Atualizar diretamente no Firestore usando o SDK do cliente
      const userRef = doc(firestore, 'users', user.id);
      await updateDoc(userRef, {
        disabled: newDisabledStatus,
        updatedAt: new Date().toISOString(),
      });

      // Atualizar lista local
      if (setData && users) {
        setData(
          users.map(u =>
            u.id === user.id ? { ...u, disabled: newDisabledStatus } : u
          )
        );
      }

      toast({
        title: 'Sucesso',
        description: `Usuário ${newDisabledStatus ? 'desativado' : 'ativado'} com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: error.message || 'Verifique se você tem permissões de MASTER.',
      });
    } finally {
      setTogglingStatusId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários do Sistema</CardTitle>
        <CardDescription>Gerencie os membros da equipe e suas funções.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({length: 3}).map((_, i) => (
                <TableRow key={i}>
                    <TableCell>
                        <div className='flex items-center gap-3'>
                            <Skeleton className='h-10 w-10 rounded-full' />
                            <div className='space-y-1'>
                                <Skeleton className='h-5 w-24' />
                                <Skeleton className='h-4 w-32' />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Skeleton className='h-8 w-[120px]' />
                    </TableCell>
                    <TableCell>
                        <Skeleton className='h-8 w-[80px]' />
                    </TableCell>
                </TableRow>
            ))}
            {!isLoading && (!users || users.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado. Adicione o primeiro usuário usando o botão "Novo Usuário".
                </TableCell>
              </TableRow>
            )}
            {users?.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className={user.disabled ? 'opacity-50' : ''}>
                      <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{user.name ? user.name.charAt(0) : user.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${user.disabled ? 'opacity-50 line-through' : ''}`}>
                          {user.name || user.email}
                        </p>
                        {user.disabled && (
                          <Badge variant="destructive" className="text-xs">
                            Desativado
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm text-muted-foreground ${user.disabled ? 'opacity-50' : ''}`}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {updatingId === user.id ? (
                        <Loader2 className='h-5 w-5 animate-spin' />
                    ) : (
                        <Select
                            value={user.role}
                            onValueChange={(value: 'master' | 'admin' | 'viewer') =>
                            handleRoleChange(user.id, value)
                            }
                            disabled={updatingId !== null}
                        >
                            <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Selecionar função" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="master">
                                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">Master</Badge>
                            </SelectItem>
                            <SelectItem value="admin">
                                <Badge className="bg-primary/80 hover:bg-primary/80">Admin</Badge>
                            </SelectItem>
                            <SelectItem value="viewer">
                                <Badge variant="secondary">Visualização</Badge>
                            </SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewingUser(user)}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleResendEmail(user)}
                      disabled={resendingEmailId === user.id}
                      title="Reenviar credenciais por email"
                    >
                      {resendingEmailId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleUserStatus(user)}
                      disabled={togglingStatusId === user.id || user.id === currentUser?.uid}
                      title={user.id === currentUser?.uid ? "Não pode desativar sua própria conta" : user.disabled ? "Ativar usuário" : "Desativar usuário"}
                    >
                      {togglingStatusId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user.disabled ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Ban className="h-4 w-4 text-orange-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(user)}
                      disabled={deletingId === user.id || user.id === currentUser?.uid}
                      title={user.id === currentUser?.uid ? "Não pode deletar sua própria conta" : "Deletar usuário"}
                    >
                      {deletingId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário <strong>{userToDelete?.name || userToDelete?.email}</strong>?
              Esta ação não pode ser desfeita e todos os dados do usuário serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Visualização de Usuário */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas do usuário selecionado
            </DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={viewingUser.avatarUrl} alt={viewingUser.name} data-ai-hint="person portrait" />
                  <AvatarFallback className="text-2xl">
                    {viewingUser.name ? viewingUser.name.charAt(0) : viewingUser.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{viewingUser.name || 'Sem nome'}</h3>
                  <p className="text-muted-foreground">{viewingUser.email}</p>
                  <Badge className="mt-1">
                    {viewingUser.role === 'master' && 'Master'}
                    {viewingUser.role === 'admin' && 'Admin'}
                    {viewingUser.role === 'viewer' && 'Visualização'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{viewingUser.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sobrenome</p>
                  <p className="font-medium">{viewingUser.lastName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{viewingUser.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{viewingUser.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium">{viewingUser.cpf || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fuso Horário</p>
                  <p className="font-medium">{viewingUser.timezone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Moeda Padrão</p>
                  <p className="font-medium">{viewingUser.defaultCurrency || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Idioma</p>
                  <p className="font-medium">{viewingUser.defaultLanguage || '-'}</p>
                </div>
              </div>

              {(viewingUser.street || viewingUser.city || viewingUser.state) && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Endereço</p>
                  <p className="font-medium">
                    {viewingUser.street && `${viewingUser.street}${viewingUser.number ? `, ${viewingUser.number}` : ''}`}
                    {viewingUser.complement && ` - ${viewingUser.complement}`}
                    <br />
                    {viewingUser.neighborhood && `${viewingUser.neighborhood}, `}
                    {viewingUser.city && `${viewingUser.city}`}
                    {viewingUser.state && ` - ${viewingUser.state}`}
                    <br />
                    {viewingUser.zipCode && `CEP: ${viewingUser.zipCode}`}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>Criado em: {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleString('pt-BR') : '-'}</p>
                <p>Atualizado em: {viewingUser.updatedAt ? new Date(viewingUser.updatedAt).toLocaleString('pt-BR') : '-'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

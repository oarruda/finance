'use client';

import { useUser, useFirebase } from '@/firebase';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';

export type UserRole = 'master' | 'admin' | 'viewer';

export interface Permissions {
  canViewAll: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canChangeRoles: boolean;
  canConfigureSettings: boolean;
  isMaster: boolean;
  isAdmin: boolean;
  isViewer: boolean;
}

/**
 * Hook para verificar permissões do usuário baseado em seu role
 */
export function usePermissions(): Permissions & { isLoading: boolean; userRole: UserRole | null } {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (user && firestore) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUserRole(userData.role || 'viewer');
          } else {
            setUserRole('viewer');
          }
        } catch (error) {
          console.error('Erro ao buscar role do usuário:', error);
          setUserRole('viewer');
        } finally {
          setIsLoading(false);
        }
      } else {
        setUserRole(null);
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [user, firestore]);

  const isMaster = userRole === 'master';
  const isAdmin = userRole === 'admin';
  const isViewer = userRole === 'viewer';

  const permissions: Permissions = {
    // Master pode fazer tudo
    canViewAll: isMaster || isAdmin || isViewer,
    canEdit: isMaster || isAdmin, // ADMIN pode editar transações
    canDelete: isMaster || isAdmin, // ADMIN pode deletar transações
    canManageUsers: isMaster, // Somente MASTER pode gerenciar usuários
    canChangeRoles: isMaster, // Somente MASTER pode mudar roles
    canConfigureSettings: isMaster, // Somente MASTER pode configurar APIs e IA
    isMaster,
    isAdmin,
    isViewer,
  };

  return {
    ...permissions,
    isLoading,
    userRole,
  };
}

/**
 * Componente para restringir acesso baseado em permissões
 */
export function RequirePermission({
  children,
  permission,
  fallback = null,
}: {
  children: React.ReactNode;
  permission: keyof Omit<Permissions, 'isMaster' | 'isAdmin' | 'isViewer'>;
  fallback?: React.ReactNode;
}) {
  const permissions = usePermissions();

  if (permissions.isLoading) {
    return <>{fallback}</>;
  }

  if (!permissions[permission]) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Componente para mostrar conteúdo apenas para roles específicos
 */
export function RequireRole({
  children,
  roles,
  fallback = null,
}: {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}) {
  const { userRole, isLoading } = usePermissions();

  if (isLoading || !userRole) {
    return <>{fallback}</>;
  }

  if (!roles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

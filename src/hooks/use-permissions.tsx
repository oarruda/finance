'use client';

import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import type { User } from '@/lib/types';

export type UserRole = 'master' | 'admin' | 'viewer';

export interface Permissions {
  canViewAll: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageUsers: boolean;
  canChangeRoles: boolean;
  isMaster: boolean;
  isAdmin: boolean;
  isViewer: boolean;
}

/**
 * Hook para verificar permissões do usuário baseado em seu role
 */
export function usePermissions(): Permissions & { isLoading: boolean; userRole: UserRole | null } {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Aqui você buscaria o role do Firestore
      // Por enquanto, vamos usar um valor padrão
      // TODO: Buscar do Firestore: firestore.collection('users').doc(user.uid).get()
      setUserRole('master'); // Temporário - em produção buscar do Firestore
      setIsLoading(false);
    } else {
      setUserRole(null);
      setIsLoading(false);
    }
  }, [user]);

  const isMaster = userRole === 'master';
  const isAdmin = userRole === 'admin';
  const isViewer = userRole === 'viewer';

  const permissions: Permissions = {
    // Master pode fazer tudo
    canViewAll: isMaster || isAdmin || isViewer,
    canEdit: isMaster || isAdmin,
    canDelete: isMaster || isAdmin,
    canManageUsers: isMaster,
    canChangeRoles: isMaster,
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

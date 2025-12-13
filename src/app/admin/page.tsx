'use client';

import { UserManagementTable } from "@/components/admin/user-management-table";
import { AdminStats } from "@/components/admin/admin-stats";
import { AdminActions } from "@/components/admin/admin-actions";
import { AddUserDialog } from "@/components/admin/add-user-dialog";
import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export default function AdminPage() {
    const [refreshKey, setRefreshKey] = useState(0);
    const { isMaster, isLoading } = usePermissions();

    const handleUserAdded = () => {
        // Incrementar a key para forçar re-render da tabela
        setRefreshKey(prev => prev + 1);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando permissões...</p>
                </div>
            </div>
        );
    }

    // Apenas MASTER pode acessar gerenciamento de usuários
    if (!isMaster) {
        return (
            <div className="space-y-6">
                <Alert variant="destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Acesso Negado</AlertTitle>
                    <AlertDescription>
                        Você não tem permissão para acessar o gerenciamento de usuários. 
                        Esta área é restrita apenas para usuários MASTER.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
                        Gerenciamento de Usuários
                    </h1>
                    <p className="text-muted-foreground">
                        Gerencie funções e permissões dos usuários do sistema.
                    </p>
                </div>
                <AddUserDialog onUserAdded={handleUserAdded} />
            </div>

            {/* Stats Cards */}
            <AdminStats />

            {/* Quick Actions */}
            <AdminActions />

            {/* User Management Table */}
            <UserManagementTable key={refreshKey} />
        </div>
    )
}
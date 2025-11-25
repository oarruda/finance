import { UserManagementTable } from "@/components/admin/user-management-table";
import { AdminStats } from "@/components/admin/admin-stats";
import { AdminActions } from "@/components/admin/admin-actions";
import { AddUserDialog } from "@/components/admin/add-user-dialog";

export default function AdminPage() {
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
                <AddUserDialog />
            </div>

            {/* Stats Cards */}
            <AdminStats />

            {/* Quick Actions */}
            <AdminActions />

            {/* User Management Table */}
            <UserManagementTable />
        </div>
    )
}
import { UserManagementTable } from "@/components/admin/user-management-table";

export default function AdminPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight">
                    User Management
                </h1>
                <p className="text-muted-foreground">
                    Add new users and manage their roles and permissions.
                </p>
            </div>
            <UserManagementTable />
        </div>
    )
}
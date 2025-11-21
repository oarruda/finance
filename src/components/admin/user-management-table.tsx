'use client';

import * as React from 'react';
import { users as initialUsers } from '@/lib/data';
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
import { updateUserRoleAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';

export function UserManagementTable() {
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'viewer') => {
    setUpdatingId(userId);
    const result = await updateUserRoleAction(userId, newRole);
    if (result.success) {
      setUsers(currentUsers =>
        currentUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      toast({
        title: 'Success',
        description: 'User role has been updated.',
      });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update user role.',
        });
    }
    setUpdatingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage your team members and their roles.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
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
                            onValueChange={(value: 'admin' | 'viewer') =>
                            handleRoleChange(user.id, value)
                            }
                            disabled={updatingId !== null}
                        >
                            <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="admin">
                                <Badge className="bg-primary/80 hover:bg-primary/80">Admin</Badge>
                            </SelectItem>
                            <SelectItem value="viewer">
                                <Badge variant="secondary">Viewer</Badge>
                            </SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

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
import { updateUserRoleAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import { Loader2 } from 'lucide-react';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

export function UserManagementTable() {
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const usersQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: users, isLoading, setData } = useCollection<User>(usersQuery);


  const handleRoleChange = async (userId: string, newRole: 'admin' | 'viewer') => {
    setUpdatingId(userId);
    const result = await updateUserRoleAction(userId, newRole);
    if (result.success) {
      if (setData && users) {
        setData(
            users.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
      }
      toast({
        title: 'Success',
        description: 'User role has been updated.',
      });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: result.message ?? 'Failed to update user role.',
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
                </TableRow>
            ))}
            {users?.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{user.name ? user.name.charAt(0) : user.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name || user.email}</p>
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

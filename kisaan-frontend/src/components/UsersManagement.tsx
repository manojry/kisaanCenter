import React, { useState, useEffect } from 'react';
import { useUsers } from '../context/UsersContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Plus, Users } from 'lucide-react';
import AddUserDialog from './AddUserDialog';



interface UsersManagementProps {
  shopId?: number;
  onRefresh?: () => void;
}

export default function UsersManagement({ shopId, onRefresh }: UsersManagementProps) {
  // shopId is currently unused, but kept for future filtering if needed.
  const { users, isLoading, refreshUsers } = useUsers();
  const [showAddUser, setShowAddUser] = useState(false);
  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const handleUserAdded = () => {
    if (onRefresh) onRefresh();
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      owner: "default", // green
      farmer: "default",   // blue
      buyer: "secondary",
    };
    return (
      <Badge variant={variants[role] || "outline"}>
        {role.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? "default" : "destructive"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // error state and UI removed; errors should be handled in context or via notifications if needed.

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col xs:flex-row xs:items-center w-full gap-2 xs:gap-0">
            <div className="flex flex-col flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-base xs:text-lg whitespace-nowrap overflow-hidden text-ellipsis">
                <Users className="h-5 w-5" />
                Users Management
              </CardTitle>
              <CardDescription className="text-xs xs:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                Manage farmers and buyers in your shop ({users.length} users)
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center xs:ml-auto">
              <Button onClick={() => setShowAddUser(true)} size="sm" className="px-2 py-1 text-xs xs:text-sm bg-green-600 hover:bg-green-700" style={{ minWidth: 0 }}>
                <Plus className="h-4 w-4 mr-1 xs:mr-2" />
                <span className="hidden xs:inline">Add User</span>
                <span className="inline xs:hidden">+</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found. Add farmers and buyers to get started.</p>
            </div>
          ) : (
            <div className="hidden sm:block overflow-x-auto w-full max-w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.contact || '-'}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Mobile Card/List Layout */}
            <div className="block sm:hidden space-y-4">
              {users.map((user, idx) => (
                <div key={user.id} className="rounded-lg border p-4 bg-white shadow-sm w-full max-w-full overflow-x-hidden mx-auto">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-lg break-words truncate max-w-[70%]" title={user.username}>{user.username}</span>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-sm mb-2">
                    <div className="break-words truncate max-w-[90vw]"><span className="font-medium">Contact:</span> {user.contact || '-'}</div>
                    <div className="break-words truncate max-w-[90vw]"><span className="font-medium">Email:</span> {user.email || '-'}</div>
                    <div className="break-words col-span-2"><span className="font-medium">Status:</span> {getStatusBadge(user.status)}</div>
                    <div className="break-words col-span-2"><span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}</div>
                  </div>
                  {idx < users.length - 1 && <div className="border-t mt-3 pt-3" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddUserDialog 
        open={showAddUser} 
        onOpenChange={setShowAddUser}
        onSuccess={handleUserAdded}
      />
    </>
  );
}
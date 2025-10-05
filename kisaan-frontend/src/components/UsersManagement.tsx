import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { formatDate } from '../utils/formatDate';
import { Input } from './ui/input';
import { useUsers } from '../context/UsersContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Users } from 'lucide-react';
import { usersApi } from '../services/api';


export default function UsersManagement() {
  const [search, setSearch] = useState('');
  const { users, isLoading, refreshUsers, total, page, setPage, pageSize, setPageSize } = useUsers();
  useEffect(() => {
    refreshUsers(page, pageSize);
  }, [refreshUsers, page, pageSize]);

  // Toggle user status (active/inactive)
  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await usersApi.update(userId, { status: newStatus });
      refreshUsers(page, pageSize);
      } catch {
        // Optionally show error toast
        // toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    }
  };

  const getRoleBadge = (role: string) => {
    // Use UserTypeBadge for farmer, buyer, shop; fallback to default badge for others
  if (role === 'farmer') return <Badge userType="FARMER" />;
  if (role === 'buyer') return <Badge userType="BUYER" />;
  if (role === 'shop') return <Badge userType="SHOP" />;
    // For owner, superadmin, employee, etc. use a simple badge
    return <span className="inline-block rounded bg-gray-200 text-gray-800 px-2 py-1 text-xs font-semibold uppercase">{role}</span>;
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? "default" : "destructive"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  // Filter users by search query
  const filteredUsers = search.trim().length === 0 ? users : users.filter(u => {
    const q = search.trim().toLowerCase();
    return (
      (u.firstname && u.firstname.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.contact && u.contact.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

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

  // Pagination controls
  const totalPages = Math.ceil(total / pageSize);
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };
  
   // Fix: wrap pagination controls outside Table, fix CardContent/Card/Fragment structure
   // Fix: refresh button handler should not pass event args
   const handleRefresh = () => refreshUsers(page, pageSize);

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
              {/* Responsive Refresh Button */}
              <Button onClick={handleRefresh} size="sm" variant="outline" className="px-2 py-1 text-xs xs:text-sm" style={{ minWidth: 0 }}>
                <span className="hidden xs:inline-flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 xs:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.423 19.584A9 9 0 1021 12.001h-1.5" /></svg>
                  Refresh
                </span>
                <span className="inline-flex xs:hidden items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582M20 20v-5h-.581M5.423 19.584A9 9 0 1021 12.001h-1.5" /></svg>
                </span>
              </Button>

            </div>
          </div>
          {/* Search Bar */}
          <div className="mt-4 flex w-full">
            <Input
              type="text"
              placeholder="Search users by name, username, contact, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md"
            />
          </div>
        </CardHeader>

        <CardContent>
          {filteredUsers.length === 0 ? (
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
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.firstname && user.firstname.trim() ? user.firstname : user.username}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.contact || '-'}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={user.status === 'active' ? 'destructive' : 'default'}
                          onClick={() => handleToggleStatus(user.id, user.status)}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <label className="mr-2 text-sm">Rows per page:</label>
                    <select value={pageSize} onChange={handlePageSizeChange} className="border rounded px-2 py-1 text-sm">
                      {[10, 20, 50, 100].map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
                    <span className="text-sm">Page {page} of {totalPages}</span>
                    <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Mobile Card/List Layout */}
          <div className="block sm:hidden space-y-4">
            {filteredUsers.map((user, idx) => (
              <div key={user.id} className="rounded-lg border p-4 bg-white shadow-sm w-full max-w-full overflow-x-hidden mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-lg break-words truncate max-w-[70%]" title={user.firstname && user.firstname.trim() ? user.firstname : user.username}>{user.firstname && user.firstname.trim() ? user.firstname : user.username}</span>
                  {getRoleBadge(user.role)}
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-sm mb-2">
                  <div className="break-words truncate max-w-[90vw]"><span className="font-medium">Contact:</span> {user.contact || '-'}</div>
                  <div className="break-words truncate max-w-[90vw]"><span className="font-medium">Email:</span> {user.email || '-'}</div>
                  <div className="break-words col-span-2"><span className="font-medium">Status:</span> {getStatusBadge(user.status)}</div>
                  <div className="break-words col-span-2"><span className="font-medium">Created:</span> {formatDate(user.created_at)}</div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant={user.status === 'active' ? 'destructive' : 'default'}
                    onClick={() => handleToggleStatus(user.id, user.status)}
                  >
                    {user.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
                {idx < users.length - 1 && <div className="border-t mt-3 pt-3" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

  {/* AddUserDialog removed */}
    </>
  );
}

import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { User, BreadcrumbItem, SharedData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
    Users,
    Search,
    Plus,
    ChevronDown,
    MoreVertical,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    UserCheck,
    Filter,
    FileSpreadsheet,
    UserMinus,
} from 'lucide-react';
import CreateUserModal from '@/components/admin/users/CreateUserModal';
import EditUserModal from '@/components/admin/users/EditUserModal';
import DeleteUserDialog from '@/components/admin/users/DeleteUserDialog';
import ImportUserModal from '@/components/admin/users/ImportUserModal';
import SyncResignModal from '@/components/admin/users/SyncResignModal';

interface UsersPageProps extends SharedData {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    regions: string[];
    filters: {
        search?: string;
        role?: string;
        status?: string;
        region?: string;
        sort?: string;
        direction?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'User Management', href: '/admin/users' },
];

export default function UsersIndex() {
    const { users, regions, filters } = usePage<UsersPageProps>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [selectedRole, setSelectedRole] = useState(filters.role || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedRegion, setSelectedRegion] = useState(filters.region || 'all');
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isSyncResignModalOpen, setIsSyncResignModalOpen] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get('/admin/users', {
            search: search || undefined,
            role: selectedRole !== 'all' ? selectedRole : undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            region: selectedRegion !== 'all' ? selectedRegion : undefined,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setSelectedRole('all');
        setSelectedStatus('all');
        setSelectedRegion('all');
        router.get('/admin/users', {}, { preserveState: true });
    };

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDelete = (user: User) => {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    };

    const handleToggleStatus = (user: User) => {
        router.post(`/admin/users/${user.id}/toggle-status`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getRoleBadge = (role: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
            admin: 'destructive',
            trainer: 'default',
            user: 'secondary',
        };
        return (
            <Badge variant={variants[role] || 'secondary'}>
                {role.toUpperCase()}
            </Badge>
        );
    };

    const getStatusBadge = (isRegistered: boolean) => {
        return isRegistered ? (
            <Badge variant="default" className="bg-green-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
            </Badge>
        ) : (
            <Badge variant="secondary">
                <XCircle className="w-3 h-3 mr-1" />
                Pending
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="mx-auto flex max-w-8xl flex-col gap-6 px-4 py-6">
                {/* Hero */}
                <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 to-white p-5 shadow-sm dark:border-sky-900 dark:from-sky-950 dark:to-gray-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Admin Panel</p>
                                <h1 className="mt-0.5 text-2xl font-bold text-sky-600">User Management</h1>
                                <p className="mt-1 text-sm text-muted-foreground">Kelola pengguna sistem LMS dengan cepat dan rapi.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="shrink-0 md:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="bg-sky-600 text-white hover:bg-sky-700">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah User
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-52">
                                    <DropdownMenuItem onClick={() => setIsCreateModalOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah User
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsSyncResignModalOpen(true)}>
                                        <UserMinus className="mr-2 h-4 w-4" />
                                        Sync Resign
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsImportModalOpen(true)}>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Import Excel/CSV
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center gap-2">
                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari NIK, nama, email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setIsFilterModalOpen(true)}
                                aria-label="Buka filter"
                            >
                                <Filter className="h-4 w-4" />
                            </Button>
                            <Button type="submit" className="hidden bg-sky-600 text-white hover:bg-sky-700 sm:inline-flex">
                                Cari
                            </Button>
                        </form>

                        <div className="hidden items-center gap-2 md:flex">
                            <Button
                                variant="outline"
                                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => setIsSyncResignModalOpen(true)}
                            >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Sync Resign
                            </Button>
                            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Import Excel/CSV
                            </Button>
                            <Button className="bg-sky-600 text-white hover:bg-sky-700" onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah User
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Total Users</div>
                        <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{users.total}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Active</div>
                        <div className="mt-2 text-2xl font-bold text-emerald-600">
                            {users.data.filter((u) => u.is_registered).length}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Pending</div>
                        <div className="mt-2 text-2xl font-bold text-amber-600">
                            {users.data.filter((u) => !u.is_registered).length}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Halaman</div>
                        <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                            {users.current_page} / {users.last_page}
                        </div>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block dark:border-gray-700 dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 dark:bg-gray-900/40 dark:hover:bg-gray-900/40">
                                    <TableHead>NIK</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                            Tidak ada data user
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.data.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30">
                                            <TableCell className="font-mono text-sm">{user.id}</TableCell>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email || '-'}</TableCell>
                                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                                            <TableCell>{user.region || '-'}</TableCell>
                                            <TableCell>{getStatusBadge(user.is_registered)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                            {user.is_registered ? 'Nonaktifkan' : 'Aktifkan'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(user)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                    {users.data.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-muted-foreground dark:border-gray-700 dark:bg-gray-800">
                            Tidak ada data user
                        </div>
                    ) : (
                        users.data.map((user) => (
                            <div key={user.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
                                        <p className="truncate text-xs text-muted-foreground">{user.email || '-'}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                                <UserCheck className="mr-2 h-4 w-4" />
                                                {user.is_registered ? 'Nonaktifkan' : 'Aktifkan'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(user)}
                                                className="text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-muted-foreground">NIK</p>
                                        <p className="font-mono text-sm">{user.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Region</p>
                                        <p className="text-sm font-medium">{user.region || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-muted-foreground">Role</p>
                                        {getRoleBadge(user.role)}
                                    </div>
                                    <div>
                                        <p className="mb-1 text-muted-foreground">Status</p>
                                        {getStatusBadge(user.is_registered)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {users.links.map((link, index) => (
                            <Button
                                key={index}
                                variant={link.active ? 'default' : 'outline'}
                                className={link.active ? 'bg-sky-600 text-white hover:bg-sky-700' : ''}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            <SyncResignModal
                open={isSyncResignModalOpen}
                onOpenChange={setIsSyncResignModalOpen}
                onSuccess={() => router.reload()}
            />
            <ImportUserModal
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
                onSuccess={() => router.reload()}
            />
            <CreateUserModal 
                open={isCreateModalOpen} 
                onOpenChange={setIsCreateModalOpen}
                regions={regions}
            />
            
            {selectedUser && (
                <>
                    <EditUserModal 
                        open={isEditModalOpen} 
                        onOpenChange={setIsEditModalOpen}
                        user={selectedUser}
                        regions={regions}
                    />
                    <DeleteUserDialog 
                        open={isDeleteDialogOpen} 
                        onOpenChange={setIsDeleteDialogOpen}
                        user={selectedUser}
                    />
                </>
            )}

            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Filter User</DialogTitle>
                        <DialogDescription>
                            Pilih kriteria untuk menyaring daftar user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <Label className="mb-2 block text-sm">Role</Label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Role</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="trainer">Trainer</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="mb-2 block text-sm">Status</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="registered">Active</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="mb-2 block text-sm">Region</Label>
                            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Region" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Region</SelectItem>
                                    {regions.map((region) => (
                                        <SelectItem key={region} value={region}>
                                            {region}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                resetFilters();
                                setIsFilterModalOpen(false);
                            }}
                        >
                            Reset
                        </Button>
                        <Button
                            type="button"
                            className="bg-sky-600 text-white hover:bg-sky-700"
                            onClick={() => {
                                applyFilters();
                                setIsFilterModalOpen(false);
                            }}
                        >
                            Terapkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

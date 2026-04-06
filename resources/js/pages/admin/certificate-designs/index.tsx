import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import certificateTemplates from '@/routes/admin/certificate-templates';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    CheckCircle,
    Palette
} from 'lucide-react';
interface CertificateTemplate {
    id: number;
    name: string;
    background_image_path: string;
    is_active: boolean;
    created_at: string;
}

export default function Index() {
    const { templates = [] } = usePage().props as { templates?: CertificateTemplate[] };
    const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id?: number }>({
        open: false,
    });

    const handleDelete = (id: number) => {
        router.delete(certificateTemplates.destroy.url({ certificateTemplate: id }));
        setDeleteDialog({ open: false });
    };

    const handleActivate = (id: number) => {
        router.post(certificateTemplates.activate.url({ certificateTemplate: id }));
    };

    return (
        <AppLayout>
            <Head title="Desain Sertifikat" />
            <div className="mx-auto flex max-w-8xl flex-col gap-6 px-4 py-6">
                <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50 to-white p-5 shadow-sm dark:border-sky-900 dark:from-sky-950 dark:to-gray-900">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300">
                                <Palette className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Admin Panel</p>
                                <h1 className="mt-0.5 text-2xl font-bold text-sky-600">Desain Sertifikat</h1>
                                <p className="mt-1 text-sm text-muted-foreground">Kelola template sertifikat agar tampil konsisten untuk seluruh peserta.</p>
                            </div>
                        </div>
                        <div className="text-left lg:text-right">
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Total Template</p>
                            <p className="mt-0.5 text-2xl font-bold text-gray-800 dark:text-gray-100">{templates.length}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                    <Button
                        onClick={() => router.get(certificateTemplates.create.url())}
                        className="bg-sky-600 text-white hover:bg-sky-700"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Desain
                    </Button>
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block dark:border-gray-700 dark:bg-gray-800">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 dark:bg-gray-900/40 dark:hover:bg-gray-900/40">
                                    <TableHead>Nama Desain</TableHead>
                                    <TableHead>Preview</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Dibuat Pada</TableHead>
                                    <TableHead className="w-12">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {templates.length > 0 ? (
                                    templates.map((template: CertificateTemplate) => (
                                        <TableRow key={template.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-900/30">
                                            <TableCell className="font-medium">{template.name}</TableCell>
                                            <TableCell>
                                                <img
                                                    src={`/storage/${template.background_image_path}`}
                                                    alt={template.name}
                                                    className="h-16 w-32 rounded-md border border-gray-100 object-cover dark:border-gray-700"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {template.is_active ? (
                                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                        Aktif
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">Tidak Aktif</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {new Date(template.created_at).toLocaleDateString('id-ID')}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => router.get(certificateTemplates.edit.url({ certificateTemplate: template.id }))}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        {!template.is_active && (
                                                            <DropdownMenuItem
                                                                onClick={() => handleActivate(template.id)}
                                                                className="cursor-pointer"
                                                            >
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                                Gunakan Desain Ini
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setDeleteDialog({ open: true, id: template.id })}
                                                            className="cursor-pointer text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                            Belum ada desain sertifikat. Buat desain baru untuk memulai.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Mobile cards */}
                <div className="grid grid-cols-1 gap-3 md:hidden">
                    {templates.length > 0 ? (
                        templates.map((template) => (
                            <div key={template.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{template.name}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {new Date(template.created_at).toLocaleDateString('id-ID')}
                                        </p>
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
                                            <DropdownMenuItem
                                                onClick={() => router.get(certificateTemplates.edit.url({ certificateTemplate: template.id }))}
                                                className="cursor-pointer"
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            {!template.is_active && (
                                                <DropdownMenuItem
                                                    onClick={() => handleActivate(template.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Gunakan Desain Ini
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => setDeleteDialog({ open: true, id: template.id })}
                                                className="cursor-pointer text-red-600"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Hapus
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <img
                                    src={`/storage/${template.background_image_path}`}
                                    alt={template.name}
                                    className="mb-3 h-32 w-full rounded-lg border border-gray-100 object-cover dark:border-gray-700"
                                />

                                {template.is_active ? (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Aktif</Badge>
                                ) : (
                                    <Badge variant="outline">Tidak Aktif</Badge>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-muted-foreground dark:border-gray-700 dark:bg-gray-800">
                            Belum ada desain sertifikat. Buat desain baru untuk memulai.
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
                <AlertDialogContent>
                    <AlertDialogTitle>Hapus Desain Sertifikat</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus desain sertifikat ini? Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                    <div className="flex justify-end gap-3">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteDialog.id && handleDelete(deleteDialog.id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Hapus
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

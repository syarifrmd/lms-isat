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
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Desain Sertifikat</h1>
                        <p className="text-muted-foreground mt-2">
                            Kelola desain sertifikat yang akan ditampilkan kepada peserta didik
                        </p>
                    </div>
                    <Button 
                        onClick={() => router.get(certificateTemplates.create.url())}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Desain
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Desain</TableHead>
                                <TableHead>Preview</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Dibuat Pada</TableHead>
                                <TableHead className="w-12">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {templates && templates.length > 0 ? (
                                templates.map((template: CertificateTemplate) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">{template.name}</TableCell>
                                        <TableCell>
                                            <img 
                                                src={`/storage/${template.background_image_path}`}
                                                alt={template.name}
                                                className="h-16 w-auto object-cover rounded"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {template.is_active ? (
                                                <Badge className="bg-green-100 text-green-800">
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
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    {!template.is_active && (
                                                        <DropdownMenuItem
                                                            onClick={() => handleActivate(template.id)}
                                                            className="cursor-pointer"
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            Gunakan Desain Ini
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteDialog({ open: true, id: template.id })}
                                                        className="cursor-pointer text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Hapus
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Belum ada desain sertifikat. Buat desain baru untuk memulai.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
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

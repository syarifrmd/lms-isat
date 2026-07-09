import React, { useEffect, useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import { User } from '@/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { 
    Loader2, 
    User as UserIcon, 
    Mail, 
    Lock, 
    Shield, 
    MapPin, 
    CreditCard,
    Plus,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User & { division?: string }; 
    regions: string[];
    divisions: string[];
    brands?: string[];            
    microClusters?: string[];      
    branches?: string[];           
    areas?: string[];
}

export default function EditUserModal({ open, onOpenChange, user, regions, divisions = [] }: EditUserModalProps) {
    const [isCustomDivision, setIsCustomDivision] = useState(false);
    const [customDivision, setCustomDivision] = useState('');
    
    // State untuk mengelola dialog konfirmasi hapus
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, put, transform, processing, errors, reset } = useForm({
        name: user.name,
        email: user.email || '',
        role: user.role,
        region: user.region || '',
        division: user.division || '', 
        brand: user.brand || '',                 
        micro_cluster: user.micro_cluster || '',  
        branch: user.branch || '',                
        area: user.area || '',
        password: '',
    });

    useEffect(() => {
        if (open) {
            const userDivision = user.division || '';
            const isExisting = divisions.includes(userDivision);

            if (userDivision && !isExisting) {
                setIsCustomDivision(true);
                setCustomDivision(userDivision);
                setData({
                    name: user.name,
                    email: user.email || '',
                    role: user.role,
                    division: '', 
                    brand: user.brand || '',                 
                micro_cluster: user.micro_cluster || '',  
                branch: user.branch || '',                
                area: user.area || '',
                password: '',
                region: user.region || '',
                });
            } else {
                setIsCustomDivision(false);
                setCustomDivision('');
                setData({
                    name: user.name,
                    email: user.email || '',
                    role: user.role,
                    division: userDivision,
                    brand: user.brand || '',                 
                    micro_cluster: user.micro_cluster || '',  
                    branch: user.branch || '',                
                    area: user.area || '',
                    password: '',
                    region: user.region || '',
                });
            }
        }
    }, [user, open, divisions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transform((oldData) => ({
            ...oldData,
            division: isCustomDivision ? customDivision : oldData.division,
        }));

        put(`/admin/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                reset('password');
                onOpenChange(false);
            },
        });
    };

    const handleDeleteDivision = () => {
        if (!data.division) return;
        
        setIsDeleting(true);
        
        router.delete(`/admin/divisions`, {
            data: { division: data.division },
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                setData('division', ''); // Reset pilihan dropdown setelah berhasil dihapus
            },
            onError: () => {
                setIsDeleting(false);
            }
        });
    };

    const handleClose = () => {
        reset();
        setIsCustomDivision(false);
        setCustomDivision('');
        onOpenChange(false);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset();
            setIsCustomDivision(false);
            setCustomDivision('');
        }
        onOpenChange(nextOpen);
    };

    const handleDivisionChange = (value: string) => {
        if (value === 'custom_option') {
            setIsCustomDivision(true);
            setData('division', '');
        } else {
            setIsCustomDivision(false);
            setData('division', value);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[600px] bg-background text-foreground border-border">
                    <DialogHeader className="space-y-3 pb-4 border-b border-border">
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <UserIcon className="h-6 w-6 text-primary" />
                            </div>
                            Edit User
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                            Perbarui informasi user: <span className="font-semibold text-foreground">{user.name}</span> (NIK: {user.id})
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="id" className="text-sm font-medium opacity-70">
                                    NIK <span className="text-xs text-muted-foreground">(Tidak dapat diubah)</span>
                                </Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="id" value={user.id} disabled className="pl-9 bg-muted/50 text-muted-foreground" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-role" className="text-sm font-medium">Role *</Label>
                                <Select value={data.role} onValueChange={(value) => setData('role', value)}>
                                    <SelectTrigger className="pl-9 relative">
                                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="trainer">Trainer</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name" className="text-sm font-medium">Nama Lengkap *</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="edit-name" value={data.name} onChange={(e) => setData('name', e.target.value)} required className="pl-9" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email" className="text-sm font-medium">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="edit-email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="pl-9" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="edit-password" className="text-sm font-medium">Password Baru</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="edit-password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} placeholder="Kosongkan jika tidak ubah" className="pl-9" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-region" className="text-sm font-medium">Region</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="edit-region" value={data.region} onChange={(e) => setData('region', e.target.value)} className="pl-9" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="edit-brand" className="text-sm font-medium">Brand</Label>
                                <Input
                                    id="edit-brand"
                                    value={data.brand}
                                    onChange={(e) => setData('brand', e.target.value)}
                                    placeholder="Brand"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-micro_cluster" className="text-sm font-medium">Micro Cluster</Label>
                                <Input
                                    id="edit-micro_cluster"
                                    value={data.micro_cluster}
                                    onChange={(e) => setData('micro_cluster', e.target.value)}
                                    placeholder="Micro Cluster"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="edit-branch" className="text-sm font-medium">Branch</Label>
                                <Input
                                    id="edit-branch"
                                    value={data.branch}
                                    onChange={(e) => setData('branch', e.target.value)}
                                    placeholder="Branch"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-area" className="text-sm font-medium">Area</Label>
                                <Input
                                    id="edit-area"
                                    value={data.area}
                                    onChange={(e) => setData('area', e.target.value)}
                                    placeholder="Area"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="division" className="text-sm font-medium">Divisi</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <Select 
                                            value={isCustomDivision ? 'custom_option' : data.division} 
                                            onValueChange={handleDivisionChange}
                                        >
                                            <SelectTrigger className={cn(errors.division && "border-destructive")}>
                                                <SelectValue placeholder="Pilih Divisi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {divisions.map((division) => (
                                                    <SelectItem key={division} value={division}>
                                                        {division}
                                                    </SelectItem>
                                                ))}
                                                
                                                <div className="h-px my-1 bg-muted" />
                                                
                                                <SelectItem value="custom_option" className="text-sky-600 font-medium focus:text-sky-700">
                                                    <div className="flex items-center gap-2">
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Tambah Divisi Lainnya
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Tombol Hapus diletakkan sejajar di luar dropdown */}
                                    {!isCustomDivision && data.division && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setDeleteDialogOpen(true)}
                                            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 animate-in fade-in zoom-in-95 duration-150"
                                            title="Hapus divisi pilihan dari sistem"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                {errors.division && <p className="text-xs text-destructive">{errors.division}</p>}
                            </div>

                            {isCustomDivision && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <Label htmlFor="custom_division" className="text-sm font-semibold text-sky-600">
                                        Nama Divisi Baru / Kustom
                                    </Label>
                                    <Input
                                        id="custom_division"
                                        type="text"
                                        placeholder="Ketik nama divisi baru..."
                                        value={customDivision}
                                        onChange={(e) => setCustomDivision(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4 border-t border-border mt-6">
                            <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>Batal</Button>
                            <Button type="submit" disabled={processing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[420px] bg-background border-destructive/20 text-foreground">
                    <DialogHeader className="space-y-2 text-center sm:text-left">
                        <DialogTitle className="text-lg flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" />
                            Hapus Pilihan Divisi?
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                            Apakah kamu yakin ingin menghapus opsi divisi "{data.division}" dari daftar master? Pengguna yang terikat mungkin akan kehilangan data divisi ini.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                            className="w-full sm:w-auto"
                        >
                            Batal
                        </Button>
                        <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={handleDeleteDivision}
                            disabled={isDeleting}
                            className="w-full sm:w-auto"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                'Ya, Hapus'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
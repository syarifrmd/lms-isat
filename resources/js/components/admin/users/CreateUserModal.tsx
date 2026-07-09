import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
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
    User, 
    Mail, 
    Lock, 
    Shield, 
    MapPin, 
    CreditCard,
    Plus,
    Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    regions: string[];
    divisions: string[];
    brands?: string[];            
    microClusters?: string[];      
    branches?: string[];           
    areas?: string[];
}

export default function CreateUserModal({ open, onOpenChange, regions, divisions = [],  brands = [],  microClusters = [], branches = [], areas = [] }: CreateUserModalProps) {
    const [isCustomDivision, setIsCustomDivision] = useState(false);
    const [customDivision, setCustomDivision] = useState('');

    // State tambahan untuk mengelola dialog konfirmasi hapus divisi master
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, transform, processing, errors, reset } = useForm({
        id: '',
        name: '',
        email: '',
        password: '',
        role: 'user',
        division: '',
        brand: '',          
        micro_cluster: '',  
        branch: '',        
        area: '',
        region: '',
    });

    useEffect(() => {
        if (!open) {
            setIsCustomDivision(false);
            setCustomDivision('');
        }
    }, [open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        transform((oldData) => ({
            ...oldData,
            division: isCustomDivision ? customDivision : oldData.division,
        }));

        post('/admin/users', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setIsCustomDivision(false);
                setCustomDivision('');
                onOpenChange(false);
            },
        });
    };

    // Fungsi untuk menghapus opsi divisi yang sedang dipilih dari database master
    const handleDeleteDivision = () => {
        if (!data.division) return;
        
        setIsDeleting(true);
        
        router.delete('/admin/divisions', {
            data: { division: data.division },
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                setData('division', ''); // Kosongkan dropdown setelah opsi terhapus
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
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            Tambah User Baru
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                            Isi form berikut untuk menambahkan pengguna baru ke dalam sistem. 
                            Pastikan semua data wajib diisi dengan benar.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-5 py-2">
                        {/* Baris 1: NIK & Role */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="id" className="text-sm font-medium">
                                    NIK <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="id"
                                        value={data.id}
                                        onChange={(e) => setData('id', e.target.value)}
                                        placeholder="Nomor Induk Karyawan"
                                        className={cn("pl-9", errors.id && "border-destructive focus-visible:ring-destructive/20")}
                                        required
                                    />
                                </div>
                                {errors.id ? (
                                    <p className="text-xs text-destructive flex items-center gap-1">
                                        {errors.id}
                                    </p>
                                ) : (
                                    <p className="text-[10px] text-muted-foreground">NIK harus unik dan sesuai identitas.</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role" className="text-sm font-medium">
                                    Role <span className="text-destructive">*</span>
                                </Label>
                                <Select 
                                    value={data.role} 
                                    onValueChange={(value) => setData('role', value)}
                                >
                                    <SelectTrigger className={cn("pl-9 relative", errors.role && "border-destructive")}>
                                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-destructive">Admin</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="trainer">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-blue-600">Trainer</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="user">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">User</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.role && (
                                    <p className="text-xs text-destructive">{errors.role}</p>
                                )}
                            </div>
                        </div>

                        {/* Baris 2: Nama Lengkap & Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Nama Lengkap <span className="text-destructive">*</span>
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Nama lengkap user"
                                        className={cn("pl-9", errors.name && "border-destructive focus-visible:ring-destructive/20")}
                                        required
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-xs text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="user@example.com"
                                        className={cn("pl-9", errors.email && "border-destructive focus-visible:ring-destructive/20")}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-destructive">{errors.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Baris 3: Password & Region */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Min. 8 karakter"
                                        className={cn("pl-9", errors.password && "border-destructive focus-visible:ring-destructive/20")}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-destructive">{errors.password}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="region" className="text-sm font-medium">
                                    Region
                                </Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="region"
                                        value={data.region}
                                        onChange={(e) => setData('region', e.target.value)}
                                        placeholder="Masukkan Region Kerja"
                                        className={cn("pl-9", errors.region && "border-destructive focus-visible:ring-destructive/20")}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Opsional, isi sesuai lokasi kerja.</p>
                                {errors.region && (
                                    <p className="text-xs text-destructive">{errors.region}</p>
                                )}
                            </div>
                        </div>

                        {/* === (BRAND & MICRO CLUSTER) === */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                                <Input
                                    id="brand"
                                    value={data.brand}
                                    onChange={(e) => setData('brand', e.target.value)}
                                    placeholder="Masukkan nama Brand"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="micro_cluster" className="text-sm font-medium">Micro Cluster</Label>
                                <Input
                                    id="micro_cluster"
                                    value={data.micro_cluster}
                                    onChange={(e) => setData('micro_cluster', e.target.value)}
                                    placeholder="Masukkan Micro Cluster"
                                />
                            </div>
                        </div>

                        {/* === (BRANCH & AREA) === */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="branch" className="text-sm font-medium">Branch</Label>
                                <Input
                                    id="branch"
                                    value={data.branch}
                                    onChange={(e) => setData('branch', e.target.value)}
                                    placeholder="Masukkan nama Branch"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="area" className="text-sm font-medium">Area</Label>
                                <Input
                                    id="area"
                                    value={data.area}
                                    onChange={(e) => setData('area', e.target.value)}
                                    placeholder="Masukkan nama Area"
                                />
                            </div>
                        </div>

                        {/* Baris 4: Dropdown Divisi + Tombol Hapus Sejajar */}
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

                                    {/* Tombol Hapus yang diletakkan di luar kontainer dropdown */}
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
                                        Nama Divisi Baru
                                    </Label>
                                    <Input
                                        id="custom_division"
                                        type="text"
                                        placeholder="Ketik nama divisi baru..."
                                        value={customDivision}
                                        onChange={(e) => setCustomDivision(e.target.value)}
                                        className={cn(errors.division && "border-destructive")}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-4 border-t border-border mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={processing}
                                className="w-full sm:w-auto hover:bg-muted"
                            >
                                Batal
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={processing}
                                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan Data'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Konfirmasi Hapus Opsi Divisi */}
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
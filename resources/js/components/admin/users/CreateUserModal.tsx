import React from 'react';
import { useForm } from '@inertiajs/react';
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
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    regions: string[];
}

export default function CreateUserModal({ open, onOpenChange, regions }: CreateUserModalProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        id: '',
        name: '',
        email: '',
        password: '',
        role: 'user',
        region: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/users', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    const handleClose = () => {
        reset();
        onOpenChange(false);
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset();
        }
        onOpenChange(nextOpen);
    };

    return (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* NIK Field */}
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

                        {/* Role Field */}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Name Field */}
                        <div className="space-y-2 col-span-2 md:col-span-1">
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

                         {/* Email Field */}
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label htmlFor="email" className="text-sm font-medium">
                                Email <span className="text-destructive"></span>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">
                                Password <span className="text-destructive"></span>
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

                        {/* Region Field */}
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
                                    placeholder="Masukkan Region / Wilayah Kerja"
                                    className={cn("pl-9", errors.region && "border-destructive focus-visible:ring-destructive/20")}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Opsional, isi manual sesuai lokasi kerja.</p>
                            {errors.region && (
                                <p className="text-xs text-destructive">{errors.region}</p>
                            )}
                        </div>
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
    );
}

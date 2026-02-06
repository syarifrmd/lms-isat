import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
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
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditUserModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User;
    regions: string[];
}

export default function EditUserModal({ open, onOpenChange, user, regions }: EditUserModalProps) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: user.name,
        email: user.email || '',
        role: user.role,
        region: user.region || '',
        password: '',
    });

    useEffect(() => {
        if (open) {
            setData({
                name: user.name,
                email: user.email || '',
                role: user.role,
                region: user.region || '',
                password: '',
            });
        }
    }, [user, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                reset('password');
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
                       {/* NIK Field (Read Only) */}
                        <div className="space-y-2">
                            <Label htmlFor="id" className="text-sm font-medium opacity-70">
                                NIK <span className="text-xs text-muted-foreground">(Tidak dapat diubah)</span>
                            </Label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="id"
                                    value={user.id}
                                    disabled
                                    className="pl-9 bg-muted/50 cursor-not-allowed text-muted-foreground"
                                />
                            </div>
                        </div>

                        {/* Role Field */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-role" className="text-sm font-medium">
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
                            <Label htmlFor="edit-name" className="text-sm font-medium">
                                Nama Lengkap <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="edit-name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Masukkan nama lengkap"
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
                            <Label htmlFor="edit-email" className="text-sm font-medium">
                                Email <span className="text-destructive"></span>
                            </Label>
                             <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="edit-email"
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
                            <Label htmlFor="edit-password" className="text-sm font-medium">
                                Password Baru
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="edit-password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Kosongkan jika tidak ubah"
                                    className={cn("pl-9", errors.password && "border-destructive focus-visible:ring-destructive/20")}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Minimal 8 karakter. Biarkan kosong jika tidak ingin mengubah.</p>
                            {errors.password && (
                                <p className="text-xs text-destructive">{errors.password}</p>
                            )}
                        </div>

                         {/* Region Field */}
                         <div className="space-y-2">
                            <Label htmlFor="edit-region" className="text-sm font-medium">
                                Region
                            </Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="edit-region"
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
                                'Simpan Perubahan'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect, useState } from 'react';
import { router, usePage } from '@inertiajs/react'; 
import { CheckCircle2, AlertCircle, X } from 'lucide-react'; 
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    // Membaca session flash bawaan dari Laravel
    const { flash } = usePage().props as any; 

    const [localToast, setLocalToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
        open: false,
        message: '',
        type: 'success'
    });

    // State untuk mengontrol pop-up error HTTP (403, 500, dll)
    const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; message: string }>({
        open: false,
        title: '',
        message: ''
    });
    
    useEffect(() => {
        // Listener untuk menangkap error sistem HTTP ilegal
        const unsubscribeInvalid = router.on('invalid', (event) => {
            event.preventDefault(); 
            
            const response = event.detail.response;
            let title = "Kesalahan Sistem";
            let message = `Terjadi kesalahan tidak dikenal (Status HTTP: ${response.status}).`;

            if (response.status === 403) {
                title = "Akses Ditolak";
                message = "Anda tidak memiliki izin atau hak akses yang sah untuk melakukan tindakan ini.";
            } else if (response.status === 500) {
                title = "Kesalahan Server";
                message = "Terjadi kesalahan internal pada server. Silakan hubungi tim pengembang jika masalah berlanjut.";
            } else if (response.status === 404) {
                title = "Data Tidak Ditemukan";
                message = "Halaman atau data yang Anda tuju tidak tersedia atau telah dihapus.";
            } else if (response.status === 419) {
                title = "Sesi Kedaluwarsa";
                message = "Sesi Anda telah berakhir. Silakan muat ulang halaman dan coba lagi.";
            }

            setErrorModal({ open: true, title, message });
        });

        if (localToast.open) {
            const timer = setTimeout(() => {
                setLocalToast(prev => ({ ...prev, open: false }));
            }, 4000);
            return () => clearTimeout(timer);
        }

        return () => unsubscribeInvalid();
    }, [localToast.open]);

    
    useEffect(() => {
        if (flash?.success) {
            setLocalToast({ open: true, message: flash.success, type: 'success' });
        } else if (flash?.error) {
            setLocalToast({ open: true, message: flash.error, type: 'error' });
        }
    }, [flash]);

    return (
        <>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
            </AppLayoutTemplate>

            {localToast.open && (
                <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-3 w-full max-w-sm p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="shrink-0">
                        {localToast.type === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-rose-500" />
                        )}
                    </div>
                    <div className="flex-1 text-sm font-medium leading-snug">
                        {localToast.message}
                    </div>
                    <button 
                        onClick={() => setLocalToast(prev => ({ ...prev, open: false }))}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            <AlertDialog open={errorModal.open} onOpenChange={(open) => setErrorModal(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-gray-100 font-semibold">
                            {errorModal.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
                            {errorModal.message}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogAction 
                            onClick={() => setErrorModal(prev => ({ ...prev, open: false }))}
                            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-black text-white"
                        >
                            Mengerti
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
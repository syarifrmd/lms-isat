import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
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
    // State untuk mengontrol pop-up error
    const [errorModal, setErrorModal] = useState<{ open: boolean; title: string; message: string }>({
        open: false,
        title: '',
        message: ''
    });
    
    useEffect(() => {
        const unsubscribe = router.on('invalid', (event) => {
            event.preventDefault(); 
            
            const response = event.detail.response;
            let title = "Kesalahan Sistem";
            let message = `Terjadi kesalahan tidak dikenal (Status HTTP: ${response.status}).`;

            if (response.status === 403) {
                title = "Akses Ditolak";
                message = "Anda tidak memiliki izin atau hak akses yang sah untuk melakukan tindakan ini.";
            } else if (response.status === 500) {
                title = "Kesalahan Server";
                message = "Terjadi kesalahan internal pada server. Silakan hubungi tim administrator jika masalah berlanjut.";
            } else if (response.status === 404) {
                title = "Data Tidak Ditemukan";
                message = "Halaman atau data yang Anda tuju tidak tersedia atau telah dihapus.";
            } else if (response.status === 419) {
                title = "Sesi Kedaluwarsa";
                message = "Sesi Anda telah berakhir. Silakan muat ulang halaman dan coba lagi.";
            }

            // Munculkan pop-up dengan pesan yang sesuai
            setErrorModal({ open: true, title, message });
        });

        return () => unsubscribe();
    }, []);

    return (
        <>
            <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
                {children}
            </AppLayoutTemplate>

            {/* Pop-up Dialog untuk Error Global */}
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
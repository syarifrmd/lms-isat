import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Head, useForm } from '@inertiajs/react';
import { IdCard, LogOut } from 'lucide-react';
import { FormEvent } from 'react';
import { submit } from '@/routes/register/verify-nik';

// Adjusted props to match SocialLoginController
interface Props {
    name: string;
    email: string;
    errors?: {
        error?: string;
    };
}

export default function VerifyEmployee({ name, email, errors: serverErrors }: Props) {
    // Setup form helper dari Inertia
    const { data, setData, post, processing, errors } = useForm({
        nik: '', // Changed to nik
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        // Post to the correct route
        post(submit.url());
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-600 dark:bg-gray-950 p-4 relative transition-colors duration-300">
            <Head title="Verifikasi NIK" />

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
                {/* Logo / Header Section */}
                <div className="mb-8 text-center">
                    <div className="inline-block mb-4 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl w-full">
                        <h1 className="text-2xl font-bold text-red-600 dark:text-red-500">Verifikasi Karyawan</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">Satu langkah lagi untuk masuk.</p>
                    </div>
                </div>

                {/* Card */}
                <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                    
                    {/* User Info Preview */}
                    <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white font-bold">
                            {name?.slice(0, 1)?.toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Login sebagai:</p>
                            <p className="text-base font-bold text-gray-900 dark:text-white truncate" title={email}>
                                {email}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="nik" className="text-gray-700 dark:text-gray-300 font-semibold">
                                Masukkan NIK Anda
                            </Label>
                            
                            <div className="relative group">
                                <div className="absolute left-3 top-3 z-10 text-gray-400 group-focus-within:text-red-600 transition-colors">
                                    <IdCard size={20} />
                                </div>
                                <Input
                                    id="nik"
                                    type="text"
                                    value={data.nik}
                                    onChange={(e) => setData('nik', e.target.value)}
                                    required
                                    autoFocus
                                    placeholder="Contoh: 2026A1"
                                    className="h-12 pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 rounded-lg transition-all"
                                />
                            </div>
                            <InputError message={errors.nik} className="mt-1" />
                            {serverErrors?.error && <InputError message={serverErrors.error} className="mt-1" />}
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ID ini diperlukan untuk mencocokkan data Anda dengan database perusahaan.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full h-12 text-base font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-600/25 transition-all duration-300 rounded-lg"
                        >
                            {processing && <Spinner className="mr-2 text-white" />}
                            Selesaikan Pendaftaran
                        </Button>
                    </form>

                    {/* Footer / Back to Login */}
                    <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6 text-center">
                        <p className="text-xs text-gray-500 mb-2">Bukan akun Anda?</p>
                         <a href="/" className="inline-flex items-center text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
                            <LogOut className="w-4 h-4 mr-1" />
                            Batalkan & Kembali
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
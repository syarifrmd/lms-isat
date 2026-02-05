import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';

interface Props {
    email: string;
    mailError?: string;
}

export default function CheckInbox({ email, mailError }: Props) {
    const { flash } = usePage<{ flash: { success?: string } }>().props;
    const { post, processing } = useForm({});
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (cooldown > 0) {
            interval = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [cooldown]);

    const handleResend = (e: React.MouseEvent) => {
        e.preventDefault();
        post('/register/resend-verification', {
            onSuccess: () => {
                setCooldown(60);
            }
        });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <Head title="Cek Email Anda" />

            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
                <div className="mb-6 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="h-10 w-10 text-blue-600"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                            />
                        </svg>
                    </div>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-gray-900">Periksa Email Anda</h2>
                <p className="mb-6 text-gray-600">
                    Kami telah mengirimkan link verifikasi ke: <br />
                    <span className="font-semibold text-gray-900">{email}</span>
                </p>

                {flash?.success && (
                    <div className="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-700 border border-green-200">
                        <p className="font-bold">Berhasil:</p>
                        <p>{flash.success}</p>
                    </div>
                )}

                {mailError && (
                    <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                        <p className="font-bold">Gagal mengirim email:</p>
                        <p>{mailError}</p>
                    </div>
                )}

                <p className="mb-8 text-sm text-gray-500">
                    Klik link di dalam email tersebut untuk melanjutkan proses verifikasi NIK.
                    Jika tidak ada di inbox, periksa folder Spam/Junk.
                </p>

                <button 
                    type="button"
                    onClick={handleResend}
                    disabled={processing || cooldown > 0}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent border-none p-0 cursor-pointer underline"
                >
                    {processing 
                        ? 'Mengirim...' 
                        : cooldown > 0 
                            ? `Kirim Ulang dalam ${cooldown}s` 
                            : 'Kirim Ulang link Verifikasi'}
                </button>

                <div className="border-t border-gray-100 pt-6 mt-6">
                    <Link
                        href="/"
                        className="text-sm font-semibold text-blue-600 hover:text-blue-500"
                    >
                        &larr; Kembali ke Halaman Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

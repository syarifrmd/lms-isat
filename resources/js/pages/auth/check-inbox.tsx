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
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#f4f4f7] p-4 font-sans">
            <Head title="Cek Email Anda - LMS Indosat" />

            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-center">
                {/* Header with Logo */}
                {/* <div className="border-b border-gray-100 bg-white px-6 py-6 pb-5 flex justify-center">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Indosat_Ooredoo_Hutchison.png/1280px-Indosat_Ooredoo_Hutchison.png"
                        alt="Indosat Logo"
                        className="h-10 w-auto object-contain"
                    />
                </div> */}

                {/* Content */}
                <div className="px-8 py-8 pt-6">
                    <div className="mb-6 flex justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50/50 outline outline-8 outline-yellow-50">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="h-10 w-10 text-[#ffc908]"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                                />
                            </svg>
                        </div>
                    </div>

                    <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Periksa Email Anda</h2>
                    <p className="mb-6 text-sm text-gray-500 leading-relaxed">
                        Kami telah mengirimkan tautan verifikasi ke surel: <br />
                        <span className="mt-1 block text-base font-semibold text-gray-800">{email}</span>
                    </p>

                    {flash?.success && (
                        <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100 text-left flex items-start">
                            <svg className="h-5 w-5 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-semibold">Berhasil dikirim</p>
                                <p className="mt-0.5 opacity-90">{flash.success}</p>
                            </div>
                        </div>
                    )}

                    {mailError && (
                        <div className="mb-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-700 border border-rose-100 text-left flex items-start">
                            <svg className="h-5 w-5 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-semibold">Gagal mengirim</p>
                                <p className="mt-0.5 opacity-90">{mailError}</p>
                            </div>
                        </div>
                    )}

                    <p className="mb-8 text-[13px] leading-relaxed text-gray-500">
                        Silakan klik tautan di dalam pesan tersebut untuk melanjutkan.
                        <br/>
                        <span className="text-gray-400">Jika tidak menemukan email di Kotak Masuk, mohon periksa folder <strong>Spam/Junk</strong>.</span>
                    </p>

                    <button 
                        type="button"
                        onClick={handleResend}
                        disabled={processing || cooldown > 0}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-[#ffc908] px-4 py-3.5 text-sm font-bold text-gray-900 shadow-sm hover:shadow-md hover:bg-[#f6c100] focus:outline-none focus:ring-2 focus:ring-[#ffc908] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-in-out"
                    >
                        {processing 
                            ? 'Memproses Ulang...' 
                            : cooldown > 0 
                                ? `Tunggu ${cooldown} detik untuk kirim lagi` 
                                : 'Kirim Ulang Tautan'}
                    </button>

                    <div className="mt-8 border-t border-gray-100 pt-7">
                        <Link
                            href="/"
                            className="group inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <svg className="mr-2 h-4 w-4 text-gray-400 group-hover:text-gray-700 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                            Kembali ke Halaman Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

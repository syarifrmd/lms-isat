import { Head, Link } from '@inertiajs/react';

interface Props {
    email: string;
    mailError?: string;
}

export default function CheckInbox({ email, mailError }: Props) {
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

                <div className="border-t border-gray-100 pt-6">
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

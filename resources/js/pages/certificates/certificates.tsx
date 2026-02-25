import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Award, Download, Eye, Search } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Course {
    id: number;
    title: string;
    description?: string;
}

interface CertificatesProps {
    courses: Course[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sertifikat Saya', href: '/certificates' },
];

export default function Certificates({ courses }: CertificatesProps) {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [query, setQuery] = useState('');

    const filtered = courses.filter((c) =>
        c.title.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sertifikat Saya" />

            {/* Modal Preview */}
            <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
                <DialogContent className="flex max-w-4xl h-[80vh] flex-col gap-2 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base">{selectedCourse?.title}</DialogTitle>
                    </DialogHeader>
                    {selectedCourse && (
                        <iframe
                            src={`/certificate/${selectedCourse.id}`}
                            className="w-full flex-1 rounded-lg border border-gray-100 dark:border-gray-700"
                            title="Certificate Preview"
                        />
                    )}
                </DialogContent>
            </Dialog>

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* Header */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Pencapaian Anda</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600">{courses.length} Sertifikat</p>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cari sertifikat..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-700 transition"
                        />
                    </div>
                </div>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
                        <Award className="h-10 w-10 text-gray-200 dark:text-gray-600" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {query ? 'Sertifikat tidak ditemukan.' : 'Belum ada sertifikat yang tersedia.'}
                        </p>
                        {!query && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Selesaikan kursus dan kuis untuk membuka sertifikat Anda.
                            </p>
                        )}
                        {!query && (
                            <a
                                href="/courses"
                                className="mt-1 text-xs font-medium text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 transition"
                            >
                                Lihat Kursus →
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((course) => (
                            <div
                                key={course.id}
                                className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
                            >
                                {/* Icon + Title */}
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-900/40 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">
                                        <Award className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                                            {course.title}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 line-clamp-2">
                                            {course.description || 'Selamat! Anda telah menyelesaikan kursus ini.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-auto">
                                    <button
                                        onClick={() => setSelectedCourse(course)}
                                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        Lihat
                                    </button>
                                    <a
                                        href={`/certificate/${course.id}/download`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 px-3 py-2 text-xs font-medium text-white transition"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Unduh PDF
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}


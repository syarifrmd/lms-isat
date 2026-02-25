import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { BookOpen, Search, Users } from 'lucide-react';
import { useState } from 'react';

interface Course {
    id: number;
    title: string;
    description?: string;
    category?: string;
    status?: string;
    enrollments_count: number;
}

interface Props {
    courses: Course[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pemantauan Students', href: '/students' },
];

export default function StudentsIndex({ courses }: Props) {
    const [search, setSearch] = useState('');

    const filtered = courses.filter(
        (c) =>
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            (c.category ?? '').toLowerCase().includes(search.toLowerCase()),
    );

    const totalStudents = courses.reduce((sum, c) => sum + c.enrollments_count, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pemantauan Students" />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* Header Card */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Pemantauan</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600">{courses.length} Course</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{totalStudents} total student terdaftar</p>
                        </div>
                    </div>
                    {/* Search */}
                    <div className="relative sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Cari kursus atau kategori..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-700 transition"
                        />
                    </div>
                </div>

                {/* Grid */}
                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
                        <BookOpen className="h-10 w-10 text-gray-200 dark:text-gray-600" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search ? 'Kursus tidak ditemukan.' : 'Belum ada course tersedia.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((course) => (
                            <div
                                key={course.id}
                                className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
                            >
                                {/* Icon + Status */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-900/40 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    {course.status && (
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                                            course.status === 'published'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                            {course.status}
                                        </span>
                                    )}
                                </div>

                                {/* Title + Category */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                                        {course.title}
                                    </p>
                                    {course.category && (
                                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{course.category}</p>
                                    )}
                                </div>

                                {/* Student count */}
                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{course.enrollments_count}</span> student terdaftar
                                    </span>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={() => router.visit(`/students/${course.id}`)}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-500 px-3 py-2 text-xs font-medium text-white transition"
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    Lihat Students
                                </button>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}


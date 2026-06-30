import AppLayout from '@/layouts/app-layout';
import { Head, router, Link } from '@inertiajs/react';
import { BookOpen, Search, Users, AlertCircle, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface Course {
    id: number;
    title: string;
    description?: string;
    category?: string;
    status?: string;
    target_division?: string;
    is_mandatory?: boolean;
    enrollments_count: number;
}

interface Props {
    courses: {
        data: Course[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { search?: string; category?: string; division?: string; course_type?: string };
    categories: string[];
    divisions: string[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pemantauan Students', href: '/students' },
];

export default function StudentsIndex({ courses, filters, categories, divisions }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [category, setCategory] = useState(filters?.category || 'all');
    const [division, setDivision] = useState(filters?.division || 'all');
    const [courseType, setCourseType] = useState(filters?.course_type || 'all');

    useEffect(() => {
        if (search === (filters?.search || '')) return;

        const delayDebounceFn = setTimeout(() => {
            updateFilters(search, category, division, courseType);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const updateFilters = (newSearch: string, newCategory: string, newDivision: string, newCourseType: string) => {
        router.get(
            '/students',
            {
                search: newSearch || undefined,
                category: newCategory === 'all' ? undefined : newCategory,
                division: newDivision === 'all' ? undefined : newDivision,
                course_type: newCourseType === 'all' ? undefined : newCourseType,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleCategoryChange = (val: string) => {
        setCategory(val);
        updateFilters(search, val, division, courseType);
    };

    const handleDivisionChange = (val: string) => {
        setDivision(val);
        updateFilters(search, category, val, courseType);
    };

    const handleCourseTypeChange = (val: string) => {
        setCourseType(val);
        updateFilters(search, category, division, val);
    };

    // Calculate total students only for the current page since we don't have the global total
    const totalStudents = courses.data.reduce((sum, c) => sum + (c.enrollments_count ?? 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pemantauan Students" />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* Header Card (Original Style) */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Pemantauan</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600">{courses.total} Course</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                {totalStudents} user terdaftar (di halaman ini)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Toolbar for Filters */}
                <div className="flex flex-col sm:flex-row gap-4 w-full flex-wrap">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Cari kursus..."
                            value={search}
                            onChange={handleSearchChange}
                            className="pl-9"
                        />
                    </div>

                    <Select value={category} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Semua Kategori" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Kategori</SelectItem>
                            {categories && categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={courseType} onValueChange={handleCourseTypeChange}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Semua Tipe Sifat Kursus" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe Kursus</SelectItem>
                            <SelectItem value="mandatory">Mandatory (Wajib)</SelectItem>
                            <SelectItem value="non_mandatory">Non-Mandatory</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Grid (Original Style) */}
                {courses.data.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col items-center justify-center py-20 gap-3">
                        <BookOpen className="h-10 w-10 text-gray-200 dark:text-gray-600" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {search || category !== 'all' || division !== 'all' || courseType !== 'all' ? 'Kursus tidak ditemukan.' : 'Belum ada course tersedia.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.data.map((course) => (
                            <div
                                key={course.id}
                                className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow relative"
                            >
                                {/* Category Badge (Top Right) */}
                                {course.category && (
                                    <div className="absolute top-4 right-4 z-10">
                                        <span className="inline-block bg-sky-100/90 dark:bg-sky-900/80 text-sky-600 dark:text-sky-300 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm">
                                            {course.category}
                                        </span>
                                    </div>
                                )}

                                {/* Icon */}
                                <div className="flex items-start justify-between gap-2 mt-2">
                                    <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-900/40 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                </div>

                                {/* Mandatory/Non-Mandatory Badge */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {course.is_mandatory ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60">
                                            <AlertCircle className="h-3 w-3" />
                                            Mandatory
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                            <Bookmark className="h-3 w-3" />
                                            Non-Mandatory
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-snug line-clamp-2">
                                        {course.title}
                                    </p>
                                </div>

                                {/* Student count */}
                                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{course.enrollments_count ?? 0}</span> user terdaftar
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

                {/* Pagination */}
                {courses.links && courses.links.length > 3 && (
                    <div className="px-5 py-4 flex items-center justify-center border-t border-gray-100 dark:border-gray-700 mt-4 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            {courses.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    preserveState
                                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                                        link.active
                                            ? 'z-10 bg-sky-50 border-sky-500 text-sky-600 dark:bg-sky-900/50 dark:border-sky-500 dark:text-sky-400'
                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                                    } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                    ${i === 0 ? 'rounded-l-md' : ''} ${i === courses.links.length - 1 ? 'rounded-r-md' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </nav>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}

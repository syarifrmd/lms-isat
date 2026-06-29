import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { SharedData } from '@/types';
import { BookOpen, FileQuestion, PlusCircle, ClipboardList, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Course {
    id: number;
    title: string;
    description: string;
    cover_url: string;
    category: string;
    status: string;
    created_at: string;
    quizzes_count: number;
}

const breadcrumbs = [
    { title: 'Penilaian', href: '/assessments' },
];

export default function AssessmentsIndex({ 
    courses,
    filters,
    categories,
    divisions
}: { 
    courses: {
        data: Course[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { search?: string; category?: string; course_type?: string; division?: string };
    categories: string[];
    divisions: string[];
}) {
    const { auth } = usePage<SharedData>().props;
    const [search, setSearch] = useState(filters?.search || '');
    const [category, setCategory] = useState(filters?.category || 'all');
    const [courseType, setCourseType] = useState(filters?.course_type || 'all');
    const [division, setDivision] = useState(filters?.division || 'all');

    useEffect(() => {
        if (search === (filters?.search || '')) return;

        const delayDebounceFn = setTimeout(() => {
            updateFilters(search, category, courseType, division);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const updateFilters = (newSearch: string, newCategory: string, newCourseType: string, newDivision: string) => {
        router.get(
            '/assessments',
            {
                search: newSearch || undefined,
                category: newCategory === 'all' ? undefined : newCategory,
                course_type: newCourseType === 'all' ? undefined : newCourseType,
                division: newDivision === 'all' ? undefined : newDivision,
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
        updateFilters(search, val, courseType, division);
    };

    const handleCourseTypeChange = (val: string) => {
        setCourseType(val);
        updateFilters(search, category, val, division);
    };

    const handleDivisionChange = (val: string) => {
        setDivision(val);
        updateFilters(search, category, courseType, val);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Penilaian" />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* Header Card */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <ClipboardList className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Modul</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600">Manajemen Penilaian</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Total Kursus</p>
                        <p className="mt-0.5 text-2xl font-bold text-gray-800 dark:text-gray-100">{courses.total}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">kursus tersedia</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-wrap">
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
                                <SelectValue placeholder="Tipe Sifat Kursus" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                <SelectItem value="mandatory">Mandatory (Wajib)</SelectItem>
                                <SelectItem value="non_mandatory">Non-Mandatory</SelectItem>
                            </SelectContent>
                        </Select>

                        {auth?.user?.role === 'admin' && (
                            <Select value={division} onValueChange={handleDivisionChange}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue>
                                        {division === 'all' ? 'Semua Divisi' : division}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Divisi</SelectItem>
                                    {divisions && divisions.map(div => (
                                        <SelectItem key={div} value={div}>{div}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Content */}
                {courses.data.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-16 flex flex-col items-center text-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Tidak Ada Kursus</h3>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Belum ada kursus yang sesuai dengan kriteria pencarian Anda.
                            </p>
                        </div>
                        <Link
                            href="/courses/create"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors"
                        >
                            <PlusCircle className="h-4 w-4" />
                            Buat Kursus Baru
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex flex-col overflow-hidden">
                        {/* Section header */}
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
                            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Daftar Kursus</h2>
                            <span className="text-xs text-gray-300 dark:text-gray-600">{courses.total} kursus</span>
                        </div>

                        {/* Grid */}
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {courses.data.map((course) => (
                                <div
                                    key={course.id}
                                    className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200"
                                >
                                    {/* Cover */}
                                    <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                        {course.cover_url ? (
                                            <img
                                                src={course.cover_url}
                                                alt={course.title}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950 dark:to-sky-900">
                                                <BookOpen className="h-10 w-10 text-sky-300 dark:text-sky-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div className="p-4 flex flex-col flex-1 gap-3">
                                        <div>
                                            {course.category && (
                                                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-400 mb-2">
                                                    {course.category}
                                                </span>
                                            )}
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug">
                                                {course.title}
                                            </p>
                                            {course.description && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mt-1">
                                                    {course.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                            <FileQuestion className="h-3.5 w-3.5" />
                                            <span>
                                                {course.quizzes_count} {course.quizzes_count === 1 ? 'Kuis' : 'Kuis'}
                                            </span>
                                        </div>

                                        <div className="mt-auto flex flex-col gap-2">
                                            <Link
                                                href={`/assessments/${course.id}/quizzes`}
                                                className="w-full text-center px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium transition-colors"
                                            >
                                                Kelola Penilaian
                                            </Link>
                                            <p className="text-xs text-sky-300 dark:text-gray-600 text-center">
                                                Dibuat {formatDistanceToNow(new Date(course.created_at), { addSuffix: true, locale: idLocale })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination */}
                        {courses.links && courses.links.length > 3 && (
                            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center">
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
                )}
            </div>
        </AppLayout>
    );
}

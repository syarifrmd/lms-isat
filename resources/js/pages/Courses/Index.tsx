import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ClockIcon, PlusCircle, Trash, BookOpen, AlertCircle, Bookmark, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SharedData } from '@/types';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { EnrollmentModal } from '@/components/EnrollmentModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Course {
    id: number;
    title: string;
    description: string;
    cover_url: string;
    category: string;
    status: string; // draft, published, archived
    target_division: string;
    created_by: number;
    is_mandatory: boolean; 
    is_timer_active?: number | boolean;
    duration_minutes?: number;
    created_at: string;
    start_date?: string;
    end_date?: string;
    modules?: Array<any>;
    creator: {
        name: string;
    };
    is_enrolled?: boolean;
    is_completed?: boolean;
    is_locked?: boolean;   // Sinkronisasi properti gembok dari backend
    isLocked?: boolean;    // Antisipasi penamaan camelCase dari backend
    divisions?: Array<{ id: number; name: string; pivot?: { position: number } }>; // Sinkronisasi relasi pivot table
}

export default function CoursesIndex({ 
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
    filters: { search?: string; category?: string; progress_status?: string; course_type?: string; division?: string }; 
    categories: string[];
    divisions: string[]; 
}) {
    const { auth } = usePage<SharedData>().props;
    const canCreateCourse = auth.user.role?.toLowerCase() === 'trainer' || auth.user.role?.toLowerCase() === 'admin';
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    
    const [search, setSearch] = useState(filters?.search || '');
    const [category, setCategory] = useState(filters?.category || 'all');
    
    // Default ke 'mandatory' jika di URL tidak ada filter tipe course
    const [courseType, setCourseType] = useState(filters?.course_type || 'mandatory'); 

    // State untuk menyimpan nilai dropdown divisi yang dipilih (Default ke 'all')
    const [division, setDivision] = useState(filters?.division || 'all');

    useEffect(() => {
        if (!filters?.course_type) {
            updateFilters(search, category, 'mandatory', division);
        }
    }, []);

    // Efek Debounce untuk fitur auto-search saat mengetik langsung muncul
    useEffect(() => {
        // Jangan trigger filter saat inisialisasi pertama jika nilai search masih sama dengan filter awal URL
        if (search === (filters?.search || '')) return;

        const delayDebounceFn = setTimeout(() => {
            updateFilters(search, category, courseType, division);
        }, 500); // Menunggu 500ms setelah user berhenti mengetik

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    // updateFilters dimodifikasi untuk ikut serta mengirim parameter newDivision ke backend
    const updateFilters = (newSearch: string, newCategory: string, newCourseType: string, newDivision: string) => {
        router.get(
            '/courses',
            {
                search: newSearch || undefined,
                category: newCategory === 'all' ? undefined : newCategory,
                course_type: newCourseType, 
                division: newDivision === 'all' ? undefined : newDivision, 
            },
            {
                preserveState: true, // Diubah ke true agar ketikan di input search tidak hilang/reset saat refresh data
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

    // Fungsi handler ketika dropdown divisi berubah di frontend
    const handleDivisionChange = (val: string) => {
        setDivision(val);
        updateFilters(search, category, courseType, val);
    };

    const handleEnrollClick = (course: Course) => {
        setSelectedCourse(course);
        setShowEnrollModal(true);
    };
    
    const [courseToDelete, setCourseToDelete] = useState<number | null>(null);

    const handleDelete = () => {
        if (courseToDelete) {
            router.delete(`/courses/${courseToDelete}`, {
                onSuccess: () => setCourseToDelete(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Courses', href: '/courses' }]}>
            <Head title="Courses" />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* Header */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Learning Portal</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600">Available Courses</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Total</p>
                        <p className="mt-0.5 text-2xl font-bold text-gray-800 dark:text-gray-100">{courses.total}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">courses available</p>
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

                        {/* FILTER UTAMA: Mandatory & Non-Mandatory */}
                        <Select value={courseType} onValueChange={handleCourseTypeChange}>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Tipe Sifat Kursus" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mandatory">Mandatory (Wajib)</SelectItem>
                                <SelectItem value="non_mandatory">Non-Mandatory</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* FILTER DROPDOWN DIVISI  */}
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

                    {canCreateCourse && (
                        <div className="flex justify-end">
                            <Link
                                href="/courses/create"
                                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 transition-colors shadow-sm"
                            >
                                <PlusCircle className="h-4 w-4" />
                                Create Course
                            </Link>
                        </div>
                    )}
                </div>

                {/* Course Grid */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">All Courses</h2>
                        <span className="text-xs text-gray-300 dark:text-gray-600">{courses.total} courses</span>
                    </div>

                    {courses.data.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400">
                            No courses available yet for this selection.
                        </div>
                    ) : (
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {courses.data.map((course, index) => {
                                // Pengecekan status gembok (berlaku untuk non-admin/trainer)
                                const isLocked = !canCreateCourse && (course.is_locked || course.isLocked);

                                // Proteksi Pengguna Biasa: Jika statusnya bukan published, jangan dirender ke tampilan USER biasa
                                if (!canCreateCourse && ['draft', 'archived'].includes(course.status?.toLowerCase())) {
                                    return null;
                                }

                                return (
                                    <div
                                        key={`${course.id}-${index}`}
                                        className="relative rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden"
                                    >
                                        {/* Overlay Gembok 1 Card Penuh jika status Terkunci */}
                                        {isLocked && (
                                            <div className="absolute inset-0 bg-gray-500/20 backdrop-blur-[1.5px] z-30 flex items-center justify-center transition-all duration-300">
                                                <div className="h-14 w-14 rounded-full bg-gray-600/90 dark:bg-gray-700/90 text-white shadow-xl flex items-center justify-center border border-gray-500/30">
                                                    <Lock className="h-6 w-6" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Cover */}
                                        <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0">
                                            {course.cover_url ? (
                                                <img
                                                    src={course.cover_url}
                                                    alt={course.title}
                                                    className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                                                    <span className="text-3xl font-bold">{course.title.charAt(0)}</span>
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                                <span className="inline-block bg-sky-100/90 dark:bg-sky-900/80 text-sky-600 dark:text-sky-300 text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
                                                    {course.category || 'General'}
                                                </span>
                                                {course.target_division && (
                                                    <span className="inline-block bg-indigo-100/90 dark:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm border border-indigo-200 dark:border-indigo-800">
                                                        {course.target_division}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="flex flex-col flex-1 px-4 pt-4 pb-4 gap-2">
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

                                                {/* SINKRONISASI LABEL WAKTU - KHUSUS USER BIASA DAN MANDATORY*/}
                                                {(() => {
                                                    const isUserBiasa = auth?.user && !['admin', 'trainer'].includes(auth.user.role?.toLowerCase());

                                                    // Timer HANYA muncul jika: yang melihat adalah User biasa DAN course ini Mandatory
                                                    if (isUserBiasa && course.is_mandatory && Number(course.is_timer_active) === 1 && course.duration_minutes) {
                                                        return (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60">
                                                                <ClockIcon className="h-3 w-3" />
                                                                {course.duration_minutes} Menit
                                                            </span>
                                                        );
                                                    }
                                                    return null;
                                                })()}

                                                {/* LABEL STATUS (DRAFT/PUBLISHED/ARCHIVED) - HANYA TRAINER & ADMIN */}
                                                {canCreateCourse && (
                                                    <>
                                                        {course.status === 'draft' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60">
                                                                Draft
                                                            </span>
                                                        )}
                                                        {course.status === 'published' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/60">
                                                                Published
                                                            </span>
                                                        )}
                                                        {course.status === 'archived' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                                                                Archived
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug">
                                                {course.title}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-3 flex-1">
                                                {course.description || 'No description available for this course.'}
                                            </p>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                                <div className="flex items-center gap-1 text-xs text-gray-300 dark:text-gray-600">
                                                    <ClockIcon className="h-3 w-3" />
                                                    <span>{formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {canCreateCourse ? (
                                                        <>
                                                            {(auth?.user?.role === 'admin' || auth?.user?.id === course.created_by || (auth?.user?.role === 'trainer' && !!course.target_division && !!auth?.user?.division && course.target_division.split(', ').includes(auth?.user?.division))) && (
                                                                <button
                                                                    onClick={() => setCourseToDelete(course.id)}
                                                                    className="group inline-flex items-center gap-1 cursor-pointer border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-700 dark:hover:text-white px-2.5 py-1 rounded-xl text-xs font-medium transition-all duration-200"
                                                                >
                                                                    <Trash className="h-3.5 w-3.5" />
                                                                    Remove
                                                                </button>
                                                            )}
                                                            <Link
                                                                href={`/courses/${course.id}`}
                                                                className="inline-flex items-center px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/40 text-xs font-medium transition-colors"
                                                            >
                                                                View
                                                            </Link>
                                                        </>
                                                    ) : course.is_completed ? (
                                                            <Link
                                                                href={`/courses/${course.id}`}
                                                                className="inline-flex items-center px-2.5 py-1 rounded-xl border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/40 text-xs font-medium transition-colors"
                                                            >
                                                                Telah Selesai
                                                            </Link>
                                                    ) : course.is_enrolled ? (
                                                        <Link
                                                            href={`/courses/${course.id}`}
                                                            className="inline-flex items-center px-2.5 py-1 rounded-xl bg-sky-50 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-xs font-semibold transition-colors"
                                                        >
                                                            Lanjutkan Belajar
                                                        </Link>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEnrollClick(course)}
                                                            className="inline-flex items-center px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition-colors shadow-sm"
                                                        >
                                                            Daftar Kursus
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
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

            </div>

            {selectedCourse && (
                <EnrollmentModal
                    open={showEnrollModal}
                    onOpenChange={setShowEnrollModal}
                    course={selectedCourse}
                    onConfirm={() => {
                        window.location.href = `/courses/${selectedCourse.id}`;
                    }}
                />
            )}

            <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the course and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </AppLayout>
    );
}
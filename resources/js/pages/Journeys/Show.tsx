import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowLeft, Clock, Award, ShieldAlert, AlertCircle, Bookmark, Clock as ClockIcon, Lock, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
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
    cover_url?: string;
    category?: string;
    target_division?: string;
    is_mandatory: boolean;
    duration_minutes?: number;
    status: string;
    is_timer_active?: number | boolean;
    created_by?: number;
    created_at?: string;
    is_enrolled?: boolean;
    is_completed?: boolean;
    is_locked?: boolean;
    isLocked?: boolean;
}

interface Journey {
    id: number;
    title: string;
    description: string;
    cover_url: string;
    status: string;
    created_at: string;
    courses: Course[];
    creator: {
        name: string;
    };
}

interface ShowJourneyProps {
    journey: Journey;
    auth: {
        user: {
            id: number;
            role: string;
            division?: string;
        }
    };
}

export default function ShowJourney({ journey, auth }: ShowJourneyProps) {
    const isTrainer = auth.user.role === 'trainer' || auth.user.role === 'admin';
    const canCreateCourse = isTrainer;

    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);

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

    // Heartbeat "aktif di journey ini": kirim ping tiap 10 detik selagi halaman ini terbuka &
    // terlihat, supaya status di StudentController (dseActiveUserIdsForJourney) benar-benar
    // realtime. TTL di server 20 detik, jadi interval 10 detik cukup rapat untuk menjaganya
    // tetap "hidup" tanpa celah. Begitu tab ditutup/pindah, ping berhenti dan statusnya otomatis
    // hilang dalam hitungan detik.
    useEffect(() => {
        const getXsrfToken = () => {
            const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
            return match ? decodeURIComponent(match[1]) : '';
        };

        const sendPing = () => {
            fetch(`/journeys/${journey.id}/ping-active`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            }).catch(() => {
                
            });
        };

        let interval: ReturnType<typeof setInterval> | null = null;

        const startPinging = () => {
            if (interval) return;
            sendPing();
            interval = setInterval(sendPing, 10000);
        };

        const stopPinging = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                startPinging();
            } else {
                stopPinging();
            }
        };

        startPinging();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            stopPinging();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [journey.id]);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Journeys', href: '/journeys' },
            { title: journey.title, href: `/journeys/${journey.id}` },
        ]}>
            <Head title={journey.title} />

            <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col gap-6">

                {/* Header Section */}
                <div className="relative rounded-2xl border border-sky-100 dark:border-sky-900 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    {/* Cover Background */}
                    <div className="h-48 w-full bg-sky-600/20 relative">
                        {journey.cover_url ? (
                            <img src={journey.cover_url} alt={journey.title} className="w-full h-full object-cover opacity-80" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white">
                                <span className="text-6xl font-bold opacity-50">{journey.title.charAt(0)}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>

                    <div className="p-6 relative -mt-16">
                        <Link
                            href="/journeys"
                            className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white mb-4 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-md w-fit transition-colors"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            Kembali ke Daftar
                        </Link>
                        
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">{journey.title}</h1>
                                <p className="text-white/90 text-sm max-w-2xl leading-relaxed drop-shadow-sm">
                                    {journey.description || 'Tidak ada deskripsi untuk journey ini.'}
                                </p>
                            </div>
                            
                            {isTrainer && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button asChild variant="secondary" className="gap-2 bg-white/90 hover:bg-white text-gray-800 shadow-lg">
                                        <Link href={`/courses/create`}>
                                            + Tambah Course
                                        </Link>
                                    </Button>
                                    <Button asChild variant="secondary" className="gap-2 bg-white/90 hover:bg-white text-gray-800 shadow-lg">
                                        <Link href={`/journeys/${journey.id}/edit`}>
                                            Edit Journey
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Courses List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-sky-500" />
                                Daftar Course di Journey Ini
                            </h2>
                            <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full font-medium">
                                {journey.courses.length} Course
                            </span>
                        </div>

                        {journey.courses.length === 0 ? (
                            <div className="py-12 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-gray-400 text-sm">Belum ada course di journey ini.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {journey.courses.map((course, index) => {
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
                                            <div 
                                                className={`relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 ${!isLocked ? 'cursor-pointer' : ''}`}
                                                onClick={() => {
                                                    if (isLocked) return;
                                                    if (canCreateCourse || course.is_completed || course.is_enrolled) {
                                                        router.get(`/courses/${course.id}`);
                                                    } else {
                                                        handleEnrollClick(course);
                                                    }
                                                }}
                                            >
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

                                                    {isTrainer && (
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

                                                <p 
                                                    className={`text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug ${!isLocked ? 'hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors' : ''}`}
                                                    onClick={() => {
                                                        if (isLocked) return;
                                                        if (canCreateCourse || course.is_completed || course.is_enrolled) {
                                                            router.get(`/courses/${course.id}`);
                                                        } else {
                                                            handleEnrollClick(course);
                                                        }
                                                    }}
                                                >
                                                    {course.title}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-3 flex-1">
                                                    {course.description || 'No description available for this course.'}
                                                </p>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                                    <div className="flex items-center gap-1 text-xs text-gray-300 dark:text-gray-600">
                                                        <ClockIcon className="h-3 w-3" />
                                                        <span>{course.created_at ? formatDistanceToNow(new Date(course.created_at), { addSuffix: true }) : 'N/A'}</span>
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
                    </div>

                    {/* Right Column: Info Card */}
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm sticky top-6">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
                                Informasi Journey
                            </h3>
                            
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Dibuat Oleh</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{journey.creator?.name || 'Unknown'}</p>
                                </div>
                                
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Tanggal Dibuat</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">
                                        {formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Status</p>
                                    <div className="inline-block">
                                        {journey.status === 'published' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                                                Published
                                            </span>
                                        )}
                                        {journey.status === 'draft' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                                Draft
                                            </span>
                                        )}
                                        {journey.status === 'archived' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                                                Archived
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {selectedCourse && (
                <EnrollmentModal
                    open={showEnrollModal}
                    onOpenChange={setShowEnrollModal}
                    course={selectedCourse as any}
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
import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ClockIcon, PlusCircle, Trash, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SharedData } from '@/types';
import { useState } from 'react';
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
    status: string;
    created_at: string;
    start_date?: string;
    end_date?: string;
    modules?: Array<any>;
    creator: {
        name: string;
    };
    is_enrolled?: boolean;
    is_completed?: boolean;
}

export default function CoursesIndex({ courses }: { courses: Course[] }) {
    const { auth } = usePage<SharedData>().props;
    const canCreateCourse = auth.user.role === 'trainer' || auth.user.role === 'admin';
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
                        <p className="mt-0.5 text-2xl font-bold text-gray-800 dark:text-gray-100">{courses.length}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">courses available</p>
                    </div>
                </div>

                {/* Toolbar */}
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

                {/* Course Grid */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">All Courses</h2>
                        <span className="text-xs text-gray-300 dark:text-gray-600">{courses.length} courses</span>
                    </div>

                    {courses.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400">
                            No courses available yet. Check back later for new content.
                        </div>
                    ) : (
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {courses.map((course) => (
                                <div
                                    key={course.id}
                                    className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden"
                                >
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
                                        {/* Category badge */}
                                        <div className="absolute top-2 right-2">
                                            <span className="inline-block bg-sky-100/90 dark:bg-sky-900/80 text-sky-600 dark:text-sky-300 text-xs font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
                                                {course.category || 'General'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="flex flex-col flex-1 px-4 pt-4 pb-4 gap-2">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug">
                                            {course.title}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-3 flex-1">
                                            {course.description || 'No description available for this course.'}
                                        </p>

                                        {/* Footer row */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                            <div className="flex items-center gap-1 text-xs text-gray-300 dark:text-gray-600">
                                                <ClockIcon className="h-3 w-3" />
                                                <span>{formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {canCreateCourse ? (
                                                    <>
                                                        <button
                                                            onClick={() => setCourseToDelete(course.id)}
                                                            className="group inline-flex items-center gap-1 cursor-pointer border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-700 dark:hover:text-white px-2.5 py-1 rounded-xl text-xs font-medium transition-all duration-200"
                                                        >
                                                            <Trash className="h-3.5 w-3.5" />
                                                            Remove
                                                        </button>
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
                            ))}
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

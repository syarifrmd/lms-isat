import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { FileQuestion, PlusCircle, Clock, Award, Pencil, Trash2, AlertCircle, ClipboardList } from 'lucide-react';
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
import { Quiz } from '@/types';
import { useState } from 'react';

interface Course {
    id: number;
    title: string;
    description: string;
}

interface QuizListProps {
    course: Course;
    quizzes: Quiz[];
}

export default function QuizList({ course, quizzes }: QuizListProps) {
    const [quizToDelete, setQuizToDelete] = useState<number | null>(null);

    const handleDelete = () => {
        if (quizToDelete) {
            router.delete(`/assessments/quiz/${quizToDelete}`, {
                onSuccess: () => setQuizToDelete(null),
            });
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Penilaian', href: '/assessments' },
                { title: course.title, href: `/assessments/${course.id}/quizzes` },
            ]}
        >
            <Head title={`${course.title} - Penilaian`} />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* Header */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <ClipboardList className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Kursus</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600 line-clamp-1">{course.title}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Total</p>
                        <p className="mt-0.5 text-2xl font-bold text-gray-800 dark:text-gray-100">{quizzes.length}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">kuis tersedia</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex justify-end">
                    <Link
                        href={`/assessments/${course.id}/quizzes/create`}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 transition-colors shadow-sm"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Buat Kuis
                    </Link>
                </div>

                {/* Quiz Grid */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Semua Kuis</h2>
                        <span className="text-xs text-gray-300 dark:text-gray-600">{quizzes.length} kuis</span>
                    </div>

                    {quizzes.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400">
                            Belum ada kuis. Buat kuis pertama untuk menilai peserta didik Anda.
                        </div>
                    ) : (
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {quizzes.map((quiz) => (
                                <div
                                    key={quiz.id}
                                    className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden"
                                >
                                    {/* Color bar */}
                                    <div className="h-2 w-full bg-gradient-to-r from-sky-400 to-sky-600 shrink-0" />

                                    {/* Body */}
                                    <div className="flex flex-col flex-1 px-4 pt-4 pb-4 gap-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug flex-1">
                                                {quiz.title}
                                            </p>
                                            {quiz.module && (
                                                <span className="inline-block bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 text-xs font-semibold px-2 py-0.5 rounded-full shrink-0">
                                                    {quiz.module.title}
                                                </span>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500 flex-1">
                                            <div className="flex items-center gap-1">
                                                <FileQuestion className="h-3.5 w-3.5" />
                                                <span>{quiz.questions_count || 0} Pertanyaan</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                <span>Lulus: {quiz.passing_score}%</span>
                                            </div>
                                            {quiz.is_timed && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    <span>{Math.floor((quiz.time_limit_second || 0) / 60)} menit</span>
                                                </div>
                                            )}
                                            {quiz.xp_bonus && (
                                                <div className="flex items-center gap-1">
                                                    <Award className="h-3.5 w-3.5" />
                                                    <span>+{quiz.xp_bonus} XP</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer row */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                            <button
                                                onClick={() => setQuizToDelete(quiz.id)}
                                                className="group inline-flex items-center gap-1 cursor-pointer border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-700 dark:hover:text-white px-2.5 py-1 rounded-xl text-xs font-medium transition-all duration-200"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Hapus
                                            </button>
                                            <Link
                                                href={`/assessments/quiz/${quiz.id}/edit`}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/40 text-xs font-medium transition-colors"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!quizToDelete} onOpenChange={(open) => !open && setQuizToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kuis?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Kuis beserta semua pertanyaan dan riwayat percobaan peserta akan dihapus secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </AppLayout>
    );
}

import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PlayCircle, FileText, Plus, File as FileIcon, Link as LinkIcon, Edit, FileQuestion, Clock, Award, AlertCircle, Lock, CheckCircle, Star, MessageSquare, Trash2 } from 'lucide-react';
import { Quiz, SharedData } from '@/types';
import { useState } from 'react';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import '@cyntler/react-doc-viewer/dist/index.css';

interface Module {
    id: number;
    title: string;
    video_url: string;
    doc_url: string;
    content_text: string;
    order_sequence: number;
    is_completed?: boolean;
    is_locked?: boolean;
    is_text_read?: boolean;
    is_video_watched?: boolean;
    quizzes?: QuizWithProgress[];
}

interface QuizWithProgress extends Quiz {
    attempts_count?: number;
    is_passed?: boolean;
}

interface Course {
    id: number;
    title: string;
    description: string;
    modules: Module[];
    quizzes?: Quiz[];
    created_by: string;
    creator?: CourseCreator;
}

interface CourseCreator {
    name: string;
    id?: string;
}

interface UserRating {
    rating: number;
    review: string | null;
}

interface RatingData {
    average: number | null;
    count: number;
    distribution: Record<string, number>;
    user_rating: UserRating | null;
}

interface ShowProps {
    course: Course;
    userProgress?: number;
    isEnrolled?: boolean;
    ratingData?: RatingData;
}

export default function CourseShow({ course, userProgress = 0, isEnrolled = false, ratingData }: ShowProps) {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.user.role === 'admin';
    const isTrainer = auth.user.role === 'trainer' || isAdmin;
    const isCreator = course.created_by === auth.user.id;
    const canManage = isAdmin || isCreator; // admin can manage all, trainer only own
    const trainerName = course?.creator?.name || 'Instructor';
    const trainerId = course?.creator?.id || 'N/A';

    const trainerInitials = trainerName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    const handleMarkTextRead = (moduleId: number) => {
        router.post(`/modules/${moduleId}/progress/text`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Ideally this would be handled by Inertia reloading props, 
                // but we can also show a toast here if we had one.
            }
        });
    };

    const handleMarkVideoWatched = (moduleId: number) => {
        router.post(`/modules/${moduleId}/progress/video`, {}, {
            preserveScroll: true,
        });
    };

    // ── Quiz confirmation modal ──────────────────────────────────────────────
    const [confirmQuiz, setConfirmQuiz] = useState<QuizWithProgress | null>(null);

    const startQuiz = () => {
        if (!confirmQuiz) return;
        router.visit(`/quiz/${confirmQuiz.id}`);
    };

    // ── Rating form ─────────────────────────────────────────────────────────
    const [hovered, setHovered] = useState(0);
    const { data: ratingForm, setData: setRatingData, post: postRating, delete: deleteRating, processing: ratingProcessing } = useForm({
        rating: ratingData?.user_rating?.rating ?? 0,
        review: ratingData?.user_rating?.review ?? '',
    });

    const submitRating = (e: React.FormEvent) => {
        e.preventDefault();
        postRating(`/courses/${course.id}/ratings`, { preserveScroll: true });
    };

    const removeRating = () => {
        deleteRating(`/courses/${course.id}/ratings`, { preserveScroll: true });
    };

    const getPreviewUri = (url: string) => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (typeof window === 'undefined') return url;
        return new URL(url, window.location.origin).toString();
    };

    const getFileName = (url: string) => {
        const clean = url.split('?')[0];
        const name = clean.split('/').pop();
        return name || 'Dokumen';
    };

    const renderDocPreview = (docUrl: string) => {
        const fullUrl = getPreviewUri(docUrl);
        return (
            <DocViewer
                documents={[{ uri: fullUrl, fileName: getFileName(docUrl) }]}
                pluginRenderers={DocViewerRenderers}
                config={{
                    header: {
                        disableHeader: true,
                        disableFileName: true,
                        retainURLParams: false,
                    },
                    pdfZoom: {
                        defaultZoom: 1,
                        zoomJump: 0.2,
                    },
                }}
                style={{ width: '100%', minHeight: '480px' }}
            />
        );
    };


    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Courses', href: '/courses' }, 
                { title: course.title, href: `/courses/${course.id}` }
            ]}
        >
            <Head title={course.title} />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* ── Course Title Header ── */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-linear-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 shadow-sm px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Course</p>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{course.title}</h1>
                            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{course.description}</p>
                        </div>
                        {isTrainer && canManage && (
                            <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
                                <Link href={`/courses/${course.id}/edit`}>
                                    <Edit className="w-3.5 h-3.5" />
                                    Edit Course
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Main grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT: Modules */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        {/* Section header row */}
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                Course Modules
                                <span className="ml-2 text-gray-300 dark:text-gray-600 normal-case tracking-normal font-normal">
                                    ({course.modules.length})
                                </span>
                            </p>
                            {isTrainer && canManage && (
                                <Button asChild size="sm">
                                    <Link href={`/courses/${course.id}/modules/create`}>
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        Add Module
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {/* Modules accordion */}
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                            <Accordion type="single" collapsible className="w-full">
                                {course.modules.length > 0 ? (
                                    course.modules.map((module, index) => (
                                        <AccordionItem key={module.id} value={`item-${module.id}`} disabled={module.is_locked}
                                            className="border-b border-gray-50 dark:border-gray-700/60 last:border-0">
                                            <AccordionTrigger className={`px-5 py-4 hover:no-underline hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors ${module.is_locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <div className="flex items-center gap-4 text-left w-full">
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shrink-0 ${
                                                        module.is_completed
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                                            : module.is_locked
                                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                                            : 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400'
                                                    }`}>
                                                        {module.is_completed ? <CheckCircle className="w-4 h-4" /> :
                                                         module.is_locked   ? <Lock className="w-3.5 h-3.5" /> :
                                                         index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                                            {module.title}
                                                            {module.is_locked && <span className="text-xs font-normal text-gray-400">(Locked)</span>}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                            {module.video_url && (
                                                                <span className="flex items-center gap-1"><PlayCircle className="w-3 h-3" /> Video</span>
                                                            )}
                                                            {module.doc_url && (
                                                                <a href={module.doc_url} target="_blank" rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 hover:text-sky-500 transition-colors"
                                                                    onClick={e => e.stopPropagation()}>
                                                                    <FileIcon className="w-3 h-3" /> Document
                                                                </a>
                                                            )}
                                                            {module.content_text && (
                                                                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Text</span>
                                                            )}
                                                            {(module.quizzes?.length ?? 0) > 0 && (
                                                                <span className="flex items-center gap-1"><FileQuestion className="w-3 h-3" /> Quiz</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isTrainer && canManage && (
                                                        <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                                            <Link href={`/courses/${course.id}/modules/${module.id}/edit`}>
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </AccordionTrigger>

                                            <AccordionContent className="px-5 py-4 bg-gray-50/50 dark:bg-gray-700/20">
                                                {module.video_url && (
                                                    <div className="mb-4">
                                                        <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
                                                            <iframe
                                                                width="100%" height="100%"
                                                                src={`https://www.youtube.com/embed/${module.video_url}`}
                                                                title={module.title}
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                                className="absolute top-0 left-0 w-full h-full"
                                                            />
                                                        </div>
                                                        {!module.is_video_watched && !isTrainer && (
                                                            <div className="mt-2 flex justify-end">
                                                                <Button size="sm" onClick={() => handleMarkVideoWatched(module.id)}>
                                                                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Video as Watched
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {module.is_video_watched && !isTrainer && (
                                                            <div className="mt-2 flex justify-end">
                                                                <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
                                                                    <CheckCircle className="w-4 h-4 mr-2" /> Video Watched
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {module.doc_url && (
                                                    <div className="mb-4 space-y-3">
                                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="bg-sky-100 dark:bg-sky-900/40 p-2 rounded-lg shrink-0">
                                                                    <FileIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-sm text-gray-800 dark:text-gray-100">Dokumen Modul</p>
                                                                    <p className="text-xs text-gray-400 truncate">
                                                                        {module.doc_url.startsWith('/storage/')
                                                                            ? getFileName(module.doc_url)
                                                                            : module.doc_url.replace(/^https?:\/\//, '').split('/')[0]}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Button variant="outline" size="sm" asChild className="shrink-0">
                                                                <a href={module.doc_url} target="_blank" rel="noopener noreferrer">
                                                                    Lihat / Unduh <LinkIcon className="ml-2 w-3 h-3" />
                                                                </a>
                                                            </Button>
                                                        </div>

                                                        <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                                                            {renderDocPreview(module.doc_url)}
                                                        </div>
                                                    </div>
                                                )}

                                                {module.content_text && (
                                                    <div className="mt-2">
                                                        <div className="prose prose-sm dark:prose-invert max-w-none rich-text-content"
                                                            dangerouslySetInnerHTML={{ __html: module.content_text }} />
                                                        {!module.is_text_read && !isTrainer && (
                                                            <div className="mt-4 flex justify-end">
                                                                <Button size="sm" onClick={() => handleMarkTextRead(module.id)}>
                                                                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Read
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {module.is_text_read && !isTrainer && (
                                                            <div className="mt-4 flex justify-end">
                                                                <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
                                                                    <CheckCircle className="w-4 h-4 mr-2" /> Read
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {((isTrainer && canManage) || (module.quizzes?.length ?? 0) > 0) && (
                                                    <div className="mt-5 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                                                <FileQuestion className="w-3.5 h-3.5" /> Assessments
                                                            </p>
                                                            {isTrainer && canManage && (
                                                                <Button asChild size="sm" variant="outline">
                                                                    <Link href={`/assessments/${course.id}/quizzes/create`}>
                                                                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Quiz
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {module.quizzes!.map((quiz) => (
                                                                <div key={quiz.id}
                                                                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
                                                                    <div className="flex-1 min-w-0 mr-4">
                                                                        <h3 className="font-medium text-sm text-gray-800 dark:text-gray-100 mb-1 truncate">{quiz.title}</h3>
                                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                                                                            <span className="flex items-center gap-1">
                                                                                <FileQuestion className="h-3 w-3" />{quiz.questions_count || 0} Qs
                                                                            </span>
                                                                            {quiz.passing_score && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <AlertCircle className="h-3 w-3" />Pass: {quiz.passing_score}%
                                                                                </span>
                                                                            )}
                                                                            {quiz.is_timed && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <Clock className="h-3 w-3" />{Math.floor((quiz.time_limit_second || 0) / 60)}m
                                                                                </span>
                                                                            )}
                                                                            <span className={`flex items-center gap-1 ${(quiz.attempts_count || 0) >= 3 ? 'text-red-500 font-medium' : ''}`}>
                                                                                <Award className="h-3 w-3" />
                                                                                Attempt: {quiz.attempts_count || 0}/3
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {(() => {
                                                                        const q = quiz;
                                                                        const attempts = q.attempts_count || 0;
                                                                        if (q.is_passed) return (
                                                                            <Button size="sm" variant="outline"
                                                                                className="text-emerald-600 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 cursor-default">
                                                                                <CheckCircle className="w-4 h-4 mr-2" /> Lulus
                                                                            </Button>
                                                                        );
                                                                        if (attempts >= 3) return (
                                                                            <Button size="sm" variant="destructive" disabled className="opacity-75 cursor-not-allowed">
                                                                                <AlertCircle className="w-4 h-4 mr-2" /> Tidak lulus
                                                                            </Button>
                                                                        );
                                                                        return (
                                                                            <Button size="sm" onClick={() => setConfirmQuiz(quiz)}>
                                                                                Start Quiz
                                                                            </Button>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))
                                ) : (
                                    <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                                        No modules yet. Add one to get started!
                                    </div>
                                )}
                            </Accordion>
                        </div>
                    </div>

                    {/* RIGHT: Sidebar – order-first on mobile, last column on desktop */}
                    <div className="flex flex-col gap-3 lg:gap-4 order-first lg:order-last">

                        {/* Progress card */}
                        {!isTrainer && (
                            <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-linear-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 shadow-sm p-4 lg:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-sky-400">Progress Belajar</p>
                                    <span className="text-2xl lg:text-xl font-bold text-sky-600 leading-none">{userProgress}%</span>
                                </div>
                                <div className="w-full bg-sky-100 dark:bg-sky-900/40 rounded-full h-2.5">
                                    <div
                                        className="bg-sky-500 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${userProgress}%` }}
                                    />
                                </div>
                                <p className="mt-1.5 text-[11px] sm:text-xs text-sky-400">{userProgress < 100 ? 'Selesaikan semua modul untuk mendapat sertifikat' : ''}</p>
                                {userProgress === 100 && (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-semibold flex items-center gap-1.5">
                                        <CheckCircle className="w-4 h-4" /> Kursus Selesai!
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Instructor card */}
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 lg:p-5">
                            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Instruktur</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 flex items-center justify-center font-bold text-sm lg:text-base shrink-0">
                                    {trainerInitials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-sm lg:text-sm text-gray-800 dark:text-gray-100 truncate">{trainerName}</p>
                                    <p className="text-[11px] sm:text-xs text-gray-400">Pembuat Kursus</p>
                                    <p className="text-[11px] sm:text-xs text-gray-400">ID: {trainerId}</p>
                                </div>
                            </div>
                        </div>

                        {/* Rating card */}
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 lg:p-5 space-y-3 lg:space-y-4">
                            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Course Rating
                            </p>

                            {/* Average */}
                            <div className="flex items-end gap-3">
                                <span className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 leading-none">
                                    {ratingData?.average ?? '—'}
                                </span>
                                <div className="pb-0.5 space-y-1">
                                    <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(s => (
                                            <Star key={s} className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                                s <= Math.round(ratingData?.average ?? 0)
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-gray-200 dark:text-gray-600'
                                            }`} />
                                        ))}
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-gray-400">{ratingData?.count ?? 0} rating{ratingData?.count !== 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            {/* Distribution bars */}
                            {(ratingData?.count ?? 0) > 0 && (
                                <div className="space-y-1.5">
                                    {[5,4,3,2,1].map(star => {
                                        const count = ratingData?.distribution?.[star] ?? 0;
                                        const pct = ratingData?.count ? Math.round((count / ratingData.count) * 100) : 0;
                                        return (
                                            <div key={star} className="flex items-center gap-2 text-xs">
                                                <span className="w-3 text-gray-400">{star}</span>
                                                <Star className="w-3 h-3 shrink-0 text-amber-400 fill-amber-400" />
                                                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="w-6 text-right text-gray-400">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Rating form – enrolled users */}
                            {!isTrainer && isEnrolled && (
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 lg:pt-4 space-y-3">
                                    <p className="text-[13px] sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {ratingData?.user_rating ? 'Rating Anda' : 'Beri Rating Kursus'}
                                    </p>
                                    <form onSubmit={submitRating} className="space-y-3">
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(star => (
                                                <button key={star} type="button"
                                                    onMouseEnter={() => setHovered(star)}
                                                    onMouseLeave={() => setHovered(0)}
                                                    onClick={() => setRatingData('rating', star)}
                                                    className="p-0.5 focus:outline-none">
                                                    <Star className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                                                        star <= (hovered || ratingForm.rating)
                                                            ? 'text-amber-400 fill-amber-400'
                                                            : 'text-gray-200 dark:text-gray-600'
                                                    }`} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={ratingForm.review}
                                            onChange={e => setRatingData('review', e.target.value)}
                                            placeholder="Share your experience (optional)..."
                                            rows={3}
                                            className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        />
                                        <div className="flex gap-2">
                                            <Button type="submit" size="sm"
                                                disabled={ratingProcessing || ratingForm.rating === 0}
                                                className="flex-1 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white">
                                                <Star className="w-3.5 h-3.5 fill-white" />
                                                {ratingData?.user_rating ? 'Update' : 'Submit'} Rating
                                            </Button>
                                            {ratingData?.user_rating && (
                                                <Button type="button" size="sm" variant="outline"
                                                    disabled={ratingProcessing} onClick={removeRating}
                                                    className="gap-1 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Not enrolled */}
                            {!isTrainer && !isEnrolled && (
                                <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-3 py-2.5 text-xs text-gray-400">
                                    <MessageSquare className="w-4 h-4 shrink-0" />
                                    Daftar kursus untuk memberi rating
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        {/* ── Quiz Confirmation Modal ── */}
            <Dialog open={!!confirmQuiz} onOpenChange={(open) => { if (!open) setConfirmQuiz(null); }}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Mulai Quiz</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                            Pastikan kamu siap sebelum memulai quiz ini.
                        </DialogDescription>
                    </DialogHeader>

                    {confirmQuiz && (
                        <div className="space-y-3 py-1">
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{confirmQuiz.title}</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-3 py-2.5">
                                    <FileQuestion className="w-4 h-4 text-sky-500 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-gray-400">Jumlah Soal</p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{confirmQuiz.questions_count || 0} soal</p>
                                    </div>
                                </div>
                                {confirmQuiz.is_timed && (
                                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-3 py-2.5">
                                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-gray-400">Batas Waktu</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                {Math.floor((confirmQuiz.time_limit_second || 0) / 60)} menit
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {confirmQuiz.passing_score != null && (
                                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-3 py-2.5">
                                        <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-gray-400">Nilai Lulus</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{confirmQuiz.passing_score}%</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-3 py-2.5">
                                    <AlertCircle className={`w-4 h-4 shrink-0 ${
                                        (confirmQuiz.attempts_count || 0) >= 2 ? 'text-red-500' : 'text-gray-400'
                                    }`} />
                                    <div>
                                        <p className="text-[11px] text-gray-400">Percobaan</p>
                                        <p className={`text-sm font-semibold ${
                                            (confirmQuiz.attempts_count || 0) >= 2 ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'
                                        }`}>
                                            {confirmQuiz.attempts_count || 0}/3 digunakan
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {(confirmQuiz.attempts_count || 0) >= 2 && (
                                <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 text-xs text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    Ini adalah percobaan terakhirmu. Gunakan dengan bijak!
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex-row gap-2 sm:flex-row">
                        <Button variant="outline" className="flex-1" onClick={() => setConfirmQuiz(null)}>Batal</Button>
                        <Button className="flex-1" onClick={startQuiz}>
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Mulai Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
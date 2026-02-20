import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlayCircle, FileText, Plus, File as FileIcon, Link as LinkIcon, Edit, FileQuestion, Clock, Award, AlertCircle, Lock, CheckCircle, Star, MessageSquare, Trash2 } from 'lucide-react';
import { Quiz, SharedData } from '@/types';
import { useState } from 'react';

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
    quizzes?: Quiz[];
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


    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Courses', href: '/courses' }, 
                { title: course.title, href: `/courses/${course.id}` }
            ]}
        >
            <Head title={course.title} />

            <div className="container px-4 mx-auto py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Course Content - Left/Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-3xl">{course.title}</CardTitle>
                                    <CardDescription className="text-lg mt-2">{course.description}</CardDescription>
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
                        </CardHeader>
                    </Card>

                    <div className="flex items-center justify-between">
                         <h2 className="text-xl font-bold">Course Modules</h2>
                         {isTrainer && canManage && (
                             <Button asChild>
                                <Link href={`/courses/${course.id}/modules/create`}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Module
                                </Link>
                             </Button>
                         )}
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Accordion type="single" collapsible className="w-full">
                                {course.modules.length > 0 ? (
                                    course.modules.map((module, index) => (
                                        <AccordionItem key={module.id} value={`item-${module.id}`} disabled={module.is_locked}>
                                            <AccordionTrigger className={`px-6 py-4 hover:no-underline hover:bg-muted/50 ${module.is_locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <div className="flex items-center gap-4 text-left w-full">
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shrink-0 ${
                                                        module.is_completed ? 'bg-green-100 text-green-600' : 
                                                        module.is_locked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                                                    }`}>
                                                        {module.is_completed ? <CheckCircle className="w-5 h-5" /> : 
                                                         module.is_locked ? <Lock className="w-4 h-4" /> : 
                                                         index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-base flex items-center gap-2">
                                                            {module.title}
                                                            {module.is_locked && <span className="text-xs font-normal text-muted-foreground">(Locked)</span>}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                                                            {module.video_url && (
                                                                <span className="flex items-center gap-1">
                                                                    <PlayCircle className="w-3 h-3" /> Video
                                                                </span>
                                                            )}
                                                            {module.doc_url && (
                                                                <a href={module.doc_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-500" onClick={e => e.stopPropagation()}>
                                                                    <FileIcon className="w-3 h-3" /> Document
                                                                </a>
                                                            )}
                                                            {module.content_text && (
                                                                <span className="flex items-center gap-1">
                                                                    <FileText className="w-3 h-3" /> Text
                                                                </span>
                                                            )}

                                                            {(module.quizzes?.length ?? 0) > 0 && (
                                                                <span className="flex items-center gap-1">
                                                                    <FileQuestion className="w-3 h-3" /> Quiz
                                                                </span>
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
                                            <AccordionContent className="px-6 py-4 bg-muted/20">
                                                {module.video_url && (
                                                    <div className="mb-4">
                                                        <div className="rounded-lg overflow-hidden bg-black aspect-video relative">
                                                            <iframe 
                                                                width="100%" 
                                                                height="100%" 
                                                                src={`https://www.youtube.com/embed/${module.video_url}`} 
                                                                title={module.title} 
                                                                frameBorder="0" 
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                                allowFullScreen
                                                                className="absolute top-0 left-0 w-full h-full"
                                                            ></iframe>
                                                        </div>
                                                        {!module.is_video_watched && !isTrainer && (
                                                            <div className="mt-2 flex justify-end">
                                                                <Button size="sm" onClick={() => handleMarkVideoWatched(module.id)}>
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Mark Video as Watched
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {module.is_video_watched && !isTrainer && (
                                                            <div className="mt-2 flex justify-end">
                                                                <span className="text-sm text-green-600 flex items-center font-medium">
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Video Watched
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                {module.doc_url && (
                                                    <div className="mb-6 p-4 border rounded-md bg-background flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                                                                <FileIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">Module Document</p>
                                                                <p className="text-xs text-muted-foreground truncate max-w-75">{module.doc_url}</p>
                                                            </div>
                                                        </div>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <a href={module.doc_url} target="_blank" rel="noopener noreferrer">
                                                                View / Download <LinkIcon className="ml-2 w-3 h-3" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                )}

                                                {module.content_text && (
                                                    <div className="mt-4">
                                                        <div className="prose prose-sm dark:prose-invert max-w-none rich-text-content" dangerouslySetInnerHTML={{ __html: module.content_text }} />
                                                        {!module.is_text_read && !isTrainer && (
                                                            <div className="mt-4 flex justify-end">
                                                                <Button 
                                                                    size="sm" 
                                                                    onClick={() => handleMarkTextRead(module.id)}
                                                                >
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Mark as Read
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {module.is_text_read && !isTrainer && (
                                                             <div className="mt-4 flex justify-end">
                                                                <span className="text-sm text-green-600 flex items-center font-medium">
                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                    Read
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {(module.quizzes?.length ?? 0) > 0 && (
                                                    <div className="mt-6 space-y-2 border-t pt-4">
                                                        <div className="text-sm font-semibold flex items-center gap-2">
                                                            <FileQuestion className="w-4 h-4" /> Module Assessments
                                                        </div>
                                                        <div className="space-y-3">
                                                            {module.quizzes!.map((quiz) => (
                                                                <div
                                                                    key={quiz.id}
                                                                    className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                                                                >
                                                                    <div className="flex-1 min-w-0 mr-4">
                                                                        <h3 className="font-medium text-sm mb-1 truncate">{quiz.title}</h3>
                                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                                            <span className="flex items-center gap-1">
                                                                                <FileQuestion className="h-3 w-3" />
                                                                                {quiz.questions_count || 0} Qs
                                                                            </span>
                                                                            {quiz.passing_score && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <AlertCircle className="h-3 w-3" />
                                                                                    Pass: {quiz.passing_score}%
                                                                                </span>
                                                                            )}
                                                                            {quiz.is_timed && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <Clock className="h-3 w-3" />
                                                                                    {Math.floor((quiz.time_limit_second || 0) / 60)}m
                                                                                </span>
                                                                            )}
                                                                             {/* Menampilkan Counter Percobaan '2/3' */}
                                                                            <span className={`flex items-center gap-1 ${((quiz as any).attempts_count || 0) >= 3 ? 'text-red-600 font-medium' : ''}`}>
                                                                                <Award className="h-3 w-3" />
                                                                                Attempt: {(quiz as any).attempts_count || 0}/3
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {/* <Button asChild size="sm" variant="secondary">
                                                                        <Link href={`/quiz/${quiz.id}`}>
                                                                            Start Quiz
                                                                        </Link>
                                                                    </Button> */}

                                                                    {/* LOGIKA BUTTON START / SELESAI / TIDAK LULUS */}
                                                                    {(() => {
                                                                        const q = quiz as any;
                                                                        const attempts = q.attempts_count || 0;
                                                                        
                                                                        if (q.is_passed) {
                                                                            return (
                                                                                <Button size="sm" variant="outline" className="text-green-600 border-green-600/20 bg-green-50 hover:bg-green-100 cursor-default">
                                                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                                                    Lulus
                                                                                </Button>
                                                                            );
                                                                        } 
                                                                        
                                                                        if (attempts >= 3) {
                                                                            return (
                                                                                <Button size="sm" variant="destructive" disabled className="opacity-75 cursor-not-allowed">
                                                                                    <AlertCircle className="w-4 h-4 mr-2" />
                                                                                    Tidak lulus
                                                                                </Button>
                                                                            );
                                                                        }

                                                                        return (
                                                                            <Button asChild size="sm" variant="secondary">
                                                                                <Link href={`/quiz/${quiz.id}`}>
                                                                                    Start Quiz
                                                                                </Link>
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
                                    <div className="p-8 text-center text-muted-foreground">
                                        No modules yet. Add one to get started!
                                    </div>
                                )}
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    {/* START PROGRESS CARD */}
                    {!isTrainer && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Your Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>Course Completion</span>
                                        <span>{userProgress}%</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2.5">
                                        <div 
                                            className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                                            style={{ width: `${userProgress}%` }}
                                        ></div>
                                    </div>
                                    {userProgress === 100 && (
                                        <p className="text-sm text-green-600 mt-2 font-semibold">
                                            Course Completed!
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                     )}
                     {/* END PROGRESS CARD */}

                    <Card>
                         <CardHeader>
                            <CardTitle className="text-lg">Instructor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    {/* Placeholder avatar */}
                                    <span className="font-bold">{trainerInitials}</span>
                                </div>
                                <div>
                                    <div className="font-medium">
                                        <span>{trainerName}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Course Creator</div>
                                    <div className="text-xs text-muted-foreground">
                                        <span>ID : {trainerId}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Course Rating Card ── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                Course Rating
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Average display */}
                            <div className="flex items-end gap-3">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white leading-none">
                                    {ratingData?.average ?? '—'}
                                </span>
                                <div className="pb-0.5 space-y-1">
                                    <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(s => (
                                            <Star
                                                key={s}
                                                className={`w-4 h-4 ${
                                                    s <= Math.round(ratingData?.average ?? 0)
                                                        ? 'text-amber-400 fill-amber-400'
                                                        : 'text-gray-300 dark:text-neutral-600'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">{ratingData?.count ?? 0} rating{ratingData?.count !== 1 ? 's' : ''}</p>
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
                                                <span className="w-3 text-muted-foreground">{star}</span>
                                                <Star className="w-3 h-3 shrink-0 text-amber-400 fill-amber-400" />
                                                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                                                    <div
                                                        className="h-full rounded-full bg-amber-400 transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="w-6 text-right text-muted-foreground">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Rating form — only for enrolled non-trainer users */}
                            {!isTrainer && isEnrolled && (
                                <div className="border-t pt-4 space-y-3">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {ratingData?.user_rating ? 'Your Rating' : 'Rate this Course'}
                                    </p>
                                    <form onSubmit={submitRating} className="space-y-3">
                                        {/* Star selector */}
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onMouseEnter={() => setHovered(star)}
                                                    onMouseLeave={() => setHovered(0)}
                                                    onClick={() => setRatingData('rating', star)}
                                                    className="p-0.5 focus:outline-none"
                                                >
                                                    <Star
                                                        className={`w-7 h-7 transition-colors ${
                                                            star <= (hovered || ratingForm.rating)
                                                                ? 'text-amber-400 fill-amber-400'
                                                                : 'text-gray-300 dark:text-neutral-600'
                                                        }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {/* Review textarea */}
                                        <textarea
                                            value={ratingForm.review}
                                            onChange={e => setRatingData('review', e.target.value)}
                                            placeholder="Share your experience (optional)..."
                                            rows={3}
                                            className="w-full resize-none rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-white/10 dark:text-gray-200"
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                type="submit"
                                                size="sm"
                                                disabled={ratingProcessing || ratingForm.rating === 0}
                                                className="flex-1 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                                            >
                                                <Star className="w-3.5 h-3.5 fill-white" />
                                                {ratingData?.user_rating ? 'Update' : 'Submit'} Rating
                                            </Button>
                                            {ratingData?.user_rating && (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={ratingProcessing}
                                                    onClick={removeRating}
                                                    className="gap-1 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Message for non-enrolled users */}
                            {!isTrainer && !isEnrolled && (
                                <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-white/10 px-3 py-2.5 text-xs text-muted-foreground">
                                    <MessageSquare className="w-4 h-4 shrink-0" />
                                    Enroll to rate this course
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
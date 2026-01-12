import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlayCircle, FileText, Plus, File as FileIcon, Link as LinkIcon, Edit, FileQuestion, Clock, Award, AlertCircle, Lock, CheckCircle } from 'lucide-react';
import { Quiz, SharedData } from '@/types';

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
}

interface Course {
    id: number;
    title: string;
    description: string;
    modules: Module[];
    quizzes?: Quiz[];
    created_by: number;
    creator?: CourseCreator;
}

interface CourseCreator {
    name: string;
    profile?: {
        employee_id: string;
    };
}

interface ShowProps {
    course: Course;
}

export default function CourseShow({ course }: ShowProps) {
    const { auth } = usePage<SharedData>().props;
    const isTrainer = auth.user.profile?.role === 'trainer' || auth.user.profile?.role === 'admin';
    const isCreator = course.created_by === auth.user.id;
    const trainerName = course?.creator?.name || 'Instructor';
    const trainerId = course?.creator?.profile?.employee_id || 'N/A';

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
                            <CardTitle className="text-3xl">{course.title}</CardTitle>
                            <CardDescription className="text-lg mt-2">{course.description}</CardDescription>
                        </CardHeader>
                    </Card>

                    <div className="flex items-center justify-between">
                         <h2 className="text-xl font-bold">Course Modules</h2>
                         {isTrainer && isCreator && (
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
                                                        </div>
                                                    </div>
                                                    {isTrainer && isCreator && (
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
                                                    <div className="mb-4 rounded-lg overflow-hidden bg-black aspect-video relative">
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

                    {/* Assessments Section */}
                    {course.quizzes && course.quizzes.length > 0 && (
                        <>
                            <div className="flex items-center justify-between mt-8">
                                <h2 className="text-xl font-bold">Assessments</h2>
                            </div>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="space-y-3">
                                        {course.quizzes.map((quiz) => (
                                            <div
                                                key={quiz.id}
                                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-base mb-1">{quiz.title}</h3>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <FileQuestion className="h-3.5 w-3.5" />
                                                            {quiz.questions_count || 0} Questions
                                                        </span>
                                                        {quiz.passing_score && (
                                                            <span className="flex items-center gap-1">
                                                                <AlertCircle className="h-3.5 w-3.5" />
                                                                Passing: {quiz.passing_score}%
                                                            </span>
                                                        )}
                                                        {quiz.is_timed && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                {Math.floor((quiz.time_limit_second || 0) / 60)} min
                                                            </span>
                                                        )}
                                                        {quiz.xp_bonus && (
                                                            <span className="flex items-center gap-1">
                                                                <Award className="h-3.5 w-3.5" />
                                                                +{quiz.xp_bonus} XP
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button asChild>
                                                    <Link href={`/quiz/${quiz.id}`}>
                                                        Take Quiz
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Course Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 grow bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[0%]"></div>
                                </div>
                                <span className="text-sm font-medium">0%</span>
                             </div>
                             <p className="text-xs text-muted-foreground">Start watching modules to track your progress.</p>
                        </CardContent>
                    </Card>

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
                </div>
            </div>
        </AppLayout>
    );
}

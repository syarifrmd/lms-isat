import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlayCircle, FileText, Plus, File as FileIcon, Link as LinkIcon, Edit } from 'lucide-react';

interface Module {
    id: number;
    title: string;
    video_url: string;
    doc_url: string;
    content_text: string;
    order_sequence: number;
}

interface Course {
    id: number;
    title: string;
    description: string;
    modules: Module[];
}

export default function CourseShow({ course }: { course: Course }) {
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
                         <Button asChild>
                            <Link href={`/courses/${course.id}/modules/create`}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Module
                            </Link>
                         </Button>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <Accordion type="single" collapsible className="w-full">
                                {course.modules.length > 0 ? (
                                    course.modules.map((module, index) => (
                                        <AccordionItem key={module.id} value={`item-${module.id}`}>
                                            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50">
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-base">{module.title}</div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                                                            {module.video_url && (
                                                                <span className="flex items-center gap-1">
                                                                    <PlayCircle className="w-3 h-3" /> Video
                                                                </span>
                                                            )}
                                                            {module.doc_url && (
                                                                <a href={module.doc_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-500">
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
                                                    <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                                        <Link href={`/courses/${course.id}/modules/${module.id}/edit`}>
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                    </Button>
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
                                                    <div className="prose prose-sm dark:prose-invert max-w-none rich-text-content" dangerouslySetInnerHTML={{ __html: module.content_text }} />
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
                                    <span className="font-bold">VP</span>
                                </div>
                                <div>
                                    <div className="font-medium">Video Producer</div>
                                    <div className="text-xs text-muted-foreground">Course Creator</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

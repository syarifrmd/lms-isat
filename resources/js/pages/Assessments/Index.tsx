import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileQuestion, PlusCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

export default function AssessmentsIndex({ courses }: { courses: Course[] }) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Assessments', href: '/assessments' }]}>
            <Head title="Assessments Management" />

            <div className="container px-4 mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Assessment Management</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage quizzes and assessments for your courses
                        </p>
                    </div>
                </div>

                {courses.length === 0 ? (
                    <Card className="p-12 text-center">
                        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Courses Found</h3>
                        <p className="text-muted-foreground mb-4">
                            Create a course first to start adding assessments
                        </p>
                        <Button asChild>
                            <Link href="/courses/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Course
                            </Link>
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
                                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                    {course.cover_url ? (
                                        <img
                                            src={course.cover_url}
                                            alt={course.title}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-primary/5">
                                            <BookOpen className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            {course.category && (
                                                <Badge variant="outline" className="mb-2">
                                                    {course.category}
                                                </Badge>
                                            )}
                                            <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                                        </div>
                                    </div>
                                    {course.description && (
                                        <CardDescription className="line-clamp-2">
                                            {course.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <FileQuestion className="h-4 w-4" />
                                        <span>
                                            {course.quizzes_count} {course.quizzes_count === 1 ? 'Quiz' : 'Quizzes'}
                                        </span>
                                    </div>
                                </CardContent>

                                <CardFooter className="flex flex-col gap-2">
                                    <Button asChild className="w-full">
                                        <Link href={`/assessments/${course.id}/quizzes`}>
                                            Manage Assessments
                                        </Link>
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center">
                                        Created {formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}
                                    </p>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

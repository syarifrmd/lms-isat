import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    FileQuestion, 
    PlusCircle, 
    Clock, 
    Award, 
    Pencil, 
    Trash2,
     AlertCircle
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Quiz } from '@/types';

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
    const handleDelete = (quizId: number) => {
        router.delete(`/assessments/quiz/${quizId}`, {
            onSuccess: () => {
                // Success message will be shown via flash
            },
        });
    };

    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Assessments', href: '/assessments' },
                { title: course.title, href: `/assessments/${course.id}/quizzes` }
            ]}
        >
            <Head title={`${course.title} - Assessments`} />

            <div className="container px-4 mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage assessments and quizzes for this course
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={`/assessments/${course.id}/quizzes/create`}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Quiz
                        </Link>
                    </Button>
                </div>

                {quizzes.length === 0 ? (
                    <Card className="p-12 text-center">
                        <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Quizzes Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Create your first quiz to assess your students
                        </p>
                        <Button asChild>
                            <Link href={`/assessments/${course.id}/quizzes/create`}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Quiz
                            </Link>
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {quizzes.map((quiz) => (
                            <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                {quiz.title}
                                                {quiz.module && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Module: {quiz.module.title}
                                                    </Badge>
                                                )}
                                            </CardTitle>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                asChild
                                                variant="outline" 
                                                size="sm"
                                            >
                                                <Link href={`/assessments/quiz/${quiz.id}/edit`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete "{quiz.title}"? This action cannot be undone and will also delete all associated questions and student attempts.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(quiz.id)}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <FileQuestion className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {quiz.questions_count || 0} {quiz.questions_count === 1 ? 'Question' : 'Questions'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                            <span>Passing: {quiz.passing_score}%</span>
                                        </div>
                                        {quiz.is_timed && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>
                                                    {Math.floor((quiz.time_limit_second || 0) / 60)} minutes
                                                </span>
                                            </div>
                                        )}
                                        {quiz.xp_bonus && (
                                            <div className="flex items-center gap-2">
                                                <Award className="h-4 w-4 text-muted-foreground" />
                                                <span>+{quiz.xp_bonus} XP</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertCircle, Award, CheckCircle } from 'lucide-react';
import { Quiz, UserQuizAttempt } from '@/types';
import { FormEvent, useEffect, useState } from 'react';
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
}

interface TakeQuizProps {
    quiz: Quiz;
    course: Course;
    previousAttempt?: UserQuizAttempt | null;
    attempts_count?: number;
    has_passed?: boolean;
}

export default function TakeQuiz({ quiz, course, previousAttempt, attempts_count = 0, has_passed = false }: TakeQuizProps) {
    const MAX_ATTEMPTS = 3; // Maksimal percobaan mengerjakan quiz
    const isLimitReached = (attempts_count >= MAX_ATTEMPTS) && (!previousAttempt?.is_passed);
    const { data, setData, post, processing, errors } = useForm({
        answers: [] as Array<{ question_id: number; answer_id: number }>,
    });

    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Initialize timer if quiz is timed
    useEffect(() => {
        if (isLimitReached) return;
        if (quiz.is_timed && quiz.time_limit_second) {
            setTimeRemaining(quiz.time_limit_second);
        }
    }, [quiz, isLimitReached]);

    // Countdown timer
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 1) {
                    clearInterval(timer);
                    // Auto-submit when time's up
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

        // Letakkan ini di level atas komponen (sejajar dengan useState lainnya)
    useEffect(() => {
        const answersArray = Object.entries(selectedAnswers).map(([question_id, answer_id]) => ({
            question_id: parseInt(question_id),
            answer_id: answer_id,
        }));
        
        setData('answers', answersArray);
    }, [selectedAnswers]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId: number, answerId: number) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: answerId,
        }));
    };

    const handleSubmitClick = (e: FormEvent) => {
        e.preventDefault();
        if (has_passed) {
            alert('Anda sudah lulus quiz ini, tidak perlu mengulang.');
            return;
        }
        if (isLimitReached)
        {
            alert('Anda telah mencapai batas maksimal percobaan mengerjakan quiz ini.');
            return;
        }
        // Check if all questions are answered
        if (Object.keys(selectedAnswers).length < (quiz.questions?.length || 0)) {
            alert('Mohon jawab semua pertanyaan terlebih dahulu!');
            return;
        }

        // Show confirmation dialog
        setShowConfirmDialog(true);
    };

        const confirmSubmit = () => {
        post(`/quiz/${quiz.id}/submit`, {
            onFinish: () => setShowConfirmDialog(false),
        });
    };

    const handleSubmit = () => {
        post(`/quiz/${quiz.id}/submit`);
    };
    const answerLabels = ['A', 'B', 'C', 'D'];

    if (has_passed) {
        return (
            <AppLayout 
                breadcrumbs={[
                    { title: 'Courses', href: '/courses' },
                    { title: course.title, href: `/courses/${course.id}` },
                    { title: quiz.title, href: '#' }
                ]}
            >
                <Head title={`${quiz.title} - ${course.title}`} />
                 <div className="container px-4 mx-auto py-8 max-w-4xl">
                         <Card className="border-green-500/50 bg-green-500/5">
                            <CardHeader>
                                <CardTitle className="text-green-600 flex items-center gap-2">
                                    <CheckCircle className="h-6 w-6" />
                                    Quiz Selesai (Lulus)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-lg">
                                    Selamat! Anda telah berhasil menyelesaikan quiz ini dan memenuhi standar kelulusan.
                                </p>
                                <Button asChild className="mt-4 bg-green-600 hover:bg-green-700">
                                    <Link href={`/courses/${course.id}`}>Kembali ke Materi</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </AppLayout>
            );
        }

    if (isLimitReached) {
    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Courses', href: '/courses' },
                { title: course.title, href: `/courses/${course.id}` },
                { title: quiz.title, href: '#' }
            ]}
        >
            <Head title={`${quiz.title} - ${course.title}`} />
             <div className="container px-4 mx-auto py-8 max-w-4xl">
                     <Card className="border-destructive/50 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2">
                                <AlertCircle className="h-6 w-6" />
                                Batas Percobaan Tercapai
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg">
                                Mohon maaf, Anda telah menggunakan <strong>{attempts_count} dari {MAX_ATTEMPTS}</strong> kesempatan percobaan dan belum mencapai nilai kelulusan ({quiz.passing_score}%).
                            </p>
                            <p className="text-muted-foreground">
                                Silakan hubungi instruktur atau pelajari kembali materi course sebelum diizinkan mencoba lagi.
                            </p>
                            <Button asChild className="mt-4">
                                <Link href={`/courses/${course.id}`}>Kembali ke Materi</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Courses', href: '/courses' },
                { title: course.title, href: `/courses/${course.id}` },
                { title: quiz.title, href: '#' }
            ]}
        >
            <Head title={`${quiz.title} - ${course.title}`} />
            
            <div className="container px-4 mx-auto py-8 max-w-4xl">
                {/* Quiz Header */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-2xl">{quiz.title}</CardTitle>
                                <CardDescription className="mt-2">
                                    {course.title}
                                </CardDescription>
                            </div>
                            {timeRemaining !== null && (
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                                    timeRemaining < 300 ? 'border-destructive bg-destructive/10' : 'border-border'
                                }`}>
                                    <Clock className="h-5 w-5" />
                                    <span className="font-mono text-lg font-semibold">
                                        {formatTime(timeRemaining)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                <span>Passing: {quiz.passing_score}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                <span>{quiz.questions?.length || 0} Questions</span>
                            </div>
                            {quiz.is_timed && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{Math.floor((quiz.time_limit_second || 0) / 60)} minutes</span>
                                </div>
                            )}
                            {quiz.xp_bonus && (
                                <div className="flex items-center gap-2">
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                    <span>+{quiz.xp_bonus} XP Bonus</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Previous Attempt Alert */}
                {previousAttempt && (
                    <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Anda sudah pernah mengerjakan quiz ini dengan skor {previousAttempt.score}%. 
                            {previousAttempt.is_passed ? ' Anda lulus!' : ' Anda dapat mencoba lagi.'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Questions */}
                <form onSubmit={handleSubmitClick} className="space-y-6">
                    {quiz.questions?.map((question, qIndex) => (
                        <Card key={question.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Question {qIndex + 1}
                                    <span className="text-sm font-normal text-muted-foreground ml-2">
                                        ({question.point} {question.point === 1 ? 'point' : 'points'})
                                    </span>
                                </CardTitle>
                                <CardDescription className="text-base mt-2">
                                    {question.question_text}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={selectedAnswers[question.id]?.toString()}
                                    onValueChange={(value) => handleAnswerSelect(question.id, parseInt(value))}
                                >
                                    <div className="space-y-3">
                                        {question.answers?.map((answer, aIndex) => (
                                            <div
                                                key={answer.id}
                                                className={`relative flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                                                    selectedAnswers[question.id] === answer.id 
                                                        ? 'bg-accent border-primary' 
                                                        : 'hover:bg-muted/50'
                                                }`}
                                            >
                                                <RadioGroupItem
                                                    value={answer.id.toString()}
                                                    id={`q${question.id}-a${answer.id}`}
                                                />
                                                <Label
                                                    htmlFor={`q${question.id}-a${answer.id}`}
                                                    className="flex items-center gap-3 cursor-pointer flex-1 after:absolute after:inset-0"
                                                >
                                                    <span className="font-semibold min-w-[24px]">
                                                        {answerLabels[aIndex]}
                                                    </span>
                                                    <span className="flex-1">{answer.answer_text}</span>
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Submit Button */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Dijawab: {Object.keys(selectedAnswers).length} / {quiz.questions?.length || 0}
                                </p>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild>
                                        <Link href={`/courses/${course.id}`}>
                                            Batal
                                        </Link>
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={processing || Object.keys(selectedAnswers).length < (quiz.questions?.length || 0)}
                                    >
                                        {processing ? 'Mengumpulkan...' : 'Kumpulkan Quiz'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>

                {/* Confirmation Dialog */}
                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Konfirmasi Pengumpulan Quiz</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-2">
                                <p>
                                    Anda telah menjawab <strong>{Object.keys(selectedAnswers).length}</strong> dari{' '}
                                    <strong>{quiz.questions?.length || 0}</strong> soal.
                                </p>
                                <p className="text-yellow-600 dark:text-yellow-500 font-medium">
                                    ⚠️ Setelah dikumpulkan, Anda tidak dapat mengubah jawaban.
                                </p>
                                <p>
                                    Yakin ingin mengumpulkan quiz ini sekarang?
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={processing}>
                                Batal
                            </AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={confirmSubmit}
                                disabled={processing}
                                className="bg-primary"
                            >
                                {processing ? 'Mengumpulkan...' : 'Ya, Kumpulkan'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
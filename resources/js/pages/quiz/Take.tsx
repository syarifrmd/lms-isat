import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertCircle, Award, CheckCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Quiz, UserQuizAttempt } from '@/types';
import { FormEvent, useEffect, useRef, useState } from 'react';
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

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export default function TakeQuiz({ quiz, course, previousAttempt, attempts_count = 0, has_passed = false }: TakeQuizProps) {
    const MAX_ATTEMPTS = 3;
    const isLimitReached = (attempts_count >= MAX_ATTEMPTS) && (!previousAttempt?.is_passed);
    
    const { post, processing } = useForm();

    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [isTimeCritical, setIsTimeCritical] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>(() => {
        const saved = localStorage.getItem(`quiz_${quiz.id}_answers`);
        return saved ? JSON.parse(saved) : {};
    });
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const totalQuestions = quiz.questions?.length || 0;
    const answeredCount = Object.keys(selectedAnswers).length;
    const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    
    const selectedAnswersRef = useRef(selectedAnswers);
    useEffect(() => {
        selectedAnswersRef.current = selectedAnswers;
    }, [selectedAnswers]);

    // Fungsi pembantu untuk memformat struktur jawaban yang akan dikirim ke backend
    const getFormattedAnswers = (answersObj: Record<number, number>) => {
        return Object.entries(answersObj).map(([question_id, answer_id]) => ({
            question_id: parseInt(question_id, 10),
            answer_id,
        }));
    };

    
const [isTimeUp, setIsTimeUp] = useState(false);

// 1. Inisialisasi timer berdasarkan Target End Time
useEffect(() => {

    if (isLimitReached || isTimeUp) return;
    
    const isTimedQuiz = quiz.is_timed === true || quiz.is_timed === 1 || quiz.is_timed === '1';
    const limitSeconds = Number(quiz.time_limit_second);

    if (isTimedQuiz && limitSeconds > 0) {
        const storageKey = `quiz_${quiz.id}_end_time`;
        let endTime = localStorage.getItem(storageKey);

        if (!endTime) {
            endTime = (Date.now() + limitSeconds * 1000).toString();
            localStorage.setItem(storageKey, endTime);
        }

        const remaining = Math.max(0, Math.ceil((parseInt(endTime, 10) - Date.now()) / 1000));
        
        if (remaining <= 0) {
    
            setTimeRemaining(0);
            setIsTimeUp(true);
        } else {
            setTimeRemaining(remaining);
        }
    }
}, [quiz, isLimitReached, isTimeUp]);

// 2. Countdown timer & Auto submit
useEffect(() => {
    if (timeRemaining === null) return;
    
    if (timeRemaining <= 0) {
    
        setIsTimeUp(true);

        localStorage.removeItem(`quiz_${quiz.id}_answers`);
        localStorage.removeItem(`quiz_${quiz.id}_end_time`);
        
        const payloadAnswers = getFormattedAnswers(selectedAnswersRef.current);
        setSelectedAnswers({});

        console.log("Waktu habis! Mengumpulkan otomatis...", payloadAnswers);

        router.post(`/quiz/${quiz.id}/submit`, { 
            answers: payloadAnswers 
        }, {
            preserveState: false,
            preserveScroll: false,
            onError: (errors) => {
                console.error("Auto-submit error:", errors);
            }
        });
        return;
    }

    if (timeRemaining <= 300) {
        setIsTimeUp(false); 
        setIsTimeCritical(true);
    } else {
        setIsTimeCritical(false);
    }

    const timer = setInterval(() => {
        setTimeRemaining((prev) => {
            if (prev === null || prev <= 1) {
                clearInterval(timer);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);

    return () => clearInterval(timer);
}, [timeRemaining, quiz.id]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId: number, answerId: number) => {
        setSelectedAnswers((prev) => {
            const updated = { ...prev, [questionId]: answerId };
            localStorage.setItem(`quiz_${quiz.id}_answers`, JSON.stringify(updated));
            return updated;
        });
    };

    const scrollToQuestion = (index: number) => {
        setCurrentQuestion(index);
        questionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleSubmitClick = (e: FormEvent) => {
        e.preventDefault();
        if (Object.keys(selectedAnswers).length < totalQuestions) {
            const unansweredIndex = quiz.questions?.findIndex(q => !selectedAnswers[q.id]) ?? -1;
            if (unansweredIndex >= 0) scrollToQuestion(unansweredIndex);
            return;
        }
        setShowConfirmDialog(true);
    };

    const confirmSubmit = () => {
        const formattedAnswers = getFormattedAnswers(selectedAnswers);
        const payload = {
            answers: formattedAnswers
        };

        console.log("Payload dikirim:", payload);

        localStorage.removeItem(`quiz_${quiz.id}_answers`);
        localStorage.removeItem(`quiz_${quiz.id}_end_time`);

        router.post(`/quiz/${quiz.id}/submit`, payload, {
            preserveState: false,  
            preserveScroll: false,
            onStart: () => {
                setShowConfirmDialog(false);
            },
            onSuccess: (page) => {
                console.log("Submit Berhasil, Mengalihkan...", page);
            },
            onError: (errors) => {
                console.error("Error Validasi Server:", errors);
                alert("Gagal mengumpulkan! Error: " + JSON.stringify(errors));
            },
            onFinish: () => {
                setSelectedAnswers({});
            }
        });
    };

    const breadcrumbs = [
        { title: 'Kursus', href: '/courses' },
        { title: course.title, href: `/courses/${course.id}` },
        { title: quiz.title, href: '#' },
    ];

    // — Already passed screen —
    if (has_passed) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`${quiz.title} - ${course.title}`} />
                <div className="container px-4 mx-auto py-10 max-w-2xl">
                    <Card className="border-green-500/40 bg-green-500/5">
                        <CardHeader>
                            <CardTitle className="text-green-600 flex items-center gap-2 text-xl">
                                <CheckCircle className="h-6 w-6" />
                                Quiz Selesai & Lulus
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-base text-muted-foreground">
                                Selamat! Anda telah berhasil menyelesaikan quiz ini dan memenuhi standar kelulusan.
                            </p>
                            <Button asChild className="bg-green-600 hover:bg-green-700">
                                <Link href={`/courses/${course.id}`}>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Kembali ke Materi
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    // — Limit reached screen —
    if (isLimitReached) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`${quiz.title} - ${course.title}`} />
                <div className="container px-4 mx-auto py-10 max-w-2xl">
                    <Card className="border-destructive/40 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="text-destructive flex items-center gap-2 text-xl">
                                <AlertCircle className="h-6 w-6" />
                                Batas Percobaan Tercapai
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-base text-muted-foreground">
                                Anda telah menggunakan <strong className="text-foreground">{attempts_count} dari {MAX_ATTEMPTS}</strong> kesempatan dan belum mencapai nilai kelulusan <strong className="text-foreground">({quiz.passing_score}%)</strong>.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Silakan pelajari kembali materi atau hubungi instruktur untuk mendapatkan izin mencoba lagi.
                            </p>
                            <Button asChild variant="outline">
                                <Link href={`/courses/${course.id}`}>
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Kembali ke Materi
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    // — Main quiz screen —
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${quiz.title} - ${course.title}`} />

            <div className="container px-4 mx-auto py-6 max-w-4xl">

                {/* ── Sticky header: title + timer + progress ── */}
                <div className="sticky top-0 z-20 -mx-4 px-4 pt-2 pb-3 bg-background/95 backdrop-blur border-b mb-6">
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="min-w-0">
                            <h1 className="font-bold text-lg leading-tight truncate">{quiz.title}</h1>
                            <p className="text-xs text-muted-foreground truncate">{course.title}</p>
                        </div>
                        {timeRemaining !== null && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shrink-0 font-mono font-semibold text-sm transition-colors ${
                                isTimeCritical
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 animate-pulse'
                                    : 'border-border bg-muted/50'
                            }`}>
                                <Clock className="h-4 w-4" />
                                {formatTime(timeRemaining)}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Progress value={progressPercent} className="flex-1 h-2" />
                        <span className="text-xs text-muted-foreground shrink-0">
                            {answeredCount}/{totalQuestions} dijawab
                        </span>
                    </div>
                </div>

                {/* ── Quiz meta chips ── */}
                <div className="flex flex-wrap gap-2 mb-6 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        Nilai lulus: {quiz.passing_score}%
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                        <CheckCircle className="h-3 w-3" />
                        {totalQuestions} soal
                    </span>
                    {quiz.is_timed && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Waktu: {Math.floor((Number(quiz.time_limit_second) || 0) / 60)} menit
                        </span>
                    )}
                    {quiz.xp_bonus ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                            <Award className="h-3 w-3" />
                            +{quiz.xp_bonus} XP
                        </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                        Percobaan: {attempts_count}/{MAX_ATTEMPTS}
                    </span>
                </div>

                {/* ── Previous attempt alert ── */}
                {previousAttempt && (
                    <Alert className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Percobaan sebelumnya: skor <strong>{previousAttempt.score}%</strong>.{' '}
                            {previousAttempt.is_passed ? 'Anda lulus!' : 'Pelajari kembali dan coba lagi.'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* ── Question navigator ── */}
                <div className="flex flex-wrap gap-1.5 mb-6 p-3 bg-muted/30 rounded-xl border">
                    {quiz.questions?.map((q, idx) => {
                        const answered = !!selectedAnswers[q.id];
                        const isCurrent = idx === currentQuestion;
                        return (
                            <button
                                key={q.id}
                                type="button"
                                onClick={() => scrollToQuestion(idx)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                    isCurrent ? 'ring-2 ring-primary ring-offset-1' : ''
                                } ${
                                    answered
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background border text-muted-foreground hover:border-primary hover:text-primary'
                                }`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>

                {/* ── Questions ── */}
                <form onSubmit={handleSubmitClick} className="space-y-5">
                    {quiz.questions?.map((question, qIndex) => {
                        const isAnswered = !!selectedAnswers[question.id];
                        return (
                            <div
                                key={question.id}
                                ref={(el) => { questionRefs.current[qIndex] = el; }}
                                onClick={() => setCurrentQuestion(qIndex)}
                            >
                                <Card className={`transition-all scroll-mt-32 ${
                                    isAnswered ? 'border-primary/30 shadow-sm' : ''
                                } ${currentQuestion === qIndex ? 'ring-1 ring-primary/30' : ''}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                    isAnswered ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                }`}>
                                                    {qIndex + 1}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {question.point} poin
                                                </span>
                                            </div>
                                            {isAnswered && (
                                                <span className="text-xs text-primary font-medium flex items-center gap-1">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Terjawab
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed
                                                [&_img]:rounded-lg [&_img]:my-2 [&_img]:max-w-full
                                                [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5
                                                [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5
                                                [&_strong]:font-semibold [&_em]:italic
                                                [&_pre]:bg-muted [&_pre]:rounded [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:text-sm
                                                [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-sm
                                                [&_blockquote]:border-l-4 [&_blockquote]:border-muted-foreground/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground"
                                            dangerouslySetInnerHTML={{ __html: question.question_text }}
                                        />
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-2.5">
                                            {question.answers?.map((answer, aIndex) => {
                                                const isSelected = selectedAnswers[question.id] === answer.id;
                                                return (
                                                    <button
                                                        key={answer.id}
                                                        type="button"
                                                        onClick={() => handleAnswerSelect(question.id, answer.id)}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm
                                                            ${isSelected
                                                                ? 'border-primary bg-primary/5 text-foreground font-medium shadow-sm'
                                                                : 'border-border hover:border-primary/60 hover:bg-muted/50'
                                                            }`}
                                                    >
                                                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {ANSWER_LABELS[aIndex]}
                                                        </span>
                                                        <span className="flex-1 leading-relaxed">{answer.answer_text}</span>
                                                        {isSelected && (
                                                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {qIndex < totalQuestions - 1 && isAnswered && (
                                            <button
                                                type="button"
                                                onClick={() => scrollToQuestion(qIndex + 1)}
                                                className="mt-3 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                                            >
                                                Soal berikutnya
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}

                    {/* ── Footer submit bar ── */}
                    <div className="sticky bottom-0 -mx-4 px-4 py-4 bg-background/95 backdrop-blur border-t mt-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-sm text-muted-foreground">
                                {answeredCount < totalQuestions
                                    ? <span className="text-amber-600 dark:text-amber-400 font-medium">{totalQuestions - answeredCount} soal belum dijawab</span>
                                    : <span className="text-green-600 dark:text-green-400 font-medium">Semua soal terjawab ✓</span>
                                }
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" size="sm" asChild>
                                    <Link href={`/courses/${course.id}`}>Batal</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={processing || answeredCount < totalQuestions}
                                    className="gap-1.5"
                                >
                                    {processing ? (
                                        <>
                                            <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                                            Mengumpulkan...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-3.5 w-3.5" />
                                            Kumpulkan Quiz
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* ── Confirmation dialog ── */}
                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Kumpulkan Quiz?</AlertDialogTitle>
                            <AlertDialogDescription asChild>
                                <div className="space-y-2 text-sm">
                                    <p>
                                        Anda telah menjawab <strong>{answeredCount}</strong> dari{' '}
                                        <strong>{totalQuestions}</strong> soal.
                                    </p>
                                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                                        ⚠️ Setelah dikumpulkan, jawaban tidak dapat diubah.
                                    </p>
                                    <p>Yakin ingin mengumpulkan sekarang?</p>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Kembali</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmSubmit} className="gap-1.5">
                                {processing ? (
                                    <>
                                        <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                                        Mengumpulkan...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-3.5 w-3.5" />
                                        Ya, Kumpulkan
                                    </>
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
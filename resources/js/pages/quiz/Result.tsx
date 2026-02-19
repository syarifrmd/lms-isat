import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
    CheckCircle, 
    XCircle, 
    Award, 
    RotateCcw,
    AlertCircle,
    ChevronLeft,
    Trophy,
} from 'lucide-react';
import { UserQuizAttempt, Quiz } from '@/types';

interface Course {
    id: number;
    title: string;
}

interface ResultProps {
    attempt: UserQuizAttempt;
    quiz: Quiz;
    course: Course;
}

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizResult({ attempt, quiz, course }: ResultProps) {
    const totalQuestions = quiz.questions?.length || 0;
    const correctAnswers = attempt.user_answers?.filter(ua => ua.is_correct).length || 0;
    const incorrectAnswers = totalQuestions - correctAnswers;
    const scorePercent = attempt.score ?? 0;
    const passed = attempt.is_passed;

    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Kursus', href: '/courses' },
                { title: course.title, href: `/courses/${course.id}` },
                { title: 'Hasil Quiz', href: '#' },
            ]}
        >
            <Head title={`Hasil Quiz - ${quiz.title}`} />

            <div className="container px-4 mx-auto py-8 max-w-3xl">

                {/* ── Result hero card ── */}
                <Card className={`mb-6 overflow-hidden border-2 ${passed ? 'border-green-500/40' : 'border-red-500/30'}`}>
                    <div className={`px-6 py-8 text-center ${passed ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                        <div className="mx-auto mb-4 w-fit">
                            {passed ? (
                                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center ring-4 ring-green-200 dark:ring-green-800">
                                    <Trophy className="h-10 w-10 text-green-600 dark:text-green-300" />
                                </div>
                            ) : (
                                <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center ring-4 ring-red-200 dark:ring-red-800">
                                    <XCircle className="h-10 w-10 text-red-600 dark:text-red-300" />
                                </div>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold mb-1">
                            {passed ? 'Selamat, Anda Lulus!' : 'Quiz Selesai'}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {passed
                                ? `Anda berhasil melewati batas nilai minimum dengan skor ${scorePercent}%.`
                                : `Skor Anda ${scorePercent}%. Nilai minimum kelulusan adalah ${quiz.passing_score}%.`
                            }
                        </p>

                        {/* Score progress bar */}
                        <div className="mt-6 max-w-xs mx-auto">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                                <span>0%</span>
                                <span className={`font-bold text-base ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {scorePercent}%
                                </span>
                                <span>100%</span>
                            </div>
                            <Progress
                                value={scorePercent}
                                className={`h-3 ${passed ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'}`}
                            />
                            {quiz.passing_score && (
                                <div className="relative mt-1">
                                    <div
                                        className="absolute top-0 w-px h-3 bg-muted-foreground/40"
                                        style={{ left: `${quiz.passing_score}%` }}
                                    />
                                    <p className="text-xs text-muted-foreground mt-3 text-center">
                                        Batas lulus: {quiz.passing_score}%
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats row */}
                    <CardContent className="p-0">
                        <div className="grid grid-cols-3 divide-x border-t">
                            <div className="text-center py-4">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{correctAnswers}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Benar</div>
                            </div>
                            <div className="text-center py-4">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{incorrectAnswers}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Salah</div>
                            </div>
                            <div className="text-center py-4">
                                <div className="text-2xl font-bold">{totalQuestions}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Total Soal</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* XP bonus */}
                {passed && quiz.xp_bonus ? (
                    <Alert className="mb-6 border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
                        <Award className="h-4 w-4" />
                        <AlertTitle>Bonus XP Diperoleh!</AlertTitle>
                        <AlertDescription>
                            Anda mendapatkan <strong>{quiz.xp_bonus} XP</strong> karena berhasil lulus quiz ini.
                        </AlertDescription>
                    </Alert>
                ) : null}

                {/* ── Detailed answer review ── */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-base">Pembahasan Jawaban</CardTitle>
                        <CardDescription>Tinjau jawaban Anda untuk setiap soal</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 px-4 sm:px-6">
                        {quiz.questions?.map((question, qIndex) => {
                            const userAnswer = attempt.user_answers?.find(ua => ua.question_id === question.id);
                            const isCorrect = userAnswer?.is_correct || false;

                            return (
                                <div key={question.id} className="border-b pb-8 last:border-0 last:pb-0">
                                    {/* Question header */}
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                                            isCorrect ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'
                                        }`}>
                                            {isCorrect
                                                ? <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                : <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-sm font-semibold">Soal {qIndex + 1}</span>
                                                <span className="text-xs text-muted-foreground">({question.point} poin)</span>
                                                <Badge
                                                    variant={isCorrect ? 'default' : 'destructive'}
                                                    className="text-xs ml-auto"
                                                >
                                                    {isCorrect ? 'Benar' : 'Salah'}
                                                </Badge>
                                            </div>
                                            {/* Question text — rendered as HTML */}
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed mb-4
                                                    [&_img]:rounded-lg [&_img]:my-2 [&_img]:max-w-full
                                                    [&_p]:my-1 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5
                                                    [&_pre]:bg-muted [&_pre]:rounded [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:text-sm
                                                    [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:text-sm"
                                                dangerouslySetInnerHTML={{ __html: question.question_text }}
                                            />

                                            {/* Answer choices */}
                                            <div className="space-y-2">
                                                {question.answers?.map((answer, aIndex) => {
                                                    const isSelected = answer.id === userAnswer?.answer_id;
                                                    const isCorrectAnswer = answer.is_correct;

                                                    let rowClass = 'border-border';
                                                    if (isSelected && isCorrectAnswer) rowClass = 'border-green-500 bg-green-50 dark:bg-green-950/40';
                                                    else if (isSelected && !isCorrectAnswer) rowClass = 'border-red-500 bg-red-50 dark:bg-red-950/40';
                                                    else if (!isSelected && isCorrectAnswer) rowClass = 'border-green-500 bg-green-50 dark:bg-green-950/40';

                                                    return (
                                                        <div
                                                            key={answer.id}
                                                            className={`flex items-center gap-3 p-3 border rounded-xl text-sm ${rowClass}`}
                                                        >
                                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                                isCorrectAnswer
                                                                    ? 'bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-400'
                                                                    : isSelected
                                                                    ? 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-400'
                                                                    : 'bg-muted text-muted-foreground'
                                                            }`}>
                                                                {ANSWER_LABELS[aIndex]}
                                                            </span>
                                                            <span className="flex-1">{answer.answer_text}</span>
                                                            {isSelected && (
                                                                <Badge variant={isCorrectAnswer ? 'default' : 'destructive'} className="text-xs shrink-0">
                                                                    Jawaban Anda
                                                                </Badge>
                                                            )}
                                                            {!isSelected && isCorrectAnswer && (
                                                                <Badge variant="outline" className="text-xs shrink-0 border-green-500 text-green-700 dark:text-green-400">
                                                                    Jawaban Benar
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Explanation */}
                                            {question.explanation && (
                                                <Alert className="mt-4 border-blue-500/30 bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200">
                                                    <AlertCircle className="h-4 w-4 text-blue-500!" />
                                                    <AlertTitle className="text-blue-700 dark:text-blue-300">Pembahasan</AlertTitle>
                                                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                                                        {question.explanation}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* ── Actions ── */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild variant="outline" className="gap-2">
                        <Link href={`/courses/${course.id}`}>
                            <ChevronLeft className="h-4 w-4" />
                            Kembali ke Kursus
                        </Link>
                    </Button>
                    {!passed && (
                        <Button asChild className="gap-2">
                            <Link href={`/quiz/${quiz.id}`}>
                                <RotateCcw className="h-4 w-4" />
                                Coba Lagi
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

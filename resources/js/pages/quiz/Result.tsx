import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    CheckCircle, 
    XCircle, 
    Award, 
    TrendingUp,
    AlertCircle,
    BookOpen
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

export default function QuizResult({ attempt, quiz, course }: ResultProps) {
    const totalQuestions = quiz.questions?.length || 0;
    const correctAnswers = attempt.user_answers?.filter(ua => ua.is_correct).length || 0;
    const incorrectAnswers = totalQuestions - correctAnswers;

    const answerLabels = ['A', 'B', 'C', 'D'];

    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Courses', href: '/courses' },
                { title: course.title, href: `/courses/${course.id}` },
                { title: 'Quiz Result', href: '#' }
            ]}
        >
            <Head title={`Quiz Result - ${quiz.title}`} />

            <div className="container px-4 mx-auto py-8 max-w-4xl">
                {/* Result Summary */}
                <Card className="mb-6">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4">
                            {attempt.is_passed ? (
                                <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-300" />
                                </div>
                            ) : (
                                <div className="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                    <XCircle className="h-12 w-12 text-red-600 dark:text-red-300" />
                                </div>
                            )}
                        </div>
                        <CardTitle className="text-3xl mb-2">
                            {attempt.is_passed ? 'Congratulations!' : 'Quiz Completed'}
                        </CardTitle>
                        <CardDescription className="text-lg">
                            {attempt.is_passed 
                                ? `You passed the quiz with a score of ${attempt.score}%!` 
                                : `You scored ${attempt.score}%. The passing score is ${quiz.passing_score}%.`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-3xl font-bold text-primary">{attempt.score}%</div>
                                <div className="text-sm text-muted-foreground mt-1">Score</div>
                            </div>
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-3xl font-bold text-green-600">{correctAnswers}</div>
                                <div className="text-sm text-muted-foreground mt-1">Correct</div>
                            </div>
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-3xl font-bold text-red-600">{incorrectAnswers}</div>
                                <div className="text-sm text-muted-foreground mt-1">Incorrect</div>
                            </div>
                            <div className="text-center p-4 border rounded-lg">
                                <div className="text-3xl font-bold">{totalQuestions}</div>
                                <div className="text-sm text-muted-foreground mt-1">Total</div>
                            </div>
                        </div>

                        {attempt.is_passed && quiz.xp_bonus && (
                            <Alert className="mt-6">
                                <Award className="h-4 w-4" />
                                <AlertTitle>XP Bonus Earned!</AlertTitle>
                                <AlertDescription>
                                    You earned {quiz.xp_bonus} XP for passing this quiz!
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Detailed Results */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Detailed Results</CardTitle>
                        <CardDescription>Review your answers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {quiz.questions?.map((question, qIndex) => {
                            const userAnswer = attempt.user_answers?.find(ua => ua.question_id === question.id);
                            const isCorrect = userAnswer?.is_correct || false;
                            const correctAnswer = question.answers?.find(a => a.is_correct);
                            const selectedAnswer = question.answers?.find(a => a.id === userAnswer?.answer_id);

                            return (
                                <div key={question.id} className="border-b pb-6 last:border-0">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center ${
                                            isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                                        }`}>
                                            {isCorrect ? (
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-300" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg mb-1">
                                                Question {qIndex + 1}
                                                <span className="text-sm font-normal text-muted-foreground ml-2">
                                                    ({question.point} {question.point === 1 ? 'point' : 'points'})
                                                </span>
                                            </h3>
                                            <p className="text-muted-foreground mb-4">{question.question_text}</p>

                                            <div className="space-y-2">
                                                {question.answers?.map((answer, aIndex) => {
                                                    const isSelected = answer.id === userAnswer?.answer_id;
                                                    const isCorrectAnswer = answer.is_correct;

                                                    return (
                                                        <div
                                                            key={answer.id}
                                                            className={`flex items-center gap-3 p-3 border rounded-lg ${
                                                                isSelected && isCorrectAnswer
                                                                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                                                    : isSelected && !isCorrectAnswer
                                                                    ? 'border-red-500 bg-red-50 dark:bg-red-950'
                                                                    : isCorrectAnswer
                                                                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <span className="font-semibold min-w-[24px]">
                                                                {answerLabels[aIndex]}
                                                            </span>
                                                            <span className="flex-1">{answer.answer_text}</span>
                                                            {isSelected && (
                                                                <Badge variant={isCorrectAnswer ? "default" : "destructive"}>
                                                                    Your Answer
                                                                </Badge>
                                                            )}
                                                            {!isSelected && isCorrectAnswer && (
                                                                <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-300">
                                                                    Correct Answer
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {question.explanation && (
                                                <Alert className="mt-4">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Explanation</AlertTitle>
                                                    <AlertDescription>{question.explanation}</AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-center gap-4">
                    <Button asChild variant="outline">
                        <Link href={`/courses/${course.id}`}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Back to Course
                        </Link>
                    </Button>
                    {!attempt.is_passed && (
                        <Button asChild>
                            <Link href={`/quiz/${quiz.id}`}>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Try Again
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

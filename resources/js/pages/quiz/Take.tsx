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

interface Course {
    id: number;
    title: string;
}

interface TakeQuizProps {
    quiz: Quiz;
    course: Course;
    previousAttempt?: UserQuizAttempt | null;
}

export default function TakeQuiz({ quiz, course, previousAttempt }: TakeQuizProps) {
    const { data, setData, post, processing, errors } = useForm({
        answers: [] as Array<{ question_id: number; answer_id: number }>,
    });

    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

    // Initialize timer if quiz is timed
    useEffect(() => {
        if (quiz.is_timed && quiz.time_limit_second) {
            setTimeRemaining(quiz.time_limit_second);
        }
    }, [quiz]);

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

    const handleSubmit = (e?: FormEvent) => {
        e?.preventDefault();

        // Convert selectedAnswers to array format
        const answersArray = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
            question_id: parseInt(questionId),
            answer_id: answerId,
        }));

        // Check if all questions are answered
        if (answersArray.length < (quiz.questions?.length || 0)) {
            alert('Please answer all questions before submitting.');
            return;
        }

        // Update form data and submit
        setData('answers', answersArray);
        post(`/quiz/${quiz.id}/submit`);
    };

    const answerLabels = ['A', 'B', 'C', 'D'];

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
                            You have previously attempted this quiz with a score of {previousAttempt.score}%. 
                            {previousAttempt.is_passed ? ' You passed!' : ' You can try again.'}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Questions */}
                <form onSubmit={handleSubmit} className="space-y-6">
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
                                                className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                            >
                                                <RadioGroupItem
                                                    value={answer.id.toString()}
                                                    id={`q${question.id}-a${answer.id}`}
                                                />
                                                <Label
                                                    htmlFor={`q${question.id}-a${answer.id}`}
                                                    className="flex items-center gap-3 cursor-pointer flex-1"
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
                                    Answered: {Object.keys(selectedAnswers).length} / {quiz.questions?.length || 0}
                                </p>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild>
                                        <Link href={`/courses/${course.id}`}>
                                            Cancel
                                        </Link>
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={processing || Object.keys(selectedAnswers).length < (quiz.questions?.length || 0)}
                                    >
                                        {processing ? 'Submitting...' : 'Submit Quiz'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}

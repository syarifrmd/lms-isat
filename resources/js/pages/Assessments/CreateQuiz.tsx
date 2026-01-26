import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import { FormEvent, useState } from 'react';
import InputError from '@/components/input-error';

interface Course {
    id: number;
    title: string;
}

interface Module {
    id: number;
    title: string;
    order_sequence: number;
}

interface Answer {
    answer_text: string;
    is_correct: boolean;
}

interface Question {
    question_text: string;
    explanation: string;
    point: number;
    answers: Answer[];
}

interface CreateQuizProps {
    course: Course;
    modules: Module[];
}

export default function CreateQuiz({ course, modules }: CreateQuizProps) {
    const { data, setData, post, processing, errors, transform } = useForm({
        title: '',
        module_id: 'none', // Use 'none' instead of empty string
        passing_score: 70,
        min_score: 0,
        is_timed: false,
        time_limit_second: 3600,
        xp_bonus: 0,
        questions: [
            {
                question_text: '',
                explanation: '',
                point: 10,
                answers: [
                    { answer_text: '', is_correct: false },
                    { answer_text: '', is_correct: false },
                    { answer_text: '', is_correct: false },
                    { answer_text: '', is_correct: false },
                ],
            },
        ] as Question[],
    });

    const addQuestion = () => {
        setData('questions', [
            ...data.questions,
            {
                question_text: '',
                explanation: '',
                point: 10,
                answers: [
                    { answer_text: '', is_correct: false },
                    { answer_text: '', is_correct: false },
                    { answer_text: '', is_correct: false },
                    { answer_text: '', is_correct: false },
                ],
            },
        ]);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = data.questions.filter((_, i) => i !== index);
        setData('questions', newQuestions);
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...data.questions];
        (newQuestions[index] as any)[field] = value;
        setData('questions', newQuestions);
    };

    const updateAnswer = (questionIndex: number, answerIndex: number, field: keyof Answer, value: any) => {
        const newQuestions = [...data.questions];
        (newQuestions[questionIndex].answers[answerIndex] as any)[field] = value;
        setData('questions', newQuestions);
    };

    const setCorrectAnswer = (questionIndex: number, answerIndex: number) => {
        const newQuestions = [...data.questions];
        newQuestions[questionIndex].answers = newQuestions[questionIndex].answers.map((answer, idx) => ({
            ...answer,
            is_correct: idx === answerIndex,
        }));
        setData('questions', newQuestions);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        // Convert 'none' to null for backend
        transform((data) => ({
            ...data,
            module_id: data.module_id === 'none' ? null : data.module_id,
        }));
        
        post(`/assessments/${course.id}/quizzes`);
    };

    const answerLabels = ['A', 'B', 'C', 'D'];

    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Assessments', href: '/assessments' },
                { title: course.title, href: `/assessments/${course.id}/quizzes` },
                { title: 'Create Quiz', href: '#' }
            ]}
        >
            <Head title="Create Quiz" />

            <div className="container px-4 mx-auto py-8 max-w-4xl">
                <div className="flex items-center gap-4 mb-8">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={`/assessments/${course.id}/quizzes`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create New Quiz</h1>
                        <p className="text-muted-foreground mt-1">for {course.title}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Quiz Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quiz Details</CardTitle>
                            <CardDescription>Basic information about the quiz</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Quiz Title *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g., Final Assessment"
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div>
                                <Label htmlFor="module_id">Link to Module (Optional)</Label>
                                <Select
                                    value={data.module_id}
                                    onValueChange={(value) => setData('module_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a module (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Module </SelectItem>
                                        {modules.map((module) => (
                                            <SelectItem key={module.id} value={module.id.toString()}>
                                                {module.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.module_id} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="passing_score">Passing Score (%) *</Label>
                                    <Input
                                        id="passing_score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={data.passing_score}
                                        onChange={(e) => setData('passing_score', parseInt(e.target.value))}
                                    />
                                    <InputError message={errors.passing_score} />
                                </div>

                                <div>
                                    <Label htmlFor="xp_bonus">XP Bonus</Label>
                                    <Input
                                        id="xp_bonus"
                                        type="number"
                                        min="0"
                                        value={data.xp_bonus}
                                        onChange={(e) => setData('xp_bonus', parseFloat(e.target.value))}
                                    />
                                    <InputError message={errors.xp_bonus} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label htmlFor="is_timed">Timed Quiz</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable time limit for this quiz
                                    </p>
                                </div>
                                <Switch
                                    id="is_timed"
                                    checked={data.is_timed}
                                    onCheckedChange={(checked) => setData('is_timed', checked)}
                                />
                            </div>

                            {data.is_timed && (
                                <div>
                                    <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                                    <Input
                                        id="time_limit"
                                        type="number"
                                        min="1"
                                        value={Math.floor(data.time_limit_second / 60)}
                                        onChange={(e) => setData('time_limit_second', parseInt(e.target.value) * 60)}
                                    />
                                    <InputError message={errors.time_limit_second} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Questions */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Questions</CardTitle>
                                    <CardDescription>Add multiple choice questions</CardDescription>
                                </div>
                                <Button type="button" onClick={addQuestion} size="sm">
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Add Question
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full">
                                {data.questions.map((question, qIndex) => (
                                    <AccordionItem key={qIndex} value={`question-${qIndex}`}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <span className="font-medium">
                                                    Question {qIndex + 1}
                                                    {question.question_text && `: ${question.question_text.substring(0, 50)}${question.question_text.length > 50 ? '...' : ''}`}
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-4 pt-4">
                                                <div>
                                                    <Label>Question Text *</Label>
                                                    <Textarea
                                                        value={question.question_text}
                                                        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                                                        placeholder="Enter the question"
                                                        rows={3}
                                                    />
                                                    <InputError message={errors[`questions.${qIndex}.question_text` as keyof typeof errors]} />
                                                </div>

                                                <div>
                                                    <Label>Point Value *</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.5"
                                                        value={question.point}
                                                        onChange={(e) => updateQuestion(qIndex, 'point', parseFloat(e.target.value))}
                                                    />
                                                    <InputError message={errors[`questions.${qIndex}.point` as keyof typeof errors]} />
                                                </div>

                                                <div>
                                                    <Label>Explanation (Optional)</Label>
                                                    <Textarea
                                                        value={question.explanation}
                                                        onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                        placeholder="Explain the correct answer (shown after submission)"
                                                        rows={2}
                                                    />
                                                </div>

                                                <div>
                                                    <Label className="mb-3 block">Answer Options *</Label>
                                                    <RadioGroup
                                                        value={question.answers.findIndex(a => a.is_correct).toString()}
                                                        onValueChange={(value) => setCorrectAnswer(qIndex, parseInt(value))}
                                                    >
                                                        <div className="space-y-3">
                                                            {question.answers.map((answer, aIndex) => (
                                                                <div key={aIndex} className="flex items-center gap-3 p-3 border rounded-lg">
                                                                    <RadioGroupItem value={aIndex.toString()} id={`q${qIndex}-a${aIndex}`} />
                                                                    <Label htmlFor={`q${qIndex}-a${aIndex}`} className="font-semibold min-w-[24px]">
                                                                        {answerLabels[aIndex]}
                                                                    </Label>
                                                                    <Input
                                                                        value={answer.answer_text}
                                                                        onChange={(e) => updateAnswer(qIndex, aIndex, 'answer_text', e.target.value)}
                                                                        placeholder={`Option ${answerLabels[aIndex]}`}
                                                                        className="flex-1"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </RadioGroup>
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        Select the radio button for the correct answer
                                                    </p>
                                                    <InputError message={errors[`questions.${qIndex}.answers` as keyof typeof errors]} />
                                                </div>

                                                {data.questions.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => removeQuestion(qIndex)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove Question
                                                    </Button>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>

                            {data.questions.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No questions yet. Click "Add Question" to start.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/assessments/${course.id}/quizzes`}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Quiz'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

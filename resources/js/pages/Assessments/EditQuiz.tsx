import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import QuizQuestionEditor from '@/components/quiz-question-editor';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    PlusCircle,
    Trash2,
    ArrowLeft,
    ClipboardList,
    BookOpen,
    Star,
    Clock,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    Circle,
    Lightbulb,
    Hash,
    Target,
    Zap,
    Globe,
    FileText,
    AlertTriangle,
    Save,
} from 'lucide-react';
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
    id?: number;
    answer_text: string;
    is_correct: boolean;
}

interface Question {
    id?: number;
    question_text: string;
    explanation: string;
    point: number;
    answers: Answer[];
}

interface Quiz {
    id: number;
    title: string;
    description?: string;
    module_id: number | null;
    passing_score: number;
    min_score: number;
    is_timed: boolean;
    time_limit_second: number;
    xp_bonus: number;
    status: 'draft' | 'published';
    questions: Question[];
}

interface EditQuizProps {
    quiz: Quiz;
    course: Course;
    modules: Module[];
}

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];
const ANSWER_COLORS = [
    'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
    'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',
    'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
    'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800',
];
const ANSWER_LABEL_COLORS = [
    'bg-blue-500 text-white',
    'bg-purple-500 text-white',
    'bg-amber-500 text-white',
    'bg-rose-500 text-white',
];

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function EditQuiz({ quiz, course, modules }: EditQuizProps) {
    const [title, setTitle] = useState(quiz.title);
    const [description, setDescription] = useState(quiz.description ?? '');
    const [moduleId, setModuleId] = useState(quiz.module_id ? quiz.module_id.toString() : 'none');
    const [passingScore, setPassingScore] = useState(quiz.passing_score);
    const [minScore] = useState(quiz.min_score);
    const [isTimed, setIsTimed] = useState(quiz.is_timed);
    const [timeLimitSecond, setTimeLimitSecond] = useState(quiz.time_limit_second ?? 1800);
    const [xpBonus, setXpBonus] = useState(quiz.xp_bonus);
    const [questions, setQuestions] = useState<Question[]>(
        quiz.questions.map((q) => ({
            id: q.id,
            question_text: q.question_text,
            explanation: q.explanation ?? '',
            point: q.point,
            answers: q.answers.map((a) => ({
                id: a.id,
                answer_text: a.answer_text,
                is_correct: a.is_correct,
            })),
        }))
    );

    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set([0]));
    const [activeStep, setActiveStep] = useState<1 | 2>(1);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const toggleQuestion = (index: number) => {
        setExpandedQuestions((prev) => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const addQuestion = () => {
        const newIndex = questions.length;
        setQuestions([
            ...questions,
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
        setExpandedQuestions((prev) => new Set([...prev, newIndex]));
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
        setExpandedQuestions((prev) => {
            const next = new Set<number>();
            prev.forEach((i) => {
                if (i < index) next.add(i);
                else if (i > index) next.add(i - 1);
            });
            return next;
        });
    };

    const updateQuestion = (index: number, field: keyof Question, value: string | number) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const updateAnswer = (qIdx: number, aIdx: number, field: keyof Answer, value: string | boolean) => {
        const updated = [...questions];
        const answers = [...updated[qIdx].answers];
        answers[aIdx] = { ...answers[aIdx], [field]: value };
        updated[qIdx] = { ...updated[qIdx], answers };
        setQuestions(updated);
    };

    const setCorrectAnswer = (qIdx: number, aIdx: number) => {
        const updated = [...questions];
        updated[qIdx].answers = updated[qIdx].answers.map((a, i) => ({
            ...a,
            is_correct: i === aIdx,
        }));
        setQuestions(updated);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const submitWithStatus = (chosenStatus: 'draft' | 'published') => {
        setShowConfirmModal(false);
        setProcessing(true);
        const payload = {
            title,
            description,
            module_id: moduleId === 'none' ? null : moduleId,
            passing_score: passingScore,
            min_score: minScore,
            is_timed: isTimed,
            time_limit_second: timeLimitSecond,
            xp_bonus: xpBonus,
            status: chosenStatus,
            questions: JSON.parse(JSON.stringify(questions)) as Record<string, unknown>[],
        };
        router.put(
            `/assessments/quiz/${quiz.id}`,
            payload as unknown as Record<string, string>,
            {
                onError: (errs) => {
                    setErrors(errs);
                    setProcessing(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const timeLimitMinutes = Math.floor(timeLimitSecond / 60);
    const totalPoints = questions.reduce((sum, q) => sum + q.point, 0);
    const isStep1Valid = title.trim().length > 0;
    const completedQuestions = questions.filter((q) => {
        const plain = stripHtml(q.question_text);
        const correctIdx = q.answers.findIndex((a) => a.is_correct);
        return plain.length > 0 && correctIdx !== -1 && q.answers[correctIdx]?.answer_text.trim().length > 0;
    }).length;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Assessments', href: '/assessments' },
                { title: course.title, href: `/assessments/${course.id}/quizzes` },
                { title: 'Edit Quiz', href: '#' },
            ]}
        >
            <Head title={`Edit Quiz — ${quiz.title}`} />

            <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
                <div className="container px-4 mx-auto py-6 max-w-3xl">

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <Button asChild variant="ghost" size="icon" className="rounded-full shrink-0">
                            <Link href={`/assessments/${course.id}/quizzes`}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold tracking-tight truncate">Edit Quiz</h1>
                            <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                {course.title}
                            </p>
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mb-6">
                        <button
                            type="button"
                            onClick={() => setActiveStep(1)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                activeStep === 1
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                        >
                            <ClipboardList className="h-3.5 w-3.5" />
                            Detail Quiz
                        </button>
                        <div className="h-px flex-1 bg-border" />
                        <button
                            type="button"
                            onClick={() => isStep1Valid && setActiveStep(2)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                activeStep === 2
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : isStep1Valid
                                        ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        : 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                            }`}
                        >
                            <Hash className="h-3.5 w-3.5" />
                            Pertanyaan
                            {questions.length > 0 && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">
                                    {questions.length}
                                </Badge>
                            )}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>

                        {/* ===== STEP 1: Quiz Details ===== */}
                        {activeStep === 1 && (
                            <div className="space-y-4">

                                {/* Title & Description */}
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="pt-5 space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="p-1.5 rounded-lg bg-primary/10">
                                                <ClipboardList className="h-4 w-4 text-primary" />
                                            </div>
                                            <h2 className="font-semibold text-base">Informasi Quiz</h2>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="title" className="text-sm font-medium">
                                                Judul Quiz <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="title"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Contoh: Ujian Akhir Bab 1"
                                                className="text-base"
                                            />
                                            <InputError message={errors.title} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="description" className="text-sm font-medium">
                                                Deskripsi <span className="text-muted-foreground text-xs">(opsional)</span>
                                            </Label>
                                            <Textarea
                                                id="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Jelaskan tujuan atau petunjuk umum quiz ini..."
                                                rows={3}
                                                className="resize-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="module_id" className="text-sm font-medium">
                                                Tautkan ke Modul <span className="text-muted-foreground text-xs">(opsional)</span>
                                            </Label>
                                            <Select value={moduleId} onValueChange={setModuleId}>
                                                <SelectTrigger id="module_id">
                                                    <SelectValue placeholder="Pilih modul (opsional)" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">
                                                        <span className="flex items-center gap-2">
                                                            <BookOpen className="h-3.5 w-3.5" />
                                                            Tidak terkait modul (Course-level)
                                                        </span>
                                                    </SelectItem>
                                                    {modules.map((module) => (
                                                        <SelectItem key={module.id} value={module.id.toString()}>
                                                            Modul {module.order_sequence}: {module.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.module_id} />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Scoring */}
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="pt-5 space-y-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                                <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <h2 className="font-semibold text-base">Penilaian</h2>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="passing_score" className="text-sm font-medium">
                                                    Nilai Kelulusan (%)
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="passing_score"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={passingScore}
                                                        onChange={(e) => setPassingScore(parseInt(e.target.value))}
                                                        className="pr-8"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                                                </div>
                                                <InputError message={errors.passing_score} />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label htmlFor="xp_bonus" className="text-sm font-medium">
                                                    Bonus XP
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="xp_bonus"
                                                        type="number"
                                                        min="0"
                                                        value={xpBonus}
                                                        onChange={(e) => setXpBonus(parseFloat(e.target.value))}
                                                        className="pr-8"
                                                    />
                                                    <Zap className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
                                                </div>
                                                <InputError message={errors.xp_bonus} />
                                            </div>
                                        </div>

                                        {/* Passing score visual */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>0%</span>
                                                <span className="font-medium text-foreground">Batas lulus: {passingScore}%</span>
                                                <span>100%</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-linear-to-r from-red-400 via-amber-400 to-green-500 rounded-full transition-all duration-300"
                                                    style={{ width: `${passingScore}%` }}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Timer */}
                                <Card className="border-0 shadow-sm">
                                    <CardContent className="pt-5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg transition-colors ${isTimed ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'}`}>
                                                    <Clock className={`h-4 w-4 transition-colors ${isTimed ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-base">Batas Waktu</p>
                                                    <p className="text-xs text-muted-foreground">Aktifkan jika quiz memiliki waktu pengerjaan</p>
                                                </div>
                                            </div>
                                            <Switch
                                                id="is_timed"
                                                checked={isTimed}
                                                onCheckedChange={setIsTimed}
                                            />
                                        </div>

                                        {isTimed && (
                                            <div className="space-y-3 pt-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">Durasi</span>
                                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                                                        {timeLimitMinutes} menit
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="180"
                                                    step="1"
                                                    value={timeLimitMinutes}
                                                    onChange={(e) => setTimeLimitSecond(parseInt(e.target.value) * 60)}
                                                    className="w-full h-2 rounded-full accent-blue-500 cursor-pointer"
                                                />
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>1 mnt</span>
                                                    <span>1 jam</span>
                                                    <span>3 jam</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {[15, 30, 45, 60, 90].map((min) => (
                                                        <button
                                                            key={min}
                                                            type="button"
                                                            onClick={() => setTimeLimitSecond(min * 60)}
                                                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                                                timeLimitMinutes === min
                                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                                    : 'border-border hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                                                            }`}
                                                        >
                                                            {min} mnt
                                                        </button>
                                                    ))}
                                                </div>
                                                <InputError message={errors.time_limit_second} />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Button
                                    type="button"
                                    className="w-full"
                                    disabled={!isStep1Valid}
                                    onClick={() => setActiveStep(2)}
                                >
                                    Lanjut ke Pertanyaan
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                </Button>
                            </div>
                        )}

                        {/* ===== STEP 2: Questions ===== */}
                        {activeStep === 2 && (
                            <div className="space-y-4">

                                {/* Summary bar */}
                                <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-2.5 text-sm">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <Hash className="h-3.5 w-3.5" />
                                            <span><strong className="text-foreground">{questions.length}</strong> soal</span>
                                        </span>
                                        <span className="flex items-center gap-1.5 text-muted-foreground">
                                            <Star className="h-3.5 w-3.5" />
                                            <span><strong className="text-foreground">{totalPoints}</strong> poin total</span>
                                        </span>
                                    </div>
                                    <Button type="button" onClick={addQuestion} size="sm" variant="default" className="h-8 text-xs gap-1.5">
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        Tambah Soal
                                    </Button>
                                </div>

                                {/* Question cards */}
                                {questions.map((question, qIndex) => {
                                    const isExpanded = expandedQuestions.has(qIndex);
                                    const plainText = stripHtml(question.question_text);
                                    const hasText = plainText.length > 0;
                                    const hasImage = question.question_text.includes('<img');
                                    const correctIdx = question.answers.findIndex((a) => a.is_correct);
                                    const isComplete =
                                        (hasText || hasImage) &&
                                        correctIdx !== -1 &&
                                        question.answers[correctIdx]?.answer_text.trim().length > 0;

                                    return (
                                        <Card
                                            key={qIndex}
                                            className={`border-0 shadow-sm overflow-hidden transition-all ${isExpanded ? 'ring-1 ring-primary/20' : ''}`}
                                        >
                                            {/* Question header */}
                                            <button
                                                type="button"
                                                onClick={() => toggleQuestion(qIndex)}
                                                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                        isComplete
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : qIndex + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-medium truncate ${!hasText && !hasImage ? 'text-muted-foreground italic' : ''}`}>
                                                            {hasText
                                                                ? plainText
                                                                : hasImage
                                                                    ? 'Soal dengan gambar'
                                                                    : `Soal ${qIndex + 1} — belum diisi`}
                                                        </p>
                                                        {!isExpanded && (
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {question.point} poin · {correctIdx !== -1 ? `Jawaban: ${ANSWER_LABELS[correctIdx]}` : 'Belum ada jawaban benar'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>

                                            {/* Question body */}
                                            {isExpanded && (
                                                <CardContent className="pt-0 px-4 pb-4 space-y-4 border-t border-border/50">

                                                    {/* Question text */}
                                                    <div className="pt-4 space-y-1.5">
                                                        <Label className="text-sm font-medium flex items-center justify-between">
                                                            <span>Pertanyaan <span className="text-destructive">*</span></span>
                                                            <span className="text-xs font-normal text-muted-foreground">Mendukung teks & gambar</span>
                                                        </Label>
                                                        <QuizQuestionEditor
                                                            value={question.question_text}
                                                            onChange={(val) => updateQuestion(qIndex, 'question_text', val)}
                                                            placeholder="Tulis pertanyaanmu di sini... (bisa sisipkan gambar)"
                                                        />
                                                        <InputError message={errors[`questions.${qIndex}.question_text`]} />
                                                    </div>

                                                    {/* Point */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 space-y-1.5">
                                                            <Label className="text-sm font-medium flex items-center gap-1.5">
                                                                <Star className="h-3.5 w-3.5 text-amber-500" />
                                                                Poin
                                                            </Label>
                                                            <input
                                                                type="range"
                                                                min="5"
                                                                max="50"
                                                                step="5"
                                                                value={question.point}
                                                                onChange={(e) => updateQuestion(qIndex, 'point', parseInt(e.target.value))}
                                                                className="w-full h-1.5 rounded-full accent-amber-500 cursor-pointer"
                                                            />
                                                        </div>
                                                        <div className="w-16 text-center">
                                                            <span className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                                                {question.point}
                                                            </span>
                                                            <p className="text-xs text-muted-foreground">poin</p>
                                                        </div>
                                                    </div>

                                                    {/* Answers */}
                                                    <div className="space-y-2">
                                                        <Label className="text-sm font-medium">
                                                            Pilihan Jawaban <span className="text-destructive">*</span>
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground -mt-1">
                                                            Klik centang untuk menandai jawaban yang benar
                                                        </p>
                                                        {question.answers.map((answer, aIndex) => {
                                                            const isCorrect = answer.is_correct;
                                                            return (
                                                                <div
                                                                    key={aIndex}
                                                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                                                                        isCorrect
                                                                            ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/30'
                                                                            : ANSWER_COLORS[aIndex]
                                                                    }`}
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setCorrectAnswer(qIndex, aIndex)}
                                                                        className="shrink-0 transition-transform hover:scale-110"
                                                                        title="Tandai sebagai jawaban benar"
                                                                    >
                                                                        {isCorrect ? (
                                                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                                        ) : (
                                                                            <Circle className="h-5 w-5 text-muted-foreground/40" />
                                                                        )}
                                                                    </button>
                                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${ANSWER_LABEL_COLORS[aIndex]}`}>
                                                                        {ANSWER_LABELS[aIndex]}
                                                                    </span>
                                                                    <Input
                                                                        value={answer.answer_text}
                                                                        onChange={(e) => updateAnswer(qIndex, aIndex, 'answer_text', e.target.value)}
                                                                        placeholder={`Pilihan ${ANSWER_LABELS[aIndex]}`}
                                                                        className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 text-sm"
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                        <InputError message={errors[`questions.${qIndex}.answers`]} />
                                                    </div>

                                                    {/* Explanation */}
                                                    <div className="space-y-1.5">
                                                        <Label className="text-sm font-medium flex items-center gap-1.5">
                                                            <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                                                            Penjelasan Jawaban
                                                            <span className="text-muted-foreground text-xs font-normal">(opsional · ditampilkan setelah submit)</span>
                                                        </Label>
                                                        <Textarea
                                                            value={question.explanation}
                                                            onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                                                            placeholder="Jelaskan mengapa jawaban tersebut benar..."
                                                            rows={2}
                                                            className="resize-none text-sm bg-yellow-50/50 dark:bg-yellow-950/10 border-yellow-200 dark:border-yellow-800/50"
                                                        />
                                                    </div>

                                                    {/* Remove */}
                                                    {questions.length > 1 && (
                                                        <div className="flex justify-end pt-1">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeQuestion(qIndex)}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs gap-1.5"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Hapus Soal
                                                            </Button>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            )}
                                        </Card>
                                    );
                                })}

                                {/* Add question */}
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="w-full border-2 border-dashed border-border rounded-xl py-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Tambah Soal Baru
                                </button>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveStep(1)}
                                        className="flex-1 sm:flex-none"
                                    >
                                        <ChevronUp className="h-4 w-4 mr-1.5" />
                                        Kembali
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                        className="hidden sm:flex"
                                    >
                                        <Link href={`/assessments/${course.id}/quizzes`}>
                                            Batal
                                        </Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 sm:flex-none sm:ml-auto gap-2"
                                    >
                                        {processing ? (
                                            <>
                                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Simpan Perubahan
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Confirm Modal */}
            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <DialogContent className="w-full max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Save className="h-5 w-5 text-primary" />
                            Simpan Perubahan
                        </DialogTitle>
                        <DialogDescription className="pt-1">
                            Quiz <strong>&ldquo;{title}&rdquo;</strong> akan diperbarui.
                            Pilih status untuk quiz ini.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Summary */}
                    <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm space-y-1.5 my-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total soal</span>
                            <span className="font-medium">{questions.length} soal</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Soal lengkap</span>
                            <span className={`font-medium ${
                                completedQuestions === questions.length
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-amber-600 dark:text-amber-400'
                            }`}>
                                {completedQuestions} / {questions.length}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total poin</span>
                            <span className="font-medium">{totalPoints} poin</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Nilai kelulusan</span>
                            <span className="font-medium">{passingScore}%</span>
                        </div>
                        {isTimed && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Batas waktu</span>
                                <span className="font-medium">{timeLimitMinutes} menit</span>
                            </div>
                        )}
                    </div>

                    {completedQuestions < questions.length && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                                {questions.length - completedQuestions} soal belum lengkap.
                                Quiz tetap bisa disimpan sebagai draft.
                            </span>
                        </div>
                    )}

                    <DialogFooter className="flex flex-col gap-2 pt-1 sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowConfirmModal(false)}
                            disabled={processing}
                            className="w-full sm:w-auto sm:mr-auto"
                        >
                            Kembali Edit
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => submitWithStatus('draft')}
                            disabled={processing}
                            className="w-full sm:w-auto gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            Simpan sebagai Draft
                        </Button>
                        <Button
                            type="button"
                            onClick={() => submitWithStatus('published')}
                            disabled={processing || completedQuestions < questions.length}
                            className="w-full sm:w-auto gap-2"
                        >
                            {processing ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Globe className="h-4 w-4" />
                                    Publish Sekarang
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

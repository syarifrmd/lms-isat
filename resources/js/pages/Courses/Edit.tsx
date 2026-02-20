import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    BookOpen,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Edit3,
    FileText,
    GripVertical,
    ImageIcon,
    Layers,
    PlusCircle,
    Save,
    Tag,

    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Module {
    id: number;
    title: string;
    video_url: string | null;
    doc_url: string | null;
    content_text: string | null;
    order_sequence: number;
}

interface Course {
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    status: 'draft' | 'published' | 'archived';
    cover_url: string | null;
    start_date: string | null;
    end_date: string | null;
    created_by: string;
    modules: Module[];
}

interface EditProps {
    course: Course;
}

const statusConfig = {
    draft: {
        label: 'Draft',
        className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/40',
    },
    published: {
        label: 'Published',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/40',
    },
    archived: {
        label: 'Archived',
        className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700/40',
    },
} as const;

function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    // Convert ISO / datetime string to datetime-local input format: YYYY-MM-DDTHH:mm
    return dateStr.slice(0, 16);
}

export default function EditCourse({ course }: EditProps) {
    // ── Course Info Form ─────────────────────────────────────────────────────
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        title: course.title,
        description: course.description ?? '',
        category: course.category ?? '',
        status: course.status,
        start_date: formatDate(course.start_date),
        end_date: formatDate(course.end_date),
        cover_image: null as File | null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(course.cover_url);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('cover_image', file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const submitCourseInfo = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/courses/${course.id}`, { forceFormData: true });
    };

    // ── Module Ordering ───────────────────────────────────────────────────────
    const [modules, setModules] = useState<Module[]>(
        [...course.modules].sort((a, b) => a.order_sequence - b.order_sequence),
    );
    const [reorderSaving, setReorderSaving] = useState(false);
    const [reorderSaved, setReorderSaved] = useState(false);
    const dragItem = useRef<number | null>(null);
    const dragOver = useRef<number | null>(null);

    // reset saved indicator
    useEffect(() => {
        if (reorderSaved) {
            const t = setTimeout(() => setReorderSaved(false), 3000);
            return () => clearTimeout(t);
        }
    }, [reorderSaved]);

    const handleDragStart = (index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (index: number) => {
        dragOver.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current === null || dragOver.current === null) return;
        if (dragItem.current === dragOver.current) return;

        const updated = [...modules];
        const dragged = updated.splice(dragItem.current, 1)[0];
        updated.splice(dragOver.current, 0, dragged);

        // Re-assign order_sequence
        const resequenced = updated.map((m, i) => ({ ...m, order_sequence: i + 1 }));
        setModules(resequenced);
        dragItem.current = null;
        dragOver.current = null;
    };

    const moveModule = (index: number, direction: 'up' | 'down') => {
        const updated = [...modules];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= updated.length) return;
        [updated[index], updated[target]] = [updated[target], updated[index]];
        const resequenced = updated.map((m, i) => ({ ...m, order_sequence: i + 1 }));
        setModules(resequenced);
    };

    const saveModuleOrder = () => {
        setReorderSaving(true);
        router.post(
            `/courses/${course.id}/reorder-modules`,
            { modules: modules.map((m) => ({ id: m.id, order_sequence: m.order_sequence })) },
            {
                onSuccess: () => {
                    setReorderSaved(true);
                },
                onFinish: () => setReorderSaving(false),
                preserveScroll: true,
            },
        );
    };

    const breadcrumbs = [
        { title: 'Courses', href: '/courses' },
        { title: course.title, href: `/courses/${course.id}` },
        { title: 'Edit', href: `/courses/${course.id}/edit` },
    ];

    const statusBadge = statusConfig[data.status];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${course.title}`} />

            <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
                {/* ── Page Header ── */}
                <div className="flex items-start gap-4">
                    <Link
                        href={`/courses/${course.id}`}
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800 dark:border-white/10 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">Edit Course</h1>
                            <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}
                            >
                                {statusBadge.label}
                            </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{course.title}</p>
                    </div>
                </div>

                {/* ── Course Info Form ── */}
                <form onSubmit={submitCourseInfo} encType="multipart/form-data">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Left – main fields */}
                        <div className="space-y-6 lg:col-span-2">
                            <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900">
                                <CardHeader className="border-b border-gray-100 dark:border-white/10 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Course Information</CardTitle>
                                            <CardDescription className="text-xs">Basic details about your course</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-5">
                                    {/* Title */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="title" className="flex items-center gap-1.5 text-sm font-medium">
                                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                                            Course Title
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="e.g. Advanced React Patterns"
                                            className="h-10"
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="description" className="flex items-center gap-1.5 text-sm font-medium">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                            placeholder="What will students learn in this course?"
                                            rows={4}
                                            className="resize-none"
                                        />
                                        <InputError message={errors.description} />
                                    </div>

                                    {/* Category + Status */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="category" className="flex items-center gap-1.5 text-sm font-medium">
                                                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                                Category
                                            </Label>
                                            <Input
                                                id="category"
                                                value={data.category}
                                                onChange={(e) => setData('category', e.target.value)}
                                                placeholder="e.g. Technology, Sales..."
                                                className="h-10"
                                            />
                                            <InputError message={errors.category} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="flex items-center gap-1.5 text-sm font-medium">
                                                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                                Status
                                                <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.status} onValueChange={(v) => setData('status', v as typeof data.status)}>
                                                <SelectTrigger className="h-10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="draft">Draft</SelectItem>
                                                    <SelectItem value="published">Published</SelectItem>
                                                    <SelectItem value="archived">Archived</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.status} />
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="space-y-1.5">
                                        <Label className="flex items-center gap-1.5 text-sm font-medium">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            Course Period
                                        </Label>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground">Start Date</span>
                                                <Input
                                                    type="datetime-local"
                                                    value={data.start_date}
                                                    onChange={(e) => setData('start_date', e.target.value)}
                                                    className="h-10"
                                                />
                                                <InputError message={errors.start_date} />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground">End Date</span>
                                                <Input
                                                    type="datetime-local"
                                                    value={data.end_date}
                                                    onChange={(e) => setData('end_date', e.target.value)}
                                                    className="h-10"
                                                />
                                                <InputError message={errors.end_date} />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Define the active period for this course.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right – cover image + actions */}
                        <div className="space-y-5">
                            {/* Cover Image */}
                            <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900">
                                <CardHeader className="border-b border-gray-100 dark:border-white/10 pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
                                            <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">Cover Image</CardTitle>
                                            <CardDescription className="text-xs">Max 2MB · JPG, PNG, WebP</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    {/* Preview */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="group relative mb-3 flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 transition-colors hover:border-purple-400 dark:border-white/10 dark:hover:border-purple-500"
                                    >
                                        {previewUrl ? (
                                            <>
                                                <img
                                                    src={previewUrl}
                                                    alt="Cover"
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800">
                                                        Change Image
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <ImageIcon className="h-8 w-8 opacity-40" />
                                                <span className="text-xs">Click to upload cover</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleCoverChange}
                                    />
                                    {previewUrl && previewUrl !== course.cover_url && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPreviewUrl(course.cover_url);
                                                setData('cover_image', null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs text-muted-foreground transition-colors hover:border-red-200 hover:text-red-500 dark:border-white/10"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                            Remove new image
                                        </button>
                                    )}
                                    <InputError message={errors.cover_image} />
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900">
                                <CardContent className="space-y-3 pt-5">
                                    <Button type="submit" disabled={processing} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                        <Save className="h-4 w-4" />
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild className="w-full gap-2">
                                        <Link href={`/courses/${course.id}`}>
                                            <ArrowLeft className="h-4 w-4" />
                                            Back to Course
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>

                {/* ── Module Manager ── */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Module Order</h2>
                                <p className="text-xs text-muted-foreground">{modules.length} module{modules.length !== 1 ? 's' : ''} — drag to reorder</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {reorderSaved && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Saved
                                </span>
                            )}
                            <Button
                                onClick={saveModuleOrder}
                                disabled={reorderSaving}
                                size="sm"
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Save className="h-3.5 w-3.5" />
                                {reorderSaving ? 'Saving...' : 'Save Order'}
                            </Button>
                            <Button size="sm" variant="outline" asChild className="gap-2">
                                <Link href={`/courses/${course.id}/modules/create`}>
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    Add Module
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900">
                        {modules.length === 0 ? (
                            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
                                    <AlertCircle className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="font-medium text-gray-600 dark:text-gray-400">No modules yet</p>
                                <p className="text-sm text-muted-foreground">Add your first module to get started.</p>
                                <Button size="sm" asChild className="mt-1 gap-2">
                                    <Link href={`/courses/${course.id}/modules/create`}>
                                        <PlusCircle className="h-3.5 w-3.5" />
                                        Add First Module
                                    </Link>
                                </Button>
                            </CardContent>
                        ) : (
                            <CardContent className="p-2">
                                <div className="space-y-1.5">
                                    {modules.map((mod, index) => (
                                        <ModuleRow
                                            key={mod.id}
                                            module={mod}
                                            index={index}
                                            total={modules.length}
                                            courseId={course.id}
                                            onDragStart={handleDragStart}
                                            onDragEnter={handleDragEnter}
                                            onDragEnd={handleDragEnd}
                                            onMove={moveModule}
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

// ── Module Row Component ─────────────────────────────────────────────────────
interface ModuleRowProps {
    module: Module;
    index: number;
    total: number;
    courseId: number;
    onDragStart: (i: number) => void;
    onDragEnter: (i: number) => void;
    onDragEnd: () => void;
    onMove: (i: number, dir: 'up' | 'down') => void;
}

function ModuleRow({ module, index, total, courseId, onDragStart, onDragEnter, onDragEnd, onMove }: ModuleRowProps) {
    const [isDragging, setIsDragging] = useState(false);

    const contentTypes: string[] = [];
    if (module.video_url) contentTypes.push('Video');
    if (module.content_text) contentTypes.push('Text');
    if (module.doc_url) contentTypes.push('Document');

    return (
        <div
            draggable
            onDragStart={() => { setIsDragging(true); onDragStart(index); }}
            onDragEnter={() => onDragEnter(index)}
            onDragEnd={() => { setIsDragging(false); onDragEnd(); }}
            onDragOver={(e) => e.preventDefault()}
            className={`group flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-all dark:bg-neutral-800/50 ${
                isDragging
                    ? 'scale-[1.01] border-blue-300 bg-blue-50/50 shadow-md dark:border-blue-700 dark:bg-blue-900/20'
                    : 'border-gray-100 hover:border-gray-200 hover:shadow-sm dark:border-white/8 dark:hover:border-white/15'
            }`}
        >
            {/* Drag handle */}
            <div className="shrink-0 cursor-grab text-gray-300 transition-colors group-hover:text-gray-400 active:cursor-grabbing dark:text-neutral-600 dark:group-hover:text-neutral-500">
                <GripVertical className="h-5 w-5" />
            </div>

            {/* Sequence badge */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                {module.order_sequence}
            </div>

            {/* Module info */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-200">{module.title}</p>
                {contentTypes.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                        {contentTypes.map((t) => (
                            <span
                                key={t}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-neutral-700 dark:text-gray-400"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex shrink-0 items-center gap-1">
                <button
                    type="button"
                    onClick={() => onMove(index, 'up')}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-30 dark:border-white/10 dark:hover:border-white/20 dark:hover:text-gray-300"
                    title="Move up"
                >
                    <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                    type="button"
                    onClick={() => onMove(index, 'down')}
                    disabled={index === total - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600 disabled:pointer-events-none disabled:opacity-30 dark:border-white/10 dark:hover:border-white/20 dark:hover:text-gray-300"
                    title="Move down"
                >
                    <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <Link
                    href={`/courses/${courseId}/modules/${module.id}/edit`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:hover:border-blue-700 dark:hover:text-blue-400"
                    title="Edit module"
                >
                    <Edit3 className="h-3.5 w-3.5" />
                </Link>
            </div>
        </div>
    );
}

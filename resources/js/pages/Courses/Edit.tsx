import InputError from '@/components/input-error';
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
} from '@/components/ui/alert-dialog';
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
    Trash2,
    X,
    ShieldAlert,
    Award,
    Timer
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
    course_type: 'mandatory' | 'non-mandatory'; // Sifat Kursus
    is_timer_active: boolean | number;
    duration_minutes: number | null;
    cover_url: string | null;
    start_date: string | null;
    end_date: string | null;
    created_by: string;
    target_division: string | null;
    modules: Module[];
}

interface EditProps {
    course: Course;
    categories: string[];
    divisions: string[]; // Diambil dari database (Master Divisi / Users)
    auth: {
        user: {
            id: number;
            name: string;
            role: 'ADMIN' | 'TRAINER' | 'USER';
            division: string | null;
        };
    };
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
    return dateStr.slice(0, 16);
}

export default function EditCourse({ course, categories, divisions, auth }: EditProps) {
    const isTrainer = auth.user.role?.toUpperCase() === 'TRAINER';

    // ── Course Info Form ─────────────────────────────────────────────────────
    const { data, setData, put, processing, errors } = useForm({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        status: course.status || 'draft',
        start_date: course.start_date || '',
        end_date: course.end_date || '',
        // Sinkronisasi pendeteksian is_mandatory dari tipe string database atau property bawaan
        is_mandatory: course.course_type === 'mandatory',
        is_timer_active: (course.course_type === 'mandatory' && (course.is_timer_active === true || course.is_timer_active === 1 || String(course.is_timer_active) === '1')),
        duration_minutes: course.duration_minutes || 5,
        cover_image: null as File | null,
        target_division: isTrainer ? (auth.user.division ?? '') : (course.target_division || 'all'),
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(course.cover_url);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sinkronisasi otomatis saat sifat kursus berubah (Reset timer jika dirubah ke Non-Mandatory)
    useEffect(() => {
        if (!data.is_mandatory) {
            setData(prev => ({
                ...prev,
                is_timer_active: false,
                duration_minutes: 5
            }));
        }
    }, [data.is_mandatory]);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('cover_image', file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const submitCourseInfo = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...data,
            target_division: data.target_division === 'all' ? null : data.target_division,
            // Menjaga format data course_type agar sesuai kebutuhan backend edit sebelumnya
            course_type: data.is_mandatory ? 'mandatory' : 'non-mandatory',
            is_timer_active: data.is_timer_active ? 1 : 0,
            duration_minutes: data.is_timer_active ? Number(data.duration_minutes) : null,
        };
        
        router.post(`/courses/${course.id}`, payload, {
            forceFormData: true,
        });
    };

    const [isCustomCategory, setIsCustomCategory] = useState(!categories?.includes(course.category || '') && !!course.category);

    const handleCategoryChange = (value: string) => {
        if (value === 'Lainnya') {
            setIsCustomCategory(true);
            setData('category', '');
        } else {
            setIsCustomCategory(false);
            setData('category', value);
        }
    };

    // ── Module Ordering ───────────────────────────────────────────────────────
    const [modules, setModules] = useState<Module[]>(
        [...course.modules].sort((a, b) => a.order_sequence - b.order_sequence),
    );
    const [reorderSaving, setReorderSaving] = useState(false);
    const [reorderSaved, setReorderSaved] = useState(false);
    const dragItem = useRef<number | null>(null);
    const dragOver = useRef<number | null>(null);

    useEffect(() => {
        setModules([...course.modules].sort((a, b) => a.order_sequence - b.order_sequence));
    }, [course.modules]);

    useEffect(() => {
        if (reorderSaved) {
            const t = setTimeout(() => setReorderSaved(false), 3000);
            return () => clearTimeout(t);
        }
    }, [reorderSaved]);

    const handleDeleteModule = (moduleId: number) => {
        router.delete(`/courses/${course.id}/modules/${moduleId}`, {
            preserveScroll: true,
        });
    };

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${course.title}`} />

            <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <Link
                        href={`/courses/${course.id}`}
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800 dark:border-white/10 dark:bg-neutral-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white">Edit Course</h1>
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig[data.status].className}`}>
                                {statusConfig[data.status].label}
                            </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{course.title}</p>
                    </div>
                </div>

                {/* Main Form */}
                <form onSubmit={submitCourseInfo} encType="multipart/form-data">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
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
                                    
                                    {/* Grid Target Divisi & Sifat Kursus */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Target Divisi Dinamis */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="target_division" className="flex items-center gap-1.5 text-sm font-medium">
                                                <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                                                Target Divisi <span className="text-red-500">*</span>
                                            </Label>
                                            {isTrainer ? (
                                                <div className="flex items-center h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 dark:bg-neutral-800 dark:text-gray-400 text-sm font-medium select-none cursor-not-allowed">
                                                    <span>Divisi {auth.user.division ?? 'Belum Ditentukan'}</span>
                                                </div>
                                            ) : (
                                                <Select
                                                    value={data.target_division ?? 'all'}
                                                    onValueChange={(v) => setData('target_division', v)}
                                                >
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder="Pilih Target Divisi" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Semua Divisi (Akses Global Admin)</SelectItem>
                                                        {divisions && divisions.map((div) => (
                                                            <SelectItem key={div} value={div}>
                                                                {div}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            <InputError message={errors.target_division} />
                                        </div>

                                        {/* Sifat Kursus */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="is_mandatory" className="flex items-center gap-1.5 text-sm font-medium">
                                                <Award className="h-3.5 w-3.5 text-muted-foreground" />
                                                Sifat Kursus <span className="text-red-500">*</span>
                                            </Label>
                                            <Select
                                                value={data.is_mandatory ? 'mandatory' : 'non-mandatory'}
                                                onValueChange={(v) => setData('is_mandatory', v === 'mandatory')}
                                            >
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder="Pilih Sifat Kursus" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="non-mandatory">Non-Mandatory (Opsional)</SelectItem>
                                                    <SelectItem value="mandatory">Mandatory (Wajib)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.is_mandatory} />
                                        </div>
                                    </div>

                                    {/* Batasan Waktu Pengerjaan Kuis (Timer) - Hanya muncul jika is_mandatory bernilai TRUE */}
                                    {data.is_mandatory && (
                                        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/5 dark:bg-neutral-800/30 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20 mt-0.5">
                                                        <Timer className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="is_timer_active" className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            Aktifkan Batasan Waktu (Timer modul course)
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            Jika aktif, pengerjaan materi ini akan dibatasi oleh durasi mundur.
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="is_timer_active"
                                                        checked={data.is_timer_active}
                                                        onChange={(e) => setData('is_timer_active', e.target.checked)}
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-white/10 dark:bg-neutral-900"
                                                    />
                                                </div>
                                            </div>

                                            {data.is_timer_active && (
                                                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 pt-2 border-t border-gray-200/50 dark:border-white/5 animate-in fade-in duration-200">
                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="duration_minutes" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            Durasi Pengerjaan (Menit) <span className="text-red-500">*</span>
                                                        </Label>
                                                        <div className="relative flex items-center">
                                                            <Input
                                                                type="number"
                                                                id="duration_minutes"
                                                                min="1"
                                                                value={data.duration_minutes}
                                                                onChange={(e) => setData('duration_minutes', parseInt(e.target.value) || 0)}
                                                                placeholder="Contoh: 15"
                                                                className="h-10 pr-16"
                                                                required={data.is_timer_active}
                                                            />
                                                            <span className="absolute right-3 text-xs font-medium text-muted-foreground select-none">
                                                                Menit
                                                            </span>
                                                        </div>
                                                        <InputError message={errors.duration_minutes} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Course Title */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="title" className="flex items-center gap-1.5 text-sm font-medium">
                                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                                            Judul Kursus <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="Contoh: Sales Mastery"
                                            className="h-10"
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="description" className="flex items-center gap-1.5 text-sm font-medium">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                            Deskripsi
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Apa saja yang akan dipelajari dalam kursus ini?"
                                            rows={4}
                                        />
                                        <InputError message={errors.description} />
                                    </div>

                                    {/* Category & Status */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="category" className="flex items-center gap-1.5 text-sm font-medium">
                                                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                                                Kategori
                                            </Label>
                                            <Select value={isCustomCategory ? 'Lainnya' : (data.category || '')} onValueChange={handleCategoryChange}>
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder="Pilih kategori" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories && categories.map(cat => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                    <SelectItem value="Lainnya">Lainnya...</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {isCustomCategory && (
                                                <Input
                                                    type="text"
                                                    placeholder="Masukkan kategori baru"
                                                    value={data.category}
                                                    onChange={(e) => setData('category', e.target.value)}
                                                    className="mt-2 h-10"
                                                    required
                                                />
                                            )}
                                            <InputError message={errors.category} />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="flex items-center gap-1.5 text-sm font-medium">
                                                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                                Status <span className="text-red-500">*</span>
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

                                    {/* Course Period */}
                                    <div className="space-y-1.5">
                                        <Label className="flex items-center gap-1.5 text-sm font-medium">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            Waktu Kursus
                                        </Label>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground">Waktu Mulai</span>
                                                <Input
                                                    type="datetime-local"
                                                    value={data.start_date}
                                                    onChange={(e) => setData('start_date', e.target.value)}
                                                    className="h-10"
                                                />
                                                <InputError message={errors.start_date} />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground">Waktu Deadline</span>
                                                <Input
                                                    type="datetime-local"
                                                    value={data.end_date}
                                                    onChange={(e) => setData('end_date', e.target.value)}
                                                    className="h-10"
                                                />
                                                <InputError message={errors.end_date} />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right – Cover Image & Actions */}
                        <div className="space-y-5">
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
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="group relative mb-3 flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 transition-colors hover:border-purple-400 dark:border-white/10"
                                    >
                                        {previewUrl ? (
                                            <>
                                                <img src={previewUrl} alt="Cover" className="h-full w-full object-cover" />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <span className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-800">Change Image</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <ImageIcon className="h-8 w-8 opacity-40" />
                                                <span className="text-xs">Click to upload cover</span>
                                            </div>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                                    {previewUrl && previewUrl !== course.cover_url && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPreviewUrl(course.cover_url);
                                                setData('cover_image', null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs text-muted-foreground hover:text-red-500 dark:border-white/10"
                                        >
                                            <X className="h-3.5 w-3.5" /> Remove new image
                                        </button>
                                    )}
                                    <InputError message={errors.cover_image} />
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900">
                                <CardContent className="space-y-3 pt-5">
                                    <Button type="submit" disabled={processing} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                        <Save className="h-4 w-4" /> {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild className="w-full gap-2">
                                        <Link href={`/courses/${course.id}`}>
                                            <ArrowLeft className="h-4 w-4" /> Back to Course
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>

                {/* Module Manager */}
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
                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                                </span>
                            )}
                            <Button onClick={saveModuleOrder} disabled={reorderSaving} size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Save className="h-3.5 w-3.5" /> {reorderSaving ? 'Saving...' : 'Save Order'}
                            </Button>
                            <Button size="sm" variant="outline" asChild className="gap-2">
                                <Link href={`/courses/${course.id}/modules/create`}>
                                    <PlusCircle className="h-3.5 w-3.5" /> Add Module
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900">
                        {modules.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                                <AlertCircle className="h-6 w-6 text-gray-400" />
                                <p className="font-medium text-gray-600">No modules yet</p>
                            </div>
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
                                            onDelete={handleDeleteModule}
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

interface ModuleRowProps {
    module: Module;
    index: number;
    total: number;
    courseId: number;
    onDragStart: (i: number) => void;
    onDragEnter: (i: number) => void;
    onDragEnd: () => void;
    onMove: (i: number, dir: 'up' | 'down') => void;
    onDelete: (id: number) => void;
}

function ModuleRow({
    module,
    index,
    total,
    courseId,
    onDragStart,
    onDragEnter,
    onDragEnd,
    onMove,
    onDelete,
}: ModuleRowProps) {
    return (
        <div
            draggable
            onDragStart={() => onDragStart(index)}
            onDragEnter={() => onDragEnter(index)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className="group flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm transition-all hover:border-gray-300 dark:border-white/5 dark:bg-neutral-900 dark:hover:border-neutral-700"
        >
            <div className="cursor-grab text-gray-400 active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
            </div>

            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gray-50 text-xs font-semibold text-gray-500 dark:bg-neutral-800">
                {index + 1}
            </div>

            <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-medium text-gray-900 dark:text-white">{module.title}</h4>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === 0}
                    onClick={() => onMove(index, 'up')}
                    className="h-8 w-8 text-gray-500"
                >
                    <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={index === total - 1}
                    onClick={() => onMove(index, 'down')}
                    className="h-8 w-8 text-gray-500"
                >
                    <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-gray-500">
                    <Link href={`/courses/${courseId}/modules/${module.id}/edit`}>
                        <Edit3 className="h-4 w-4" />
                    </Link>
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Modul</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus modul ini? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => onDelete(module.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
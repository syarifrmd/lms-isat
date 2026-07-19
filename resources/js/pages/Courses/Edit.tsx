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
    Timer,
    Lock,
    Unlock,
    ArrowRight,
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
    course_type: 'mandatory' | 'non-mandatory';
    is_timer_active: boolean | number;
    duration_minutes: number | null;
    cover_url: string | null;
    start_date: string | null;
    end_date: string | null;
    created_by: string;
    target_division: string | string[] | null; // Mendukung string atau array dari backend
    position: number | Record<string, number | string> | null; // Mendukung tipe lama/baru
    prerequisite_course_id: string | number | Record<string, string | number | null> | null; // per divisi: 'auto' | 'none' | '<course_id>'
    modules: Module[];
}

interface EditProps {
    course: Course;
    categories: string[];
    journeys: { id: number; title: string }[];
    divisions: string[]; 
    mandatoryCourses: { id: number; title: string; position?: number; target_division?: string | string[] | null }[];
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

export default function EditCourse({ course, categories, journeys, divisions, mandatoryCourses, auth }: EditProps) {
    const isTrainer = auth.user.role?.toUpperCase() === 'TRAINER';

    // ── PARSING DATA AWAL DARI DATABASE AGAR COCOK DENGAN STRUKTUR MULTI-SELECT ──
    const initialDivisions = (() => {
        if (isTrainer) return auth.user.division ? [auth.user.division] : [];
        if (!course.target_division || course.target_division === 'all') return [];
        if (Array.isArray(course.target_division)) return course.target_division;
        // Jika dari database berupa string "HSO, DSE", kita pecah menjadi array
        if (typeof course.target_division === 'string') {
            return course.target_division.split(',').map(d => d.trim()).filter(Boolean);
        }
        return [];
    })();
const initialPositions = (() => {
    const posObj: Record<string, number | string> = {};
    
    // JIKA data course memiliki relasi divisions dari table pivot
    if (course.divisions && Array.isArray(course.divisions)) {
        course.divisions.forEach((div: any) => {
            // div.name adalah nama divisi (misal 'DSE')
            // div.pivot.position adalah nilai posisi dari table pivot
            posObj[div.name] = div.pivot?.position ?? 1;
        });
        return posObj;
    }

    // Fallback jika data masih berbentuk objek kosongan
    if (course.position && typeof course.position === 'object' && !Array.isArray(course.position)) {
        return course.position as Record<string, number | string>;
    }
    
    // Fallback default bawaan kode asli kamu jika berupa single value
    const defaultPos = parseInt(String(course.position || 1), 10) || 1;
    if (initialDivisions.length === 0) {
        posObj['Semua Divisi'] = defaultPos;
    } else {
        initialDivisions.forEach(div => {
            posObj[div] = defaultPos;
        });
    }
    return posObj;
})();

// ── PARSING GEMBOK (PRASYARAT) PER DIVISI ──
// Backend sekarang mengirim prerequisite_course_id sebagai objek {divisi: courseId|'none'}
const initialPrerequisite = (() => {
    const map: Record<string, string> = {};
    const raw = course.prerequisite_course_id;

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        Object.entries(raw).forEach(([div, val]) => {
            map[div] = val && val !== 'none' ? String(val) : 'none';
        });
        return map;
    }

    // Fallback data lama (single value untuk semua divisi)
    const fallback = raw ? String(raw) : 'auto';
    const divs = initialDivisions.length === 0 ? ['Semua Divisi'] : initialDivisions;
    divs.forEach(div => { map[div] = fallback; });
    return map;
})();

    // ── FORM STATE ──
    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        title: course.title || '',
        description: course.description || '',
        journey_id: course.journey_id || '',
        category: course.category || '',
        status: course.status || 'draft',
        start_date: course.start_date || '',
        end_date: course.end_date || '',
        is_mandatory: course.is_mandatory === true || course.is_mandatory === 1 || String(course.is_mandatory) === '1',
        is_timer_active: (course.is_timer_active === true || course.is_timer_active === 1 || String(course.is_timer_active) === '1'),
        duration_minutes: course.duration_minutes || 5,
        cover_image: null as File | null,
        target_division: initialDivisions as string[],
        position: initialPositions as Record<string, number | string>, 
        prerequisite_course_id: initialPrerequisite as Record<string, string>,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(course.cover_url);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sinkronisasi reset otomatis yang aman (Tanpa auto-suggest angka posisi yang merusak inputan)
    useEffect(() => {
        if (!data.is_mandatory) {
            if (Object.keys(data.position).length > 0 || Object.keys(data.prerequisite_course_id).length > 0) {
                setData(prev => ({
                    ...prev,
                    position: {},
                    prerequisite_course_id: {}
                }));
            }
        }
    }, [data.is_mandatory]);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('cover_image', file);
        if (file) {
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Fungsi handle klik multi-select target divisi
   const handleDivisionChange = (value: string) => {
    if (value === 'all') {
        setData(prev => {
            const isAllSelected = divisions && prev.target_division.length === divisions.length;
            const nextDivisions = isAllSelected ? [] : (divisions ? [...divisions] : []);

            const nextPositions = { ...prev.position };
            const nextPrerequisite = { ...prev.prerequisite_course_id };
            if (!isAllSelected && divisions) {
                divisions.forEach(div => {
                    if (!nextPositions[div]) {
                        nextPositions[div] = 1;
                    }
                    if (!nextPrerequisite[div]) {
                        nextPrerequisite[div] = 'auto';
                    }
                });
            } else if (isAllSelected) {
                divisions?.forEach(div => {
                    delete nextPositions[div];
                    delete nextPrerequisite[div];
                });
            }

            return {
                ...prev, 
                target_division: nextDivisions,
                position: nextPositions,
                prerequisite_course_id: nextPrerequisite,
            };
        });
    } else {
        setData(prev => {
            const currentDivisions = prev.target_division;
            const isSelected = currentDivisions.includes(value);
            const nextDivisions = isSelected
                ? currentDivisions.filter(d => d !== value)
                : [...currentDivisions, value];
            
            // Jaga agar objek posisi & gembok tidak hilang saat menambah divisi baru
            const nextPositions = { ...prev.position };
            const nextPrerequisite = { ...prev.prerequisite_course_id };
            if (isSelected) {
                // Hapus data posisi/gembok jika divisi tersebut di-uncheck oleh admin
                delete nextPositions[value];
                delete nextPrerequisite[value];
            } else {
                // Default posisi 1 & gembok otomatis untuk divisi baru yang dipilih
                if (!nextPositions[value]) {
                    nextPositions[value] = 1;
                }
                if (!nextPrerequisite[value]) {
                    nextPrerequisite[value] = 'auto';
                }
            }

            return {
                ...prev, 
                target_division: nextDivisions,
                position: nextPositions,
                prerequisite_course_id: nextPrerequisite,
            };
        });
    }
};

    const submitCourseInfo = (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            ...data,
            target_division: data.target_division.length === 0 ? null : data.target_division,
            course_type: data.is_mandatory ? 'mandatory' : 'non-mandatory',
            is_timer_active: data.is_timer_active ? 1 : 0,
            duration_minutes: data.is_timer_active ? Number(data.duration_minutes) : null,
            position: data.position, // Mengirim objek data posisi per divisi {[divisi]: angka}
            prerequisite_course_id: data.prerequisite_course_id, // Objek per divisi {[divisi]: 'auto'|'none'|'<course_id>'}
        };
        
        // Menggunakan router.post dengan spoofing _method: 'PUT' demi kelancaran upload File multipart
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

    // ── Module Ordering ──
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                        
                                        {/* Target Divisi */}
                                       <div className="space-y-1.5">
                                           <Label htmlFor="target_division" className="flex items-center gap-1.5 text-sm font-medium">
                                               <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                                               Target Divisi <span className="text-red-500">*</span>
                                           </Label>
                                           
                                           {!isTrainer ? (
                                               <Select
                                                   value={divisions && data.target_division.length === divisions.length ? "all" : (data.target_division[data.target_division.length - 1] || "")} 
                                                   onValueChange={handleDivisionChange}
                                               >
                                                   <SelectTrigger id="target_division" className="rounded-lg h-10 w-full overflow-hidden text-left">
                                                       <div className="truncate">
                                                           {divisions && data.target_division.length === divisions.length ? (
                                                               <span className="font-medium text-sky-600 dark:text-sky-400">✓ Semua Divisi Terpilih</span>
                                                           ) : data.target_division.length === 0 ? (
                                                               "Pilih Target Divisi..."
                                                           ) : (
                                                               `Terpilih (${data.target_division.length}): ${data.target_division.join(', ')}`
                                                           )}
                                                       </div>
                                                   </SelectTrigger>
                                                   <SelectContent>
                                                       {divisions && (
                                                           <SelectItem value="all">
                                                               {data.target_division.length === divisions.length ? "✓ Semua Divisi (Terpilih)" : "Pilih Semua Divisi"}
                                                           </SelectItem>
                                                       )}
                                                       {divisions && divisions.map((div) => {
                                                           const isSelected = data.target_division.includes(div);
                                                           return (
                                                               <SelectItem key={div} value={div}>
                                                                   {isSelected ? `✓ ${div}` : div}
                                                               </SelectItem>
                                                           );
                                                       })}
                                                   </SelectContent>
                                               </Select>
                                           ) : (
                                               <div className="flex items-center h-10 px-3 rounded-lg border border-gray-200 bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm font-medium select-none cursor-not-allowed">
                                                   <span>Divisi {auth.user.division ?? 'Belum Ditentukan'}</span>
                                               </div>
                                           )}
                                       
                                           <p className="text-[10px] text-gray-400">
                                               {isTrainer 
                                                   ? `Target otomatis dikunci berdasarkan divisi akun Trainer Anda (${auth.user.division}).` 
                                                   : 'Pilih "Pilih Semua Divisi" untuk mencakup semua divisi sekaligus, atau klik divisi satu per satu untuk memilih beberapa.'}
                                           </p>
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

                                    {/* Batasan Waktu Pengerjaan Kuis (Timer) - Berlaku untuk Mandatory maupun Non-Mandatory */}
                                    {(
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

                                    {/* INPUT POSISI DAN SYARAT GEMBOK KURSUS WAJIB - UPDATED (Dinamis Per Divisi & Anti-Bug Ketikan) */}
                                    {data.is_mandatory && (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 mt-4 space-y-4">
                                            <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                                                Pengaturan Kursus Wajib (Mandatory)
                                            </h4>
                                            <p className="text-[11px] text-gray-400 -mt-3">
                                                Kosongkan posisi untuk otomatis ditaruh di urutan paling akhir divisi tsb. Gembok bisa diatur bebas per divisi: otomatis (mengikuti course sebelumnya), tanpa gembok, atau kunci ke course tertentu — tidak harus berurutan.
                                            </p>

                                            {(() => {
                                                const targetDivs = data.target_division.length === 0 ? ['Semua Divisi'] : data.target_division;

                                                return targetDivs.map((divName) => {
                                                    const coursesInDivision = (mandatoryCourses || [])
                                                        .filter((c: any) => {
                                                            if (c.id === course.id) return false;
                                                            if (divName === 'Semua Divisi') return true;
                                                            if (Array.isArray(c.target_division)) return c.target_division.includes(divName);
                                                            return c.target_division === divName || !c.target_division || c.target_division === 'all';
                                                        })
                                                        .filter((c: any, idx: number, arr: any[]) => arr.findIndex(x => x.id === c.id) === idx)
                                                        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

                                                    // ── Bangun preview urutan real-time, termasuk course yang sedang diedit ──
                                                    const rawPos = data.position[divName];
                                                    const currentPosition = (rawPos !== undefined && rawPos !== '')
                                                        ? Number(rawPos)
                                                        : (coursesInDivision.length > 0 ? Math.max(...coursesInDivision.map((o: any) => o.position || 0)) + 1 : 1);
                                                    const currentPrereqRaw = data.prerequisite_course_id[divName] || 'auto';
                                                    const currentPrereqValue = currentPrereqRaw === 'none'
                                                        ? null
                                                        : (currentPrereqRaw === 'auto' ? 'AUTO' : Number(currentPrereqRaw));

                                                    const timeline = [
                                                        ...coursesInDivision.map((c: any) => ({
                                                            id: c.id,
                                                            title: c.title,
                                                            position: c.position || 1,
                                                            prerequisiteId: c.prerequisite_course_id ? Number(c.prerequisite_course_id) : null,
                                                            isCurrent: false,
                                                        })),
                                                        {
                                                            id: course.id,
                                                            title: course.title || 'Course ini',
                                                            position: currentPosition,
                                                            prerequisiteId: currentPrereqValue,
                                                            isCurrent: true,
                                                        },
                                                    ].sort((a, b) => (a.position || 0) - (b.position || 0));

                                                    return (
                                                        <div key={divName} className="flex flex-col gap-3 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 shadow-xs">
                                                            <span className="text-xs font-bold text-gray-400 uppercase block">Divisi: {divName}</span>

                                                            {/* ── Referensi urutan + relasi gembok (ditampilkan DI ATAS input, per divisi) ── */}
                                                            <div className="flex flex-wrap items-center gap-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                                                                {timeline.length === 0 ? (
                                                                    <span className="text-[11px] text-gray-400 italic">Belum ada course di divisi ini.</span>
                                                                ) : (
                                                                    timeline.map((item, idx) => {
                                                                        const locked = item.prerequisiteId !== null && item.prerequisiteId !== undefined;
                                                                        const prevItem = idx > 0 ? timeline[idx - 1] : null;
                                                                        const resolvedTargetId = item.prerequisiteId === 'AUTO' ? prevItem?.id : item.prerequisiteId;
                                                                        const isChainToPrevious = locked && prevItem && resolvedTargetId === prevItem.id;
                                                                        const connectorColor = !locked
                                                                            ? 'text-gray-300 dark:text-gray-700'
                                                                            : (isChainToPrevious ? 'text-gray-400 dark:text-gray-500' : 'text-amber-500');

                                                                        return (
                                                                            <div key={`${item.id}-${idx}`} className="flex items-center gap-1">
                                                                                {idx > 0 && <ArrowRight className={`h-3.5 w-3.5 shrink-0 ${connectorColor}`} />}
                                                                                <div
                                                                                    title={locked ? (isChainToPrevious ? 'Terkunci ke course sebelumnya' : 'Terkunci ke course lain (relasi custom)') : 'Tanpa gembok — selalu terbuka'}
                                                                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] ${
                                                                                        item.isCurrent ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''
                                                                                    } ${
                                                                                        locked
                                                                                            ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900 dark:text-red-300'
                                                                                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-300'
                                                                                    }`}
                                                                                >
                                                                                    <span className="font-bold text-[9px] px-1 py-0.5 rounded bg-white/70 dark:bg-black/20">#{item.position}</span>
                                                                                    {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                                                                    <span className="font-medium max-w-[130px] truncate">
                                                                                        {item.title}{item.isCurrent ? ' (Ini)' : ''}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 -mt-1">
                                                                <span className="flex items-center gap-1"><Unlock className="h-2.5 w-2.5 text-emerald-500" /> Hijau = tanpa gembok</span>
                                                                <span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5 text-red-500" /> Merah = terkunci</span>
                                                                <span className="flex items-center gap-1"><ArrowRight className="h-2.5 w-2.5 text-gray-400" /> Abu = rantai normal</span>
                                                                <span className="flex items-center gap-1"><ArrowRight className="h-2.5 w-2.5 text-amber-500" /> Kuning = relasi custom (lompat)</span>
                                                            </div>

                                                            {/* ── Input Posisi & Gembok ── */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                <div className="space-y-1">
                                                                    <span className="text-[11px] text-gray-500">Urutan Posisi</span>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        placeholder="Otomatis (di urutan akhir)"
                                                                        value={data.position[divName] !== undefined ? data.position[divName] : ''}
                                                                        onChange={e => {
                                                                            const val = e.target.value;
                                                                            setData('position', {
                                                                                ...data.position,
                                                                                [divName]: val === '' ? '' : parseInt(val, 10)
                                                                            });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <span className="text-[11px] text-gray-500">Gembok (Kursus Syarat)</span>
                                                                    <Select
                                                                        value={data.prerequisite_course_id[divName] || 'auto'}
                                                                        onValueChange={value => setData('prerequisite_course_id', {
                                                                            ...data.prerequisite_course_id,
                                                                            [divName]: value,
                                                                        })}
                                                                    >
                                                                        <SelectTrigger className="w-full">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="auto">Otomatis (ikuti urutan sebelumnya)</SelectItem>
                                                                            <SelectItem value="none">Tanpa Gembok (Selalu Terbuka)</SelectItem>
                                                                            {coursesInDivision.map((c: any) => (
                                                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                                                    #{c.position || 1} {c.title}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                            {errors.position && <InputError message={errors.position} />}
                                            {errors.prerequisite_course_id && <InputError message={errors.prerequisite_course_id} />}
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

                                    {/* Journey Selection */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="journey_id" className="text-sm font-medium">
                                            Pilih Journey (Wajib) <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={data.journey_id ? data.journey_id.toString() : ''} onValueChange={(value) => setData('journey_id', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Journey..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {journeys && journeys.map(journey => (
                                                    <SelectItem key={journey.id} value={journey.id.toString()}>{journey.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.journey_id} />
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
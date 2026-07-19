import InputError from '@/components/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { BookOpen, ArrowLeft, ShieldAlert, Award, Lock, Unlock, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CreateCourseProps {
    categories: string[];
    divisions: string[]; 
    journeys: { id: number; title: string }[];
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

export default function CreateCourse({ categories, divisions, mandatoryCourses, journeys, auth }: CreateCourseProps) {
    const isTrainer = auth.user.role?.toUpperCase() === 'TRAINER';

  const { data, setData, post, processing, errors } = useForm({
    title: '',
    description: '',
    journey_id: '',
    category: '',
    status: 'draft',
    start_date: '',
    end_date: '',
    cover_image: null as File | null,
    is_mandatory: false,
    target_division: isTrainer ? (auth.user.division ? [auth.user.division] : []) : [] as string[], 
    is_timer_active: true, 
    duration_minutes: 5,  
    position: {} as Record<string, number | string>,                    
    prerequisite_course_id: {} as Record<string, string>, // per divisi: 'auto' | 'none' | '<course_id>'
});

const [isCustomCategory, setIsCustomCategory] = useState(false);


useEffect(() => {
    // Logic Reset Position & Prerequisite jika non-mandatory (Timer tetap berlaku untuk semua sifat kursus)
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

    const handleDivisionChange = (value: string) => {
    if (value === 'all') {
        setData(prev => {
            const isAllSelected = divisions && prev.target_division.length === divisions.length;
            const nextDivisions = isAllSelected ? [] : (divisions ? [...divisions] : []);

            const nextPrerequisite = { ...prev.prerequisite_course_id };
            if (isAllSelected) {
                divisions?.forEach(div => { delete nextPrerequisite[div]; });
            } else {
                divisions?.forEach(div => {
                    if (!nextPrerequisite[div]) nextPrerequisite[div] = 'auto';
                });
            }

            return {
                ...prev,
                target_division: nextDivisions,
                position: {},
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
            
            // Menghapus key posisi/gembok divisi jika divisi tersebut di-uncheck
            const nextPosition = { ...prev.position };
            const nextPrerequisite = { ...prev.prerequisite_course_id };
            if (isSelected) {
                delete nextPosition[value];
                delete nextPrerequisite[value];
            } else if (!nextPrerequisite[value]) {
                nextPrerequisite[value] = 'auto';
            }
            
            return {
                ...prev,
                target_division: nextDivisions,
                position: nextPosition,
                prerequisite_course_id: nextPrerequisite,
            };
        });
    }
};
    const handleCategoryChange = (value: string) => {
        if (value === 'Lainnya') {
            setIsCustomCategory(true);
            setData('category', '');
        } else {
            setIsCustomCategory(false);
            setData('category', value);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        
        const payload = {
            ...data,
            target_division: data.target_division.length === 0 ? null : data.target_division,
        };

        post('/courses', { 
            data: payload as any,
            forceFormData: true 
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Kursus', href: '/courses' },
            { title: 'Buat Kursus', href: '/courses/create' },
        ]}>
            <Head title="Buat Kursus Baru" />

            <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-6">

                {/* Header */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Manajemen Kursus</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600">Buat Kursus Baru</p>
                        </div>
                    </div>
                    <Link
                        href="/courses"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Link>
                </div>

                {/* Form */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Detail Kursus</h2>
                    </div>

                    <form onSubmit={submit}>
                        <div className="p-5 space-y-5">

                            {/* Informasi Target Divisi & Sifat Kursus */}
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
                                        value={data.is_mandatory ? 'true' : 'false'} 
                                        onValueChange={(value) => setData('is_mandatory', value === 'true')}
                                    >
                                        <SelectTrigger id="is_mandatory" className="rounded-lg h-10">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="false">Non-Mandatory (Opsional)</SelectItem>
                                            <SelectItem value="true">Mandatory (Wajib)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-gray-400">
                                        Kursus bersifat wajib (Mandatory) akan muncul sebagai prioritas utama pada dashboard karyawan target.
                                    </p>
                                    <InputError message={errors.is_mandatory} />
                                </div>
                            </div>

                            {/* PENGATURAN TIMER DINAMIS (Berlaku untuk Mandatory maupun Non-Mandatory) */}
                            {(
                                <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-950/20 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Batasi Waktu Materi dan Kuis</Label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Aktifkan batas waktu baca materi sampai penyelesaian kuis.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer select-none">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={data.is_timer_active}
                                                onChange={(e) => setData('is_timer_active', e.target.checked)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                                        </label>
                                    </div>

                                    {data.is_timer_active && (
                                        <div className="flex items-end gap-3 border-t border-sky-100 dark:border-sky-900/40 pt-3">
                                            <div className="w-32 space-y-1.5">
                                                <Label htmlFor="duration_minutes" className="text-xs font-medium text-gray-500">Durasi Maksimal</Label>
                                                <Input 
                                                    id="duration_minutes"
                                                    type="number" 
                                                    min="1"
                                                    value={data.duration_minutes}
                                                    onChange={(e) => setData('duration_minutes', parseInt(e.target.value) || 0)}
                                                    className="h-9"
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 pb-1.5">Menit per materi modul</span>
                                        </div>
                                    )}
                                </div>
                            )}

                           {/* INPUT POSISI DAN SYARAT GEMBOK KURSUS WAJIB */}
{data.is_mandatory && (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 mt-4 space-y-4">
        <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
            Pengaturan Kursus Wajib (Mandatory)
        </h4>
        
        {/* Urutan Posisi & Gembok (Prasyarat) per Divisi — dinamis, tiap divisi bisa beda */}
        <p className="text-[11px] text-gray-400 -mt-1">
            Kosongkan posisi untuk otomatis ditaruh di urutan paling akhir divisi tsb. Gembok bisa diatur bebas per divisi: otomatis (mengikuti course sebelumnya), tanpa gembok, atau kunci ke course tertentu.
        </p>

        {(() => {
            const targetDivs = data.target_division.length === 0 ? ['Semua Divisi'] : data.target_division;

            return targetDivs.map((divName) => {
                const coursesInDivision = (mandatoryCourses || [])
                    .filter((c: any) => {
                        if (divName === 'Semua Divisi') return true;
                        if (Array.isArray(c.target_division)) return c.target_division.includes(divName);
                        return c.target_division === divName;
                    })
                    .filter((c: any, idx: number, arr: any[]) => arr.findIndex(x => x.id === c.id) === idx)
                    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

                // ── Preview urutan real-time, termasuk course baru yang sedang dibuat ──
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
                        id: -1,
                        title: data.title || 'Course baru ini',
                        position: currentPosition,
                        prerequisiteId: currentPrereqValue,
                        isCurrent: true,
                    },
                ].sort((a, b) => (a.position || 0) - (b.position || 0));

                return (
                    <div key={divName} className="flex flex-col gap-3 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-150 shadow-xs">
                        <span className="text-xs font-bold text-gray-400 uppercase block">Divisi: {divName}</span>

                        {/* ── Referensi urutan + relasi gembok (di atas input, per divisi) ── */}
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
                                                #{c.position} {c.title}
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

                            {/* Judul Kursus */}
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-sm font-medium">
                                    Judul Kursus <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Contoh: Sales Funnel Mastery"
                                    required
                                />
                                <InputError message={errors.title} />
                            </div>

                            {/* Deskripsi */}
                            <div className="space-y-1.5">
                                <Label htmlFor="description" className="text-sm font-medium">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Apa yang akan dipelajari peserta dalam kursus ini?"
                                    rows={4}
                                    className="resize-none"
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

                            {/* Waktu Kursus */}
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Waktu Kursus</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="start_date" className="text-xs text-gray-400">Waktu Mulai</Label>
                                        <Input
                                            id="start_date"
                                            type="datetime-local"
                                            value={data.start_date}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                        />
                                        <InputError message={errors.start_date} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="end_date" className="text-xs text-gray-400">Waktu Deadline</Label>
                                        <Input
                                            id="end_date"
                                            type="datetime-local"
                                            value={data.end_date}
                                            onChange={(e) => setData('end_date', e.target.value)}
                                        />
                                        <InputError message={errors.end_date} />
                                    </div>
                                </div>
                            </div>

                            {/* Kategori & Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="category" className="text-sm font-medium">Kategori</Label>
                                    <Select value={isCustomCategory ? 'Lainnya' : (data.category || '')} onValueChange={handleCategoryChange}>
                                        <SelectTrigger>
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
                                            className="mt-2"
                                            required
                                        />
                                    )}
                                    <InputError message={errors.category} />
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih status" />
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

                            {/* Gambar Cover */}
                            <div className="space-y-1.5">
                                <Label htmlFor="cover_image" className="text-sm font-medium">Gambar Cover</Label>
                                <Input
                                    id="cover_image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('cover_image', e.target.files ? e.target.files[0] : null)}
                                />
                                <InputError message={errors.cover_image} />
                            </div>

                        </div>

                        {/* Button Action */}
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm"
                            >
                                {processing ? 'Menyimpan...' : 'Buat Kursus'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </AppLayout>
    );
}
import InputError from '@/components/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { BookOpen, ArrowLeft, ShieldAlert, Award } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CreateCourseProps {
    categories: string[];
    divisions: string[]; 
    mandatoryCourses: { id: number; title: string }[];
    auth: {
        user: {
            id: number;
            name: string;
            role: 'ADMIN' | 'TRAINER' | 'USER';
            division: string | null;
        };
    };
}

export default function CreateCourse({ categories, divisions, mandatoryCourses, auth }: CreateCourseProps) {
    const isTrainer = auth.user.role?.toUpperCase() === 'TRAINER';

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        description: '',
        category: '',
        status: 'draft',
        start_date: '',
        end_date: '',
        cover_image: null as File | null,
        is_mandatory: false,
        target_division: isTrainer ? (auth.user.division ?? '') : 'all', 
        is_timer_active: true, // DEFAULT HIDUP: Ubah ke false jika defaultnya mati
        duration_minutes: 5,  // DEFAULT TIME: Ubah angka 5 ini jika ingin waktu dasar yang berbeda
        position: 1,                    
        prerequisite_course_id: '',     
    });

    const [isCustomCategory, setIsCustomCategory] = useState(false);

    // Sinkronisasi otomatis 
    useEffect(() => {
    // 1. Logic Reset Timer 
    if (!data.is_mandatory) {
        setData(prev => ({
            ...prev,
            is_timer_active: false,
            duration_minutes: 5,
            position: 1, 
            prerequisite_course_id: ''
        }));
    } 
    // 2. Logic Auto-Suggest 
    else {
        // Filter kursus mandatory
        const filtered = (mandatoryCourses || [])
            .filter((c: any) => {
                if (!data.target_division || data.target_division === 'all') {
                    return true;
                }
                return c.target_division === data.target_division;
            });
        
        // Cari angka posisi tertinggi
        if (filtered.length > 0) {
            const maxPosition = Math.max(...filtered.map((c: any) => c.position || 0));
            setData('position', maxPosition + 1);
        } else {
            // Jika divisi ini belum punya kursus mandatory sama sekali, otomatis mulai dari 1
            setData('position', 1);
        }
    }
}, [data.is_mandatory, data.target_division, mandatoryCourses]);

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
            target_division: data.target_division === 'all' ? null : data.target_division,
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
                                        value={data.target_division || "all"} 
                                        onValueChange={value => setData('target_division', value)}
                                    >

                                            <SelectTrigger id="target_division" className="rounded-lg h-10">
                                                <SelectValue placeholder="Pilih Target Divisi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Divisi</SelectItem>
                                                {divisions && divisions.map((div) => (
                                                    <SelectItem key={div} value={div}>
                                                        {div}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        // TAMPILAN TRAINER: Terkunci total, berupa boks teks statis yang tidak bisa di-klik
                                        <div className="flex items-center h-10 px-3 rounded-lg border border-gray-200 bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm font-medium select-none cursor-not-allowed">
                                            <span>Divisi {auth.user.division ?? 'Belum Ditentukan'}</span>
                                        </div>
                                    )}

                                    <p className="text-[10px] text-gray-400">
                                        {isTrainer 
                                            ? `Target otomatis dikunci berdasarkan divisi akun Trainer Anda (${auth.user.division}).` 
                                            : 'Akun Admin dapat menentukan target kursus ke divisi spesifik atau semua divisi.'}
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

                            {/* PENGATURAN TIMER DINAMIS (Hanya muncul jika Sifat Kursus = Mandatory) */}
                            {data.is_mandatory && (
                                <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-950/20 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Batasi Waktu Materi dan Kuis</Label>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Aktifkan batas waktu baca materi sampai penyelesaian kuis.</p>
                                        </div>
                                        {/* Custom Toggle Switch Menggunakan Standard Tailwind */}
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

                                    {/* Input Menit hanya muncul jika toggle di atas bernilai TRUE */}
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
        
        {/* Input Urutan Posisi Card */}
<div className="space-y-1">
    <Label htmlFor="position" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Urutan Posisi Tampilan Course
    </Label>
    <Input
        id="position"
        type="number"
        min="1"
       value={data.position === 0 ? '' : data.position} 
    onChange={e => {
        const val = e.target.value;
        setData('position', val === '' ? 0 : parseInt(val));
    }}
        placeholder="Contoh: 1 untuk pertama, 2 untuk kedua"
    />
    {errors.position && <InputError message={errors.position} />}
</div>

        {/* Hint informatif boks urutan posisi  */}
<div className="mt-2 p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-300">
        <div className="w-1.5 h-3.5 bg-sky-500 rounded-full"></div>
        <span className="text-xs font-semibold uppercase tracking-wider">
            Urutan Posisi Terpakai ({data.target_division || 'Semua Divisi'})
        </span>
    </div>

    <div className="flex flex-wrap gap-2 mt-1">
        {(() => {
            const filteredCourses = (mandatoryCourses || [])
                .filter((c: any) => {
                    const matchesMandatory = c.is_mandatory || true; 
                    if (!data.target_division || data.target_division === 'all') {
                        return matchesMandatory;
                    }
                    return matchesMandatory && (!c.target_division || c.target_division === data.target_division);
                })
                // URUTKAN: Berdasarkan angka posisi dari terkecil ke terbesar
                .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

            if (filteredCourses.length > 0) {
                return filteredCourses.map((c: any) => (
                    <div 
                        key={c.id} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 shadow-xs text-xs"
                    >
                        <span className="font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded-md text-[10px]">
                            #{c.position || 1}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300 font-medium max-w-[150px] truncate">
                            {c.title}
                        </span>
                    </div>
                ));
            }

            return (
                <div className="w-full text-center py-2 text-xs text-gray-400 dark:text-gray-500 italic bg-white dark:bg-gray-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                    Belum ada posisi terpakai untuk divisi {data.target_division || 'ini'}. Nomor ini aman digunakan sebagai nomor 1.
                </div>
            );
        })()}
    </div>
</div>

       {/* Dropdown Memilih Kursus Prasyarat (Gembok) */}
<div className="space-y-1">
    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Kursus Syarat (Course Terkunci)
    </Label>
    <Select
        value={data.prerequisite_course_id || "none"}
        onValueChange={value => setData('prerequisite_course_id', value === 'none' ? '' : value)}
    >
        <SelectTrigger className="w-full">
            <SelectValue placeholder=" Pilih Course Awal " />
        </SelectTrigger>
        <SelectContent>
            <SelectItem value="none"> Pilih Course Awal (Tanpa Prasyarat) </SelectItem>
            
            {mandatoryCourses && mandatoryCourses.map((course) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
    {errors.prerequisite_course_id && <InputError message={errors.prerequisite_course_id} />}
</div>
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
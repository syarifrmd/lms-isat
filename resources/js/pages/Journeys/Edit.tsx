import InputError from '@/components/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { BookOpen, ArrowLeft, ShieldAlert } from 'lucide-react';

interface Journey {
    id: number;
    title: string;
    description: string;
    status: string;
    target_division: string[];
    position: Record<string, number>;
    is_mandatory: Record<string, boolean>;
    cover_url: string;
}

interface EditJourneyProps {
    auth: {
        user: {
            id: number;
            name: string;
            role: 'ADMIN' | 'TRAINER' | 'USER';
            division: string | null;
        };
    };
    journey: Journey;
    divisions?: string[];
}

export default function EditJourney({ auth, journey, divisions }: EditJourneyProps) {
    const isTrainer = auth.user.role?.toUpperCase() === 'TRAINER';

    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        title: journey.title || '',
        description: journey.description || '',
        status: journey.status || 'draft',
        cover_image: null as File | null,
        target_division: journey.target_division || [], 
        position: journey.position || {},                    
        is_mandatory: journey.is_mandatory || {},
    });

    const handleDivisionChange = (value: string) => {
        if (value === 'all') {
            setData(prev => {
                const isAllSelected = divisions && prev.target_division.length === divisions.length;
                return {
                    ...prev,
                    target_division: isAllSelected ? [] : (divisions ? [...divisions] : []),
                    position: {},
                    is_mandatory: {}
                };
            });
        } else {
            setData(prev => {
                const currentDivisions = prev.target_division;
                const isSelected = currentDivisions.includes(value);
                const nextDivisions = isSelected
                    ? currentDivisions.filter(d => d !== value)
                    : [...currentDivisions, value];
                
                const nextPosition = { ...prev.position };
                const nextMandatory = { ...prev.is_mandatory };
                if (isSelected) {
                    if (nextPosition[value] !== undefined) delete nextPosition[value];
                    if (nextMandatory[value] !== undefined) delete nextMandatory[value];
                }
                
                return {
                    ...prev,
                    target_division: nextDivisions,
                    position: nextPosition,
                    is_mandatory: nextMandatory
                };
            });
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload = {
            ...data,
            target_division: data.target_division.length === 0 ? null : data.target_division,
        };

        router.post(`/journeys/${journey.id}`, payload as any, {
            forceFormData: true,
            preserveScroll: true
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Journeys', href: '/journeys' },
            { title: 'Edit Journey', href: `/journeys/${journey.id}/edit` },
        ]}>
            <Head title="Edit Journey" />

            <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-6">

                {/* Header */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Manajemen Journey</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600">Edit Journey</p>
                        </div>
                    </div>
                    <Link
                        href="/journeys"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Link>
                </div>

                {/* Form */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Detail Journey</h2>
                    </div>

                    <form onSubmit={submit}>
                        <div className="p-5 space-y-5">
                            {/* Judul */}
                            <div className="space-y-1.5">
                                <Label htmlFor="title" className="text-sm font-medium">
                                    Judul Journey <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Contoh: Frontend Developer Journey"
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
                                    placeholder="Apa yang akan dipelajari peserta dalam journey ini?"
                                    rows={4}
                                    className="resize-none"
                                />
                                <InputError message={errors.description} />
                            </div>

                            {/* Status */}
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

                            {/* Target Divisi */}
                            <div className="space-y-1.5 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
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
                                <InputError message={errors.target_division} />
                            </div>

                            {/* Pengaturan Per Divisi */}
                            {data.target_division.length > 0 && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 mt-4 space-y-4">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm">
                                        Pengaturan Journey per Divisi
                                    </h4>
                                    
                                    {data.target_division.map((divName) => (
                                        <div key={divName} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 shadow-xs">
                                            <div className="sm:w-1/3">
                                                <span className="text-xs font-bold text-gray-400 uppercase block">Divisi</span>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{divName}</span>
                                            </div>
                                            
                                            <div className="sm:w-1/3 space-y-1">
                                                <Label className="text-xs text-gray-500">Sifat Journey</Label>
                                                <Select 
                                                    value={data.is_mandatory[divName] ? 'true' : 'false'} 
                                                    onValueChange={(val) => setData('is_mandatory', { ...data.is_mandatory, [divName]: val === 'true' })}
                                                >
                                                    <SelectTrigger className="h-9">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="false">Non-Mandatory</SelectItem>
                                                        <SelectItem value="true">Mandatory</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="sm:w-1/3 space-y-1">
                                                <Label className="text-xs text-gray-500">Urutan Posisi</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="Contoh: 1"
                                                    className="h-9"
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
                                        </div>
                                    ))}
                                    {errors.position && <InputError message={errors.position} />}
                                    {errors.is_mandatory && <InputError message={errors.is_mandatory} />}
                                </div>
                            )}

                            {/* Gambar Cover */}
                            <div className="space-y-1.5">
                                <Label htmlFor="cover_image" className="text-sm font-medium">Gambar Cover (Biarkan kosong jika tidak ingin mengubah)</Label>
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
                                {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </AppLayout>
    );
}
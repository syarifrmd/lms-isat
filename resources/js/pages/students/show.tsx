import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, Mail, MapPin, CreditCard, Users, Search, PlayCircle, FileText, File as FileIcon, Award, XCircle, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';

interface QuizResult {
    quiz_id: number;
    quiz_title: string;
    passing_score: number;
    attempts_count: number;
    is_passed: boolean;
    highest_score: number | null;
    last_attempt_at: string | null;
    failed_score_count: number;
    failed_time_count: number;
}

interface ModuleProgress {
    module_id: number;
    module_title: string;
    order_sequence: number;
    has_video: boolean;
    has_text: boolean;
    has_document: boolean;
    is_video_watched: boolean;
    is_text_read: boolean;
    is_document_read: boolean;
    is_completed: boolean;
    quizzes: QuizResult[];
}

interface StudentRow {
    enrollment_id: number;
    user_id: string;
    name: string;
    username?: string;
    email: string;
    avatar?: string | null;
    employee_id?: string;
    division?: string;
    location?: string;
    status?: string;
    progress_percentage: number;
    enrollment_at?: string;
    completed_at?: string;
    modules_progress?: ModuleProgress[];
    score_failed_count: number;
    time_failed_count: number;
}

interface Course {
    id: number;
    title: string;
    description?: string;
    category?: string;
    status?: string;
    journey_id?: number;
}

interface Props {
    course: Course;
    students: StudentRow[];
    total_enrollments: number;
    total_completed: number;
    scope_label: string;
    scope_value: string;
    division_filter?: string | null;
}

function StatusCheckIcon({ done, label }: { done: boolean; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            ) : (
                <XCircle className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
            )}
            <span className={`text-xs ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>{label}</span>
        </div>
    );
}

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-1.5 w-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
        </div>
    );
}

export default function StudentsShow({ course, students, total_enrollments, total_completed, scope_label, scope_value, division_filter }: Props) {
    const [search, setSearch] = useState('');
    const [profileUser, setProfileUser] = useState<StudentRow | null>(null);

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Summary', href: '/students' },
        { title: course.title, href: `/students/${course.id}` },
    ];

    const matchesSearch = (e: StudentRow) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            e.name.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q) ||
            (e.employee_id ?? '').toLowerCase().includes(q) ||
            (e.division ?? '').toLowerCase().includes(q) ||
            (e.location ?? '').toLowerCase().includes(q)
        );
    };

    const filteredStudents = students.filter(matchesSearch);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Report - ${course.title}`} />

            {/* Profile Modal */}
            <Dialog open={!!profileUser} onOpenChange={() => setProfileUser(null)}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base">Profil Peserta</DialogTitle>
                    </DialogHeader>
                    {profileUser && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col items-center gap-2 pt-1">
                                {profileUser.avatar ? (
                                    <img
                                        src={profileUser.avatar}
                                        alt={profileUser.name}
                                        className="h-16 w-16 rounded-full object-cover border border-sky-100 dark:border-sky-900 bg-gray-100 dark:bg-gray-700"
                                    />
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 font-bold text-2xl flex items-center justify-center">
                                        {profileUser.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="text-center">
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">{profileUser.name}</p>
                                    {profileUser.completed_at ? (
                                        <span className="mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Selesai</span>
                                    ) : (
                                        <span className="mt-1 inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Dalam Proses</span>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">Username</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-100">{profileUser.username || profileUser.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <CreditCard className="h-4 w-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">NIK</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-100">{profileUser.employee_id ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">Lokasi</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-100">{profileUser.location ?? '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <Users className="h-4 w-4 text-gray-400 shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-400">Divisi</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-100">{profileUser.division ?? '-'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 flex flex-col gap-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Progress Kursus</span>
                                    <span className="font-semibold text-sky-600 dark:text-sky-400">{profileUser.progress_percentage ?? 0}%</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                    <div className="h-2 rounded-full bg-sky-500 transition-all" style={{ width: `${profileUser.progress_percentage ?? 0}%` }} />
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Daftar: {profileUser.enrollment_at ?? '-'}</span>
                                    <span>Selesai: {profileUser.completed_at ?? '-'}</span>
                                </div>
                            </div>

                            {/* Ringkasan Kegagalan */}
                            <div className="rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3">
                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Ringkasan Kegagalan</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 px-3 py-2">
                                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-red-400">Gagal Nilai</p>
                                            <p className="text-sm font-bold text-red-600 dark:text-red-400">{profileUser.score_failed_count ?? 0}x</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 px-3 py-2">
                                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-amber-400">Gagal Waktu</p>
                                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{profileUser.time_failed_count ?? 0}x</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detail per Modul */}
                            {profileUser.modules_progress && profileUser.modules_progress.length > 0 && (
                                <div className="rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Detail Modul &amp; Kuis</p>
                                    <div className="space-y-3">
                                        {profileUser.modules_progress.map((mod) => {
                                            const totalItems = [mod.has_video, mod.has_document].filter(Boolean).length;
                                            const completedItems = [
                                                mod.has_video ? mod.is_video_watched : null,
                                                mod.has_document ? mod.is_document_read : null,
                                            ].filter((v) => v === true).length;

                                            return (
                                                <div key={mod.module_id}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                            {mod.order_sequence}. {mod.module_title}
                                                        </p>
                                                        {totalItems > 0 && (
                                                            <span
                                                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                                    completedItems >= totalItems
                                                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                                }`}
                                                            >
                                                                {completedItems}/{totalItems}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {totalItems > 0 && (
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-1.5 pl-3">
                                                            {mod.has_video && <StatusCheckIcon done={mod.is_video_watched} label="Video" />}
                                                            {mod.has_text && <StatusCheckIcon done={mod.is_text_read} label="Text" />}
                                                            {mod.has_document && <StatusCheckIcon done={mod.is_document_read} label="Dokumen" />}
                                                        </div>
                                                    )}

                                                    {mod.quizzes.length > 0 ? (
                                                        <div className="space-y-1.5 pl-3">
                                                            {mod.quizzes.map((q) => (
                                                                <div
                                                                    key={q.quiz_id}
                                                                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                                                                        q.is_passed
                                                                            ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        <Award className={`h-3 w-3 shrink-0 ${q.is_passed ? 'text-emerald-500' : 'text-gray-400'}`} />
                                                                        <span className="truncate text-gray-700 dark:text-gray-200 font-medium">{q.quiz_title}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                                        {q.highest_score !== null && (
                                                                            <span className="flex items-center gap-1 text-gray-500">
                                                                                <Trophy className="h-3 w-3 text-amber-400" />
                                                                                {q.highest_score}{q.passing_score > 0 && `/${q.passing_score}`}
                                                                            </span>
                                                                        )}
                                                                        {q.failed_score_count > 0 && (
                                                                            <span className="flex items-center gap-0.5 text-red-500 font-semibold">
                                                                                <XCircle className="h-3 w-3" />{q.failed_score_count}
                                                                            </span>
                                                                        )}
                                                                        {q.failed_time_count > 0 && (
                                                                            <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                                                                                <Clock className="h-3 w-3" />{q.failed_time_count}
                                                                            </span>
                                                                        )}
                                                                        {q.is_passed ? (
                                                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">LULUS</span>
                                                                        ) : q.attempts_count === 0 ? (
                                                                            <span className="text-gray-400">&mdash;</span>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] text-gray-400 pl-3">Tidak ada kuis</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-[11px] text-gray-400">
                                        <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-400" /> = Gagal Nilai</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-400" /> = Gagal Waktu</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">
                {/* Back */}
                <button
                    onClick={() => router.visit(course.journey_id ? `/students?journey=${course.journey_id}` : '/students')}
                    className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-sky-500 dark:hover:text-sky-400 transition w-fit"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Daftar Course
                </button>

                {/* Header Card */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Detail Kursus</p>
                        <h1 className="mt-0.5 text-xl font-bold text-gray-800 dark:text-gray-100">{course.title}</h1>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {course.category && (
                                <>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{course.category}</span>
                                    <span className="text-gray-300 dark:text-gray-600">&bull;</span>
                                </>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">{total_enrollments} user terdaftar</span>
                            <span className="text-gray-300 dark:text-gray-600">&bull;</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{scope_label}: {scope_value}</span>
                            {division_filter && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600">&bull;</span>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 rounded-full px-2.5 py-0.5">
                                        Divisi: {division_filter}
                                        <button
                                            type="button"
                                            onClick={() => router.visit(`/students/${course.id}`)}
                                            className="text-sky-400 hover:text-sky-600 dark:hover:text-sky-300"
                                        >
                                            &times;
                                        </button>
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:w-auto sm:shrink-0">
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center gap-3 shadow-sm">
                            <div className="h-9 w-9 rounded-full bg-sky-50 dark:bg-sky-900/40 text-sky-500 flex items-center justify-center">
                                <Users className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest">Terdaftar</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{total_enrollments}</p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center gap-3 shadow-sm">
                            <div className="h-9 w-9 rounded-full bg-green-50 dark:bg-green-900/40 text-green-500 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest">Selesai</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{total_completed}</p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center gap-3 shadow-sm col-span-2 sm:col-span-1">
                            <div className="h-9 w-9 rounded-full bg-amber-50 dark:bg-amber-900/40 text-amber-500 flex items-center justify-center">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest">Berjalan</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{total_enrollments - total_completed}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* List Card (flat, simplified: nama, lokasi, progress) */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Daftar Peserta</h2>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Cari nama, email, NIK, divisi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-700 transition"
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                        {filteredStudents.length === 0 ? (
                            <p className="px-5 py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                                {search ? 'Tidak ada hasil yang cocok.' : 'Belum ada peserta yang terdaftar.'}
                            </p>
                        ) : (
                            filteredStudents.map((s, idx) => (
                                <button
                                    type="button"
                                    key={s.enrollment_id}
                                    onClick={() => setProfileUser(s)}
                                    className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-5 py-3 text-left hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors"
                                >
                                    <span className="w-full sm:w-8 shrink-0 text-xs text-gray-300">{idx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{s.name}</p>
                                        <p className="text-[11px] text-gray-400 truncate">{s.employee_id} &bull; {s.email}</p>
                                    </div>
                                    <div className="w-full sm:w-40 text-xs text-gray-400 shrink-0 truncate">{s.location} &bull; {s.division}</div>
                                    <div className="shrink-0">
                                        <ProgressBar value={s.progress_percentage} />
                                        <p className="text-[10px] text-gray-400 mt-1">{s.progress_percentage}%</p>
                                    </div>
                                    {s.score_failed_count > 0 && (
                                        <span className="text-[11px] text-red-500 shrink-0">&#8855; {s.score_failed_count}x</span>
                                    )}
                                    <span
                                        className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                            s.completed_at
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                                        }`}
                                    >
                                        {s.completed_at ? 'Selesai' : 'Dalam Proses'}
                                    </span>
                                    <span className="w-full sm:w-20 text-[11px] text-gray-400 shrink-0">{s.enrollment_at ?? '-'}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, Mail, MapPin, CreditCard, Users, Search, ChevronDown, ChevronRight, PlayCircle, FileText, File as FileIcon, Award, XCircle, Trophy } from 'lucide-react';
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

interface Enrollment {
    user_id: string;
    name: string;
    email: string;
    region?: string;
    employee_id?: string;
    status?: string;
    progress_percentage: number;
    enrollment_at?: string;
    completed_at?: string;
    modules_progress?: ModuleProgress[];
}

interface Course {
    id: number;
    title: string;
    description?: string;
    category?: string;
    status?: string;
}

interface Props {
    course: Course;
    enrollments: Enrollment[];
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

export default function StudentsShow({ course, enrollments }: Props) {
    const [search, setSearch] = useState('');
    const [profileUser, setProfileUser] = useState<Enrollment | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (userId: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(userId)) {
                next.delete(userId);
            } else {
                next.add(userId);
            }
            return next;
        });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pemantauan Students', href: '/students' },
        { title: course.title, href: `/students/${course.id}` },
    ];

    const filtered = enrollments.filter(
        (e) =>
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.email.toLowerCase().includes(search.toLowerCase()) ||
            (e.employee_id ?? '').toLowerCase().includes(search.toLowerCase()),
    );

    const totalCompleted = enrollments.filter((e) => !!e.completed_at).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Students - ${course.title}`} />

            {/* Profile Modal */}
            <Dialog open={!!profileUser} onOpenChange={() => setProfileUser(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-base">Profil Student</DialogTitle>
                    </DialogHeader>
                    {profileUser && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col items-center gap-2 pt-1">
                                <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 font-bold text-2xl flex items-center justify-center">
                                    {profileUser.name.charAt(0).toUpperCase()}
                                </div>
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
                                        <p className="text-xs text-gray-400">Email</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-100">{profileUser.email}</p>
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
                                        <p className="text-xs text-gray-400">Region</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-100">{profileUser.region ?? '-'}</p>
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
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* Back */}
                <button
                    onClick={() => router.visit('/students')}
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
                        {course.category && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{course.category}</p>}
                    </div>
                    {/* Stats */}
                    <div className="flex gap-3 shrink-0">
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center gap-3 shadow-sm">
                            <div className="h-9 w-9 rounded-full bg-sky-50 dark:bg-sky-900/40 text-sky-500 flex items-center justify-center">
                                <Users className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest">Terdaftar</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{enrollments.length}</p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center gap-3 shadow-sm">
                            <div className="h-9 w-9 rounded-full bg-green-50 dark:bg-green-900/40 text-green-500 flex items-center justify-center">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest">Selesai</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{totalCompleted}</p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center gap-3 shadow-sm">
                            <div className="h-9 w-9 rounded-full bg-amber-50 dark:bg-amber-900/40 text-amber-500 flex items-center justify-center">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-widest">Berjalan</p>
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{enrollments.length - totalCompleted}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    {/* Search bar */}
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Daftar Students</h2>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Cari nama, email, atau NIK..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-4 py-2 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-sky-300 dark:focus:ring-sky-700 transition"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                    <th className="px-5 py-3 w-10">#</th>
                                    <th className="px-5 py-3 w-8"></th>
                                    <th className="px-5 py-3">Nama</th>
                                    <th className="px-5 py-3">Email</th>
                                    <th className="px-5 py-3">NIK</th>
                                    <th className="px-5 py-3">Region</th>
                                    <th className="px-5 py-3">Progress</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Tgl Daftar</th>
                                    <th className="px-5 py-3">Tgl Selesai</th>
                                    <th className="px-5 py-3 text-center">Profil</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {filtered.length > 0 ? (
                                    filtered.map((enrollment, index) => {
                                        const isExpanded = expandedRows.has(enrollment.user_id);
                                        const hasModulesData = enrollment.modules_progress && enrollment.modules_progress.length > 0;

                                        return (
                                            <>
                                                <tr key={enrollment.user_id} className={`hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors ${isExpanded ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''}`}>
                                                    <td className="px-5 py-3 text-gray-300 dark:text-gray-600">{index + 1}</td>
                                                    <td className="px-2 py-3">
                                                        {hasModulesData && (
                                                            <button
                                                                onClick={() => toggleRow(enrollment.user_id)}
                                                                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-sky-500 transition-colors"
                                                            >
                                                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">{enrollment.name}</td>
                                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{enrollment.email}</td>
                                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{enrollment.employee_id ?? '-'}</td>
                                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{enrollment.region ?? '-'}</td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-24 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                                                <div className="h-1.5 rounded-full bg-sky-500 transition-all" style={{ width: `${enrollment.progress_percentage ?? 0}%` }} />
                                                            </div>
                                                            <span className="text-xs text-gray-400">{enrollment.progress_percentage ?? 0}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {enrollment.completed_at ? (
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Selesai</span>
                                                        ) : (
                                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">Dalam Proses</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{enrollment.enrollment_at ?? '-'}</td>
                                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{enrollment.completed_at ?? '-'}</td>
                                                    <td className="px-5 py-3 text-center">
                                                        <button
                                                            onClick={() => setProfileUser(enrollment)}
                                                            className="text-xs font-medium px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600 dark:hover:bg-sky-900/30 dark:hover:border-sky-800 dark:hover:text-sky-400 transition"
                                                        >
                                                            Lihat Profil
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* ── Expandable Progress Detail Row ── */}
                                                {isExpanded && hasModulesData && (
                                                    <tr key={`${enrollment.user_id}-detail`}>
                                                        <td colSpan={11} className="p-0">
                                                            <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                                                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                                                                    Detail Progress — {enrollment.name}
                                                                </p>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                                                    {enrollment.modules_progress!.map((mod) => {
                                                                        const completedItems = [
                                                                            mod.has_video && mod.is_video_watched,
                                                                            mod.has_text && mod.is_text_read,
                                                                            mod.has_document && mod.is_document_read,
                                                                        ].filter(Boolean).length;
                                                                        const totalItems = [mod.has_video, mod.has_text, mod.has_document].filter(Boolean).length;

                                                                        return (
                                                                            <div
                                                                                key={mod.module_id}
                                                                                className={`rounded-xl border p-3.5 transition-all ${
                                                                                    mod.is_completed
                                                                                        ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                                                }`}
                                                                            >
                                                                                {/* Module header */}
                                                                                <div className="flex items-start justify-between gap-2 mb-2.5">
                                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                                                            mod.is_completed
                                                                                                ? 'bg-emerald-500 text-white'
                                                                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                                                                        }`}>
                                                                                            {mod.is_completed ? '✓' : mod.order_sequence}
                                                                                        </div>
                                                                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{mod.module_title}</p>
                                                                                    </div>
                                                                                    {totalItems > 0 && (
                                                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                                                            completedItems >= totalItems
                                                                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                                                        }`}>
                                                                                            {completedItems}/{totalItems}
                                                                                        </span>
                                                                                    )}
                                                                                </div>

                                                                                {/* Content checklist */}
                                                                                {totalItems > 0 && (
                                                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
                                                                                        {mod.has_video && <StatusCheckIcon done={mod.is_video_watched} label="Video" />}
                                                                                        {mod.has_text && <StatusCheckIcon done={mod.is_text_read} label="Text" />}
                                                                                        {mod.has_document && <StatusCheckIcon done={mod.is_document_read} label="Dokumen" />}
                                                                                    </div>
                                                                                )}

                                                                                {/* Quizzes */}
                                                                                {mod.quizzes.length > 0 && (
                                                                                    <div className="mt-2 space-y-2">
                                                                                        {mod.quizzes.map((quiz) => (
                                                                                            <div
                                                                                                key={quiz.quiz_id}
                                                                                                className={`rounded-lg border p-2.5 ${
                                                                                                    quiz.is_passed
                                                                                                        ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20'
                                                                                                        : quiz.attempts_count > 0
                                                                                                          ? 'border-red-200 dark:border-red-800/40 bg-red-50/40 dark:bg-red-950/20'
                                                                                                          : 'border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                                                                                                }`}
                                                                                            >
                                                                                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                                                        <Award className={`h-3.5 w-3.5 shrink-0 ${quiz.is_passed ? 'text-emerald-500' : 'text-gray-400'}`} />
                                                                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{quiz.quiz_title}</span>
                                                                                                    </div>
                                                                                                    {quiz.is_passed ? (
                                                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 shrink-0">
                                                                                                            LULUS
                                                                                                        </span>
                                                                                                    ) : quiz.attempts_count > 0 ? (
                                                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 shrink-0">
                                                                                                            BELUM LULUS
                                                                                                        </span>
                                                                                                    ) : (
                                                                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 shrink-0">
                                                                                                            BELUM DIKERJAKAN
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>
                                                                                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                                                                                                    {quiz.highest_score !== null && (
                                                                                                        <span className="flex items-center gap-1">
                                                                                                            <Trophy className={`h-3 w-3 ${quiz.is_passed ? 'text-amber-500' : 'text-gray-400'}`} />
                                                                                                            Nilai: <strong className={quiz.is_passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>{quiz.highest_score}</strong>
                                                                                                            {quiz.passing_score > 0 && <span className="text-gray-400">/ {quiz.passing_score}</span>}
                                                                                                        </span>
                                                                                                    )}
                                                                                                    {quiz.attempts_count > 0 && (
                                                                                                        <span>{quiz.attempts_count}x percobaan</span>
                                                                                                    )}
                                                                                                    {quiz.last_attempt_at && (
                                                                                                        <span>Terakhir: {quiz.last_attempt_at}</span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={11} className="px-5 py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                                            {search ? 'Tidak ada hasil yang cocok.' : 'Belum ada student yang terdaftar.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { LayoutGrid, CheckCircle2, Loader2, PlayCircle, FileText, File as FileIcon, Trophy, BookOpen, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DivisionBreakdown {
    division: string;
    total: number;
    completed: number;
    online: number;
}

interface MyTeamCourse {
    course_id: number;
    title: string;
    total_users: number;
    total_completed: number;
    by_division: DivisionBreakdown[];
}

interface MyActivityCourse {
    course_id: number;
    title: string;
    status: 'completed' | 'in_progress' | 'not_started';
    progress_percentage: number;
}

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

interface Props {
    scope_label: string;
    scope_value: string;
    status_date: string;
    division_count: number;
    course_count: number;
    my_team: { courses: MyTeamCourse[] };
    my_activity: { courses: MyActivityCourse[] };
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function MyTeamCourseCard({ course, onlineByDivision }: { course: MyTeamCourse; onlineByDivision: Record<string, number> }) {
    // HOR & HOS: level manajemen -> tile sendiri, tanpa angka selesai/user active.
    const managementTiles = course.by_division.filter((d) => d.division === 'HOR' || d.division === 'HOS');
    const statTiles = course.by_division.filter((d) => d.division !== 'HOR' && d.division !== 'HOS');

    return (
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <button
                type="button"
                onClick={() => router.visit(`/students/${course.course_id}`)}
                className="w-full text-left border-b border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 px-4 py-3.5 flex items-center gap-3 hover:brightness-95 transition"
            >
                <div className="h-9 w-9 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-500 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{course.title}</p>
                    <p className="text-[11px] text-gray-400">{course.total_completed} selesai</p>
                </div>
            </button>
            <div className="px-4 py-3">
                {course.by_division.length === 0 ? (
                    <p className="text-[11px] text-gray-400 text-center py-2">Belum ada divisi dalam cakupan.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {/* HOR & HOS: level manajemen, ditampilkan sebagai card/tile sendiri tanpa
                            angka "selesai"/"user active" — cukup link langsung ke detail peserta. */}
                        {managementTiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {managementTiles.map((d) => (
                                    <button
                                        type="button"
                                        key={d.division}
                                        onClick={() => router.visit(`/students/${course.course_id}?division=${d.division}`)}
                                        className="flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 px-3 py-2 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                                    >
                                        {d.division}
                                        <ChevronRight className="h-3 w-3" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {statTiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {statTiles.map((d) => (
                                    <button
                                        type="button"
                                        key={d.division}
                                        onClick={() => router.visit(`/students/${course.course_id}?division=${d.division}`)}
                                        className="text-left rounded-lg bg-gray-50 dark:bg-gray-700/40 px-2.5 py-1.5 min-w-[74px] hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:ring-1 hover:ring-sky-200 dark:hover:ring-sky-800 transition"
                                    >
                                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{d.division}</p>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{d.completed}</span>
                                            <span className="text-[9px] text-gray-400">selesai</span>
                                        </div>
                                        <p className="flex items-center gap-1 mt-1 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                            {onlineByDivision[d.division] ?? d.online} user active
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ListCardHeader({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) {
    return (
        <div className="rounded-t-2xl border-b border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 px-4 py-3.5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-500 flex items-center justify-center shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-400 truncate">{eyebrow}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{title}</p>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Module detail (dipakai My Activity, panel kanan)
// ---------------------------------------------------------------------------

function ModulesDetail({ modules }: { modules: ModuleProgress[] }) {
    if (!modules || modules.length === 0) {
        return <p className="text-sm text-gray-400 py-6 text-center">Belum ada modul untuk course ini.</p>;
    }

    return (
        <div className="grid sm:grid-cols-2 gap-3">
            {modules.map((m, idx) => {
                const doneCount = [m.has_video ? m.is_video_watched : null, m.has_document ? m.is_document_read : null].filter((v) => v !== null).length;
                const totalCount = [m.has_video, m.has_document].filter(Boolean).length;

                return (
                    <div
                        key={m.module_id}
                        className={`rounded-xl border p-3 ${
                            m.is_completed
                                ? 'border-emerald-100 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/10'
                                : 'border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/20'
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="h-5 w-5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-[10px] flex items-center justify-center font-semibold text-gray-500 shrink-0">
                                    {idx + 1}
                                </span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{m.module_title}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0">{doneCount}/{totalCount}</span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                            {m.has_video && (
                                <span className={`flex items-center gap-1 ${m.is_video_watched ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    <PlayCircle className="h-3.5 w-3.5" /> Video
                                </span>
                            )}
                            {m.has_document && (
                                <span className={`flex items-center gap-1 ${m.is_document_read ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    <FileIcon className="h-3.5 w-3.5" /> Dokumen
                                </span>
                            )}
                            {m.has_text && (
                                <span className={`flex items-center gap-1 ${m.is_text_read ? 'text-emerald-500' : 'text-gray-400'}`}>
                                    <FileText className="h-3.5 w-3.5" /> Teks
                                </span>
                            )}
                        </div>

                        {m.quizzes.map((q) => (
                            <div
                                key={q.quiz_id}
                                className={`rounded-lg px-2.5 py-2 flex items-center justify-between gap-2 ${
                                    q.is_passed ? 'bg-emerald-50 dark:bg-emerald-950/20' : q.attempts_count > 0 ? 'bg-red-50 dark:bg-red-950/20' : 'bg-gray-100 dark:bg-gray-700/40'
                                }`}
                            >
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                    <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate">{q.quiz_title}</span>
                                </div>
                                <span className={`text-[10px] font-semibold shrink-0 ${q.is_passed ? 'text-emerald-600' : q.attempts_count > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {q.is_passed ? 'LULUS' : q.attempts_count > 0 ? `${q.highest_score ?? 0}/${q.passing_score} \u00b7 ${q.attempts_count}x` : 'BELUM DIKERJAKAN'}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function StudentsIndex({ my_team, scope_label, scope_value, status_date, division_count, course_count, my_activity }: Props) {
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(my_activity.courses[0]?.course_id ?? null);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityModules, setActivityModules] = useState<ModuleProgress[]>([]);

    // Status "user active" per divisi, di-seed dari data awal lalu di-refresh sendiri lewat
    // polling ringan (lihat effect di bawah) supaya kerasa realtime tanpa reload manual.
    const [onlineByDivision, setOnlineByDivision] = useState<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        my_team.courses.forEach((c) => c.by_division.forEach((d) => { map[d.division] = d.online; }));
        return map;
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Summary', href: '/students' },
    ];

    const selectCourse = async (courseId: number) => {
        setSelectedCourseId(courseId);
        setActivityLoading(true);
        try {
            const res = await fetch(`/students/my-activity/${courseId}`);
            const data = await res.json();
            setActivityModules(data.modules_progress ?? []);
        } finally {
            setActivityLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCourseId) {
            selectCourse(selectedCourseId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Real-time "user active": fetch JSON kecil /students/online-counts tiap 5 detik dan
    // update HANYA angka online-nya (tidak reload halaman/tidak refetch seluruh My Team),
    // jadi terasa langsung berubah tanpa perlu reload manual. Otomatis berhenti kalau tab
    // sedang tidak aktif dilihat (hemat request), lanjut lagi + langsung refresh begitu
    // tab dibuka lagi.
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        let cancelled = false;

        const fetchOnlineCounts = async () => {
            try {
                const res = await fetch('/students/online-counts', {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                setOnlineByDivision((prev) => ({ ...prev, ...data }));
            } catch {
                // Abaikan error jaringan sesaat, coba lagi di polling berikutnya.
            }
        };

        const startPolling = () => {
            if (interval) return;
            interval = setInterval(fetchOnlineCounts, 5000);
        };

        const stopPolling = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchOnlineCounts();
                startPolling();
            } else {
                stopPolling();
            }
        };

        fetchOnlineCounts();
        startPolling();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelled = true;
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Summary" />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">
                {/* Header */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-500 flex items-center justify-center shrink-0">
                            <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Report</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">Summary</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {division_count} division &bull; {course_count} course dipantau
                            </p>
                        </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                        <p>
                            {scope_label}: <span className="font-semibold text-gray-600 dark:text-gray-300">{scope_value}</span>
                        </p>
                        <p>Status Data: {status_date}</p>
                    </div>
                </div>

                {/* My Team: 1 card per course, breakdown user selesai per divisi */}
                <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">My Team</p>
                    {my_team.courses.length === 0 ? (
                        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm px-4 py-10 text-center text-sm text-gray-400">
                            Belum ada course dengan journey yang bisa ditampilkan untuk tim Anda.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {my_team.courses.map((c) => (
                                <MyTeamCourseCard key={c.course_id} course={c} onlineByDivision={onlineByDivision} />
                            ))}
                        </div>
                    )}
                </div>

                {/* My Activity */}
                <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">My Activity</p>
                    <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
                        {/* Left: mandatory course list */}
                        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                            <ListCardHeader icon={<CheckCircle2 className="h-4 w-4" />} eyebrow="Journey Mandatory" title="Course Saya" />
                            <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[480px] overflow-y-auto">
                                {my_activity.courses.length === 0 ? (
                                    <p className="px-4 py-8 text-center text-sm text-gray-400">Tidak ada course mandatory.</p>
                                ) : (
                                    my_activity.courses.map((c) => {
                                        const active = c.course_id === selectedCourseId;
                                        const statusText =
                                            c.status === 'completed' ? 'Selesai' : c.status === 'in_progress' ? 'Sedang dikerjakan' : 'Belum dimulai';
                                        return (
                                            <button
                                                key={c.course_id}
                                                type="button"
                                                onClick={() => selectCourse(c.course_id)}
                                                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                                                    active ? 'bg-sky-50 dark:bg-sky-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${active ? 'text-sky-700 dark:text-sky-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                        {c.title}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{statusText}</p>
                                                </div>
                                                <div className="shrink-0">
                                                    {c.status === 'completed' ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                    ) : c.status === 'in_progress' ? (
                                                        <span className="text-xs font-bold text-amber-500">{c.progress_percentage}%</span>
                                                    ) : (
                                                        <span className="text-sm font-bold text-gray-300">&mdash;</span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right: module detail of selected course */}
                        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                            <ListCardHeader
                                icon={<LayoutGrid className="h-4 w-4" />}
                                eyebrow="Detail Progress"
                                title={my_activity.courses.find((c) => c.course_id === selectedCourseId)?.title ?? '-'}
                            />
                            <div className="p-4">
                                {activityLoading ? (
                                    <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Memuat modul...
                                    </div>
                                ) : (
                                    <ModulesDetail modules={activityModules} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
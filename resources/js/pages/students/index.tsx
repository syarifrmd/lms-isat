import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { LayoutGrid, CheckCircle2, Loader2, PlayCircle, FileText, File as FileIcon, Trophy, BookOpen, ChevronRight, ArrowLeft, Map, Users, Layers, Building2, Inbox, UserCheck, X } from 'lucide-react';
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
    journey_id: number;
    title: string;
    total_users: number;
    total_completed: number;
    by_division: DivisionBreakdown[];
}

interface MyTeamJourney {
    journey_id: number;
    journey_title: string;
    total_courses: number;
    total_users: number;
    total_completed: number;
    total_modules: number;
    divisions: string[];
    active_users: number;
    courses: MyTeamCourse[];
}

interface ActiveUser {
    id: number;
    name: string;
    avatar: string | null;
    location: string;
}

interface MyActivityCourse {
    course_id: number;
    journey_id: number;
    title: string;
    status: 'completed' | 'in_progress' | 'not_started';
    progress_percentage: number;
}

interface MyActivityJourney {
    journey_id: number;
    journey_title: string;
    total_courses: number;
    completed_count: number;
    in_progress_count: number;
    courses: MyActivityCourse[];
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
    my_team: { journeys: MyTeamJourney[] };
    my_activity: { journeys: MyActivityJourney[] };
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function MyTeamCourseCard({ course }: { course: MyTeamCourse }) {
    // Semua tile divisi (HOR, HOS, BSM, CSE, DSE) tampil seragam: hanya nama divisi,
    // tanpa angka "selesai" / "user active".
    const divisionTiles = course.by_division;

    return (
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="w-full text-left border-b border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 px-4 py-3.5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-500 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{course.title}</p>
                    <p className="text-[11px] text-gray-400">{course.total_completed} selesai</p>
                </div>
            </div>
            <div className="px-4 py-3">
                {divisionTiles.length === 0 ? (
                    <p className="text-[11px] text-gray-400 text-center py-2">Belum ada divisi dalam cakupan.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {divisionTiles.map((d) => (
                            <button
                                type="button"
                                key={d.division}
                                onClick={() => router.visit(`/students/${course.course_id}?division=${d.division}&journey=${course.journey_id}`)}
                                className="flex items-center gap-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 px-3 py-2 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                            >
                                {d.division}
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MyTeamJourneyCard({
    journey,
    onOpen,
    liveActiveCount,
}: {
    journey: MyTeamJourney;
    onOpen: () => void;
    liveActiveCount?: number;
}) {
    const [showActivePopup, setShowActivePopup] = useState(false);
    const [activeUsersLoading, setActiveUsersLoading] = useState(false);
    const [activeUsers, setActiveUsers] = useState<ActiveUser[] | null>(null);

    const fetchActiveUsers = async () => {
        setActiveUsersLoading(true);
        try {
            const res = await fetch(`/students/journey-active-users/${journey.journey_id}`, {
                headers: { Accept: 'application/json' },
            });
            const data = await res.json();
            setActiveUsers(data.users ?? []);
        } catch {
            setActiveUsers((prev) => prev ?? []);
        } finally {
            setActiveUsersLoading(false);
        }
    };

    const openActivePopup = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowActivePopup(true);
        // Selalu ambil data terbaru karena status "aktif di journey ini" bisa berubah kapan saja.
        fetchActiveUsers();
    };

    // Selagi pop up terbuka, refresh daftarnya setiap 5 detik supaya benar-benar realtime.
    useEffect(() => {
        if (!showActivePopup) return;
        const interval = setInterval(fetchActiveUsers, 5000);
        return () => clearInterval(interval);
    }, [showActivePopup]);

    const baseActive = liveActiveCount !== undefined ? liveActiveCount : journey.active_users;
    const totalActive = activeUsers !== null ? activeUsers.length : baseActive;

    return (
        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <button
                type="button"
                onClick={onOpen}
                className="w-full text-left border-b border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 px-4 py-3.5 flex items-center gap-3 hover:brightness-95 transition"
            >
                <div className="h-9 w-9 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-500 flex items-center justify-center shrink-0">
                    <Map className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{journey.journey_title}</p>
                    <p className="text-[11px] text-gray-400">{journey.total_completed} selesai</p>
                </div>
                <ChevronRight className="h-4 w-4 text-sky-400 shrink-0 ml-auto" />
            </button>
            <div className="px-4 py-3 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={onOpen}
                    className="text-left rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-2.5 flex items-center gap-2.5 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:ring-1 hover:ring-sky-200 dark:hover:ring-sky-800 transition"
                >
                    <div className="h-8 w-8 rounded-full bg-sky-50 dark:bg-sky-900/40 text-sky-500 flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-none">{journey.total_courses}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-1">course tersedia</p>
                    </div>
                </button>
                <button
                    type="button"
                    onClick={onOpen}
                    className="text-left rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-2.5 flex items-center gap-2.5 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:ring-1 hover:ring-sky-200 dark:hover:ring-sky-800 transition"
                >
                    <div className="h-8 w-8 rounded-full bg-sky-50 dark:bg-sky-900/40 text-sky-500 flex items-center justify-center shrink-0">
                        <Layers className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-none">{journey.total_modules}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-1">module tersedia</p>
                    </div>
                </button>
                <button
                    type="button"
                    onClick={onOpen}
                    className="text-left rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-2.5 flex items-center gap-2.5 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:ring-1 hover:ring-sky-200 dark:hover:ring-sky-800 transition"
                >
                    <div className="h-8 w-8 rounded-full bg-sky-50 dark:bg-sky-900/40 text-sky-500 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-none">{journey.total_users}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-1">user terdaftar</p>
                    </div>
                </button>
                <button
                    type="button"
                    onClick={openActivePopup}
                    className="text-left rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-3 py-2.5 flex items-center gap-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:ring-1 hover:ring-emerald-200 dark:hover:ring-emerald-800 transition"
                >
                    <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-500 flex items-center justify-center shrink-0">
                        <UserCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base font-bold text-gray-800 dark:text-gray-100 leading-none">{totalActive}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight mt-1">user active</p>
                    </div>
                </button>
            </div>

            {showActivePopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowActivePopup(false);
                    }}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="border-b border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 px-4 py-3.5 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-500 flex items-center justify-center shrink-0">
                                <UserCheck className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-400 truncate">User Active</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{journey.journey_title}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowActivePopup(false)}
                                className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="px-4 py-2.5 flex items-center gap-2 bg-gray-50/60 dark:bg-gray-900/30 border-b border-gray-50 dark:border-gray-700">
                            <div className="h-6 w-6 rounded-full bg-sky-50 dark:bg-sky-900/40 text-sky-500 flex items-center justify-center shrink-0">
                                <Building2 className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-xs font-bold text-gray-600 dark:text-gray-300">DSE</p>
                            <p className="text-[11px] text-gray-400 ml-auto">{totalActive} user</p>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
                            {activeUsersLoading && activeUsers === null ? (
                                <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Memuat user active...
                                </div>
                            ) : !activeUsers || activeUsers.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-gray-400">Belum ada user DSE yang aktif di journey ini.</p>
                            ) : (
                                activeUsers.map((u) => (
                                    <div key={u.id} className="flex items-center gap-3 px-4 py-2.5">
                                        {u.avatar ? (
                                            <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{u.name}</p>
                                            <p className="text-[11px] text-gray-400 truncate">{u.location}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between text-xs text-gray-400">
                            <span>Total user active</span>
                            <span className="font-bold text-gray-600 dark:text-gray-300">{totalActive}</span>
                        </div>
                    </div>
                </div>
            )}
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

export default function StudentsIndex({ my_team, scope_label, scope_value, status_date, course_count, my_activity }: Props) {
   
    const teamJourneys = my_team.journeys;
    const activityJourneys = my_activity.journeys;
    const allActivityCourses = activityJourneys.flatMap((j) => j.courses);

    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(() => activityJourneys[0]?.courses[0]?.course_id ?? null);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityModules, setActivityModules] = useState<ModuleProgress[]>([]);

    const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(() => {
        if (typeof window === 'undefined') return null;
        const journeyParam = new URLSearchParams(window.location.search).get('journey');
        return journeyParam ? Number(journeyParam) : null;
    });
    const selectedJourney = teamJourneys.find((j) => j.journey_id === selectedJourneyId) ?? null;

    const [selectedActivityJourneyId, setSelectedActivityJourneyId] = useState<number | null>(
        activityJourneys[0]?.journey_id ?? null,
    );
    const selectedActivityJourney = activityJourneys.find((j) => j.journey_id === selectedActivityJourneyId) ?? null;

    const visibleActivityCourses = selectedActivityJourney?.courses ?? [];

    const [onlineByDivision, setOnlineByDivision] = useState<Record<string, number>>(() => {
        const map: Record<string, number> = {};
        teamJourneys.forEach((j) => j.courses.forEach((c) => c.by_division.forEach((d) => { map[d.division] = d.online; })));
        return map;
    });

    const [activeUsersByJourney, setActiveUsersByJourney] = useState<Record<number, number>>(() => {
        const map: Record<number, number> = {};
        teamJourneys.forEach((j) => { map[j.journey_id] = j.active_users; });
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

    
    const selectActivityJourney = (journey: MyActivityJourney) => {
        setSelectedActivityJourneyId(journey.journey_id);
        const firstCourseId = journey.courses[0]?.course_id;
        if (firstCourseId) {
            selectCourse(firstCourseId);
        } else {
            setSelectedCourseId(null);
            setActivityModules([]);
        }
    };

    // Muat modul untuk course yang sudah ter-default-pilih saat halaman pertama kali dibuka.
    useEffect(() => {
        if (selectedCourseId) {
            selectCourse(selectedCourseId);
        }
       
    }, []);

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

    // Polling terpisah untuk "user active" per journey (berbasis kunjungan+ping ke halaman
    // journey, bukan online biasa), supaya tile & pop up di My Team ikut update otomatis
    // secara realtime.
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        let cancelled = false;

        const fetchActiveCounts = async () => {
            try {
                const res = await fetch('/students/journey-active-counts', {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                setActiveUsersByJourney((prev) => ({ ...prev, ...data }));
            } catch {
                
            }
        };

        const startPolling = () => {
            if (interval) return;
            interval = setInterval(fetchActiveCounts, 5000);
        };

        const stopPolling = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                fetchActiveCounts();
                startPolling();
            } else {
                stopPolling();
            }
        };

        fetchActiveCounts();
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
                                {course_count} course dipantau
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

                <div>
                    <div className="flex items-center gap-2 mb-3">
                        {selectedJourney && (
                            <button
                                type="button"
                                onClick={() => setSelectedJourneyId(null)}
                                className="flex items-center gap-1 text-gray-400 hover:text-sky-500 dark:hover:text-sky-400 transition"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        )}
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            My Team{selectedJourney ? <span className="text-gray-400 font-normal"> &bull; {selectedJourney.journey_title}</span> : ''}
                        </p>
                    </div>

                    {teamJourneys.length === 0 ? (
                        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm px-4 py-10 text-center text-sm text-gray-400">
                            Belum ada journey dengan course yang bisa ditampilkan untuk tim Anda.
                        </div>
                    ) : !selectedJourney ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teamJourneys.map((j) => (
                                <MyTeamJourneyCard
                                    key={j.journey_id}
                                    journey={j}
                                    onOpen={() => setSelectedJourneyId(j.journey_id)}
                                    liveActiveCount={activeUsersByJourney[j.journey_id]}
                                />
                            ))}
                        </div>
                    ) : selectedJourney.courses.length === 0 ? (
                        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm px-4 py-16 flex flex-col items-center gap-2 text-center">
                            <Inbox className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm text-gray-400">Belum ada course yang tersedia.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedJourney.courses.map((c) => (
                                <MyTeamCourseCard key={c.course_id} course={c} />
                            ))}
                        </div>
                    )}
                </div>

                {!selectedJourney && (
                <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">My Activity</p>

                    {activityJourneys.length === 0 ? (
                        <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm px-4 py-10 text-center text-sm text-gray-400">
                            Tidak ada journey mandatory untuk divisi Anda.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-[220px_300px_1fr] gap-4 items-start">
                            {/* Kiri: daftar Journey */}
                            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                                <ListCardHeader icon={<Map className="h-4 w-4" />} eyebrow="Mandatory" title="Journey" />
                                <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[480px] overflow-y-auto">
                                    {activityJourneys.map((j) => {
                                        const active = j.journey_id === selectedActivityJourneyId;
                                        return (
                                            <button
                                                key={j.journey_id}
                                                type="button"
                                                onClick={() => selectActivityJourney(j)}
                                                className={`w-full text-left px-4 py-3 transition-colors ${
                                                    active ? 'bg-sky-50 dark:bg-sky-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'
                                                }`}
                                            >
                                                <p className={`text-sm font-semibold truncate ${active ? 'text-sky-700 dark:text-sky-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {j.journey_title}
                                                </p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">{j.completed_count}/{j.total_courses} selesai</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Tengah: daftar Course milik journey yang dipilih */}
                            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                                <ListCardHeader icon={<CheckCircle2 className="h-4 w-4" />} eyebrow="Journey Mandatory" title="Course Saya" />
                                <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[480px] overflow-y-auto">
                                    {visibleActivityCourses.length === 0 ? (
                                        <p className="px-4 py-8 text-center text-sm text-gray-400">Tidak ada course mandatory.</p>
                                    ) : (
                                        visibleActivityCourses.map((c) => {
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

                            {/* Kanan: Detail Progress modul dari course yang dipilih */}
                            <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                                <ListCardHeader
                                    icon={<LayoutGrid className="h-4 w-4" />}
                                    eyebrow="Detail Progress"
                                    title={allActivityCourses.find((c) => c.course_id === selectedCourseId)?.title ?? '-'}
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
                    )}
                </div>
                )}
            </div>
        </AppLayout>
    );
}
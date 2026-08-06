import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BookOpen,
    Building2,
    CheckCircle2,
    ChevronRight,
    File as FileIcon,
    FileText,
    Inbox,
    Layers,
    LayoutGrid,
    Loader2,
    Map,
    PlayCircle,
    Smartphone,
    Trophy,
    UserCheck,
    X,
} from 'lucide-react';
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
    dse_population: number;
    dse_completed: number;
    training_progress_count: number;
}

interface BrandBreakdown {
    brand: string;
    total_dse: number;
    modul_selesai: number;
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
    brand_summary: BrandBreakdown[];
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
    active_users: number;
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
    summary_url: string;
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

// Nama journey di database biasanya "E-Learning DSE" / "E-Learning CSE"; di tampilan
// cukup tampilkan nama divisinya saja (DSE / CSE) tanpa awalan "E-Learning".
function displayJourneyName(title: string): string {
    const stripped = title.replace(/^e[-\s]?learning\s*/i, '').trim();
    return stripped || title;
}

// Infinite-scroll ringan berbasis "visible count": mulai dari `step` item, nambah `step`
// item lagi tiap kali listnya di-scroll sampai mendekati bawah. Reset ke `step` setiap kali
// panjang datanya berubah (mis. ganti journey / hasil search berubah).
function useVisibleCount(totalLength: number, step: number) {
    const [visibleCount, setVisibleCount] = useState(step);

    useEffect(() => {
        setVisibleCount(step);
    }, [totalLength, step]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
            setVisibleCount((prev) => Math.min(totalLength, prev + step));
        }
    };

    return { visibleCount, handleScroll };
}

function MyTeamCourseCard({
    course,
    summaryUrl,
}: {
    course: MyTeamCourse;
    summaryUrl: string;
}) {
    // Semua tile divisi (HOR, HOS, BSM, CSE, DSE) tampil seragam: hanya nama divisi,
    // tanpa angka "selesai" / "user active".
    const divisionTiles = course.by_division;

    // Progress penyelesaian DSE (jumlah DSE / sudah selesai / persentase), dipindahkan dari
    // halaman detail course ke sini supaya langsung terlihat di card-nya. Dihitung dari
    // course.dse_completed (bukan dari by_division) supaya tetap muncul untuk viewer manapun
    // yang membawahi DSE secara tidak langsung (mis. BSM membawahi banyak CSE/micro cluster),
    // bukan cuma saat viewer-nya persis CSE.
    const dsePopulation = course.dse_population ?? 0;
    const dseCompleted = course.dse_completed ?? 0;
    const dsePercentage =
        dsePopulation > 0 ? (dseCompleted / dsePopulation) * 100 : 0;

    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800">
            <div className="flex w-full items-center gap-3 border-b border-sky-100 bg-gradient-to-br from-sky-50 to-white px-4 py-3.5 text-left dark:border-sky-900 dark:from-sky-950 dark:to-gray-900">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-500 dark:bg-sky-900/50">
                    <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">
                        {course.title}
                    </p>
                    <p className="text-[11px] text-gray-400">
                        {course.total_completed} selesai
                    </p>
                </div>
            </div>
            <div className="px-4 py-3">
                {divisionTiles.length === 0 ? (
                    <p className="py-2 text-center text-[11px] text-gray-400">
                        Belum ada divisi dalam cakupan.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {divisionTiles.map((d) => (
                            <button
                                type="button"
                                key={d.division}
                                onClick={() =>
                                    router.visit(
                                        summaryUrl +
                                            '/' +
                                            course.course_id +
                                            '?division=' +
                                            d.division +
                                            '&journey=' +
                                            course.journey_id,
                                    )
                                }
                                className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:hover:bg-indigo-900/40"
                            >
                                {d.division}
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        ))}
                    </div>
                )}

                {dsePopulation > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            router.visit(
                                `/students/${course.course_id}?division=DSE&journey=${course.journey_id}`,
                            )
                        }
                        className="mt-3 w-full border-t border-gray-50 pt-3 text-left transition hover:opacity-80 dark:border-gray-700"
                    >
                        <p className="mb-2 text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                            Progress DSE
                        </p>
                        <div className="mb-2 grid grid-cols-3 gap-2">
                            <div className="rounded-lg bg-gray-50 px-2.5 py-1.5 dark:bg-gray-900/30">
                                <p className="text-[10px] leading-tight text-gray-400">
                                    Jumlah DSE
                                </p>
                                <p className="text-sm leading-tight font-bold text-gray-700 dark:text-gray-200">
                                    {dsePopulation}
                                </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-2.5 py-1.5 dark:bg-gray-900/30">
                                <p className="text-[10px] leading-tight text-gray-400">
                                    Progres Training
                                </p>
                                <p className="text-sm leading-tight font-bold text-sky-600 dark:text-sky-400">
                                    {course.training_progress_count ?? 0}
                                </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 px-2.5 py-1.5 dark:bg-gray-900/30">
                                <p className="text-[10px] leading-tight text-gray-400">
                                    Modul Selesai
                                </p>
                                <p className="text-sm leading-tight font-bold text-emerald-600 dark:text-emerald-400">
                                    {dseCompleted}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all"
                                    style={{
                                        width: `${Math.min(100, Math.max(0, dsePercentage))}%`,
                                    }}
                                />
                            </div>
                            <span className="shrink-0 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                {dsePercentage.toFixed(1)}%
                            </span>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
}

// Icon brand 3ID / IM3: pakai icon generik (bukan hasil trace logo resmi) dengan warna
// khas masing-masing brand, gaya sama seperti tile "modul tersedia" / "materi training tersedia".
// Nama brand-nya sendiri ditampilkan sebagai teks di sebelah angka (lihat brandLabel di bawah).
function ThreeIdBadge() {
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400">
            <Smartphone className="h-4 w-4" />
        </div>
    );
}

function Im3Badge() {
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Smartphone className="h-4 w-4" />
        </div>
    );
}

function MyTeamJourneyCard({
    journey,
    onOpen,
}: {
    journey: MyTeamJourney;
    onOpen: () => void;
}) {
    // "user terdaftar" dihilangkan, dan "user active" dipindah ke My Activity (di bawah
    // Detail Progress per e-learning) -> card ini tinggal menyisakan modul & materi training tersedia.
    const brands = journey.brand_summary ?? [];

    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800">
            <button
                type="button"
                onClick={onOpen}
                className="flex w-full items-center gap-3 border-b border-sky-100 bg-gradient-to-br from-sky-50 to-white px-4 py-3.5 text-left transition hover:brightness-95 dark:border-sky-900 dark:from-sky-950 dark:to-gray-900"
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-500 dark:bg-sky-900/50">
                    <Map className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">
                        {displayJourneyName(journey.journey_title)}
                    </p>
                </div>
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-sky-400" />
            </button>
            <div className="grid grid-cols-2 gap-2 px-4 py-3">
                <button
                    type="button"
                    onClick={onOpen}
                    className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 text-left transition hover:bg-sky-50 hover:ring-1 hover:ring-sky-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-sky-950/40 dark:hover:ring-sky-800"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/40">
                        <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base leading-none font-bold text-gray-800 dark:text-gray-100">
                            {journey.total_courses}
                        </p>
                        <p className="mt-1 text-[10px] leading-tight text-gray-400 dark:text-gray-500">
                            modul tersedia
                        </p>
                    </div>
                </button>
                <button
                    type="button"
                    onClick={onOpen}
                    className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 text-left transition hover:bg-sky-50 hover:ring-1 hover:ring-sky-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-sky-950/40 dark:hover:ring-sky-800"
                >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/40">
                        <Layers className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-base leading-none font-bold text-gray-800 dark:text-gray-100">
                            {journey.total_modules}
                        </p>
                        <p className="mt-1 text-[10px] leading-tight text-gray-400 dark:text-gray-500">
                            materi training tersedia
                        </p>
                    </div>
                </button>
            </div>

            {brands.length > 0 && (
                <div className="px-4 pb-3">
                    <div className="grid grid-cols-2 gap-2">
                        {brands.map((b) => {
                            const brandLabel =
                                b.brand === '3ID' ? '3ID' : 'IM3';
                            return (
                                <div
                                    key={b.brand}
                                    className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                                >
                                    {b.brand === '3ID' ? (
                                        <ThreeIdBadge />
                                    ) : (
                                        <Im3Badge />
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-base leading-none font-bold text-gray-800 dark:text-gray-100">
                                                {b.modul_selesai}
                                            </p>
                                            <span className="text-[10px] font-bold tracking-wide text-gray-400 uppercase dark:text-gray-500">
                                                {brandLabel}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-[10px] leading-tight text-gray-400">
                                            modul selesai &bull; {b.total_dse}{' '}
                                            DSE
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// "User Active" untuk My Activity: tile + pop up daftar user, ditampilkan di
// bawah panel Detail Progress untuk journey (e-learning) yang sedang dipilih.
// ---------------------------------------------------------------------------

function ActivityJourneyActiveUsers({
    journey,
    liveActiveCount,
}: {
    journey: MyActivityJourney;
    liveActiveCount?: number;
}) {
    const [showActivePopup, setShowActivePopup] = useState(false);
    const [activeUsersLoading, setActiveUsersLoading] = useState(false);
    const [activeUsers, setActiveUsers] = useState<ActiveUser[] | null>(null);

    const fetchActiveUsers = async () => {
        setActiveUsersLoading(true);
        try {
            const res = await fetch(
                '/summary/journey-active-users/' + journey.journey_id,
                {
                    headers: { Accept: 'application/json' },
                },
            );
            const data = await res.json();
            setActiveUsers(data.users ?? []);
        } catch {
            setActiveUsers((prev) => prev ?? []);
        } finally {
            setActiveUsersLoading(false);
        }
    };

    const openActivePopup = () => {
        setShowActivePopup(true);
        // Selalu ambil data terbaru karena status "aktif di journey ini" bisa berubah kapan saja.
        fetchActiveUsers();
    };

    // Reset daftar tiap kali journey yang dipilih berubah, biar tidak nampilkan data journey lama.
    useEffect(() => {
        setActiveUsers(null);
        setShowActivePopup(false);
    }, [journey.journey_id]);

    // Selagi pop up terbuka, refresh daftarnya setiap 5 detik supaya benar-benar realtime.
    useEffect(() => {
        if (!showActivePopup) return;
        const interval = setInterval(fetchActiveUsers, 5000);
        return () => clearInterval(interval);
    }, [showActivePopup]);

    const baseActive =
        liveActiveCount !== undefined ? liveActiveCount : journey.active_users;
    const totalActive = activeUsers !== null ? activeUsers.length : baseActive;

    return (
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
            <button
                type="button"
                onClick={openActivePopup}
                className="flex w-full items-center gap-2.5 rounded-2xl border border-gray-100 bg-white px-3 py-2.5 text-left transition hover:bg-emerald-50 hover:ring-1 hover:ring-emerald-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-emerald-950/30 dark:hover:ring-emerald-800"
            >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-900/40">
                    <UserCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-base leading-none font-bold text-gray-800 dark:text-gray-100">
                        {totalActive}
                    </p>
                    <p className="mt-1 text-[10px] leading-tight text-gray-400 dark:text-gray-500">
                        user active dse
                    </p>
                </div>
            </button>

            {showActivePopup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
                    onClick={() => setShowActivePopup(false)}
                >
                    <div
                        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 border-b border-sky-100 bg-gradient-to-br from-sky-50 to-white px-4 py-3.5 dark:border-sky-900 dark:from-sky-950 dark:to-gray-900">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-900/40">
                                <UserCheck className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[10px] font-semibold tracking-widest text-sky-400 uppercase">
                                    User Active DSE
                                </p>
                                <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">
                                    {displayJourneyName(journey.journey_title)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowActivePopup(false)}
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 border-b border-gray-50 bg-gray-50/60 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900/30">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/40">
                                <Building2 className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                DSE
                            </p>
                            <p className="ml-auto text-[11px] text-gray-400">
                                {totalActive} user
                            </p>
                        </div>

                        <div className="max-h-[50vh] divide-y divide-gray-50 overflow-y-auto dark:divide-gray-700">
                            {activeUsersLoading && activeUsers === null ? (
                                <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                    Memuat user active...
                                </div>
                            ) : !activeUsers || activeUsers.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-gray-400">
                                    Belum ada user DSE yang aktif di journey
                                    ini.
                                </p>
                            ) : (
                                activeUsers.map((u) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center gap-3 px-4 py-2.5"
                                    >
                                        {u.avatar ? (
                                            <img
                                                src={u.avatar}
                                                alt={u.name}
                                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                                {u.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                {u.name}
                                            </p>
                                            <p className="truncate text-[11px] text-gray-400">
                                                {u.location}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-50 px-4 py-3 text-xs text-gray-400 dark:border-gray-700">
                            <span>Total user active</span>
                            <span className="font-bold text-gray-600 dark:text-gray-300">
                                {totalActive}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ListCardHeader({
    icon,
    eyebrow,
    title,
}: {
    icon: React.ReactNode;
    eyebrow: string;
    title: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-t-2xl border-b border-sky-100 bg-gradient-to-br from-sky-50 to-white px-4 py-3.5 dark:border-sky-900 dark:from-sky-950 dark:to-gray-900">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-500 dark:bg-sky-900/50">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold tracking-widest text-sky-400 uppercase">
                    {eyebrow}
                </p>
                <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">
                    {title}
                </p>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Module detail (dipakai My Activity, panel kanan)
// ---------------------------------------------------------------------------

function ModulesDetail({ modules }: { modules: ModuleProgress[] }) {
    if (!modules || modules.length === 0) {
        return (
            <p className="py-6 text-center text-sm text-gray-400">
                Belum ada materi training untuk modul ini.
            </p>
        );
    }

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {modules.map((m, idx) => {
                const doneCount = [
                    m.has_video ? m.is_video_watched : null,
                    m.has_document ? m.is_document_read : null,
                ].filter((v) => v !== null).length;
                const totalCount = [m.has_video, m.has_document].filter(
                    Boolean,
                ).length;

                return (
                    <div
                        key={m.module_id}
                        className={`rounded-xl border p-3 ${
                            m.is_completed
                                ? 'border-emerald-100 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/10'
                                : 'border-gray-100 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-900/20'
                        }`}
                    >
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-[10px] font-semibold text-gray-500 dark:border-gray-600 dark:bg-gray-800">
                                    {idx + 1}
                                </span>
                                <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                                    {m.module_title}
                                </span>
                            </div>
                            <span className="shrink-0 text-[10px] text-gray-400">
                                {doneCount}/{totalCount}
                            </span>
                        </div>

                        <div className="mb-2 flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                            {m.has_video && (
                                <span
                                    className={`flex items-center gap-1 ${m.is_video_watched ? 'text-emerald-500' : 'text-gray-400'}`}
                                >
                                    <PlayCircle className="h-3.5 w-3.5" /> Video
                                </span>
                            )}
                            {m.has_document && (
                                <span
                                    className={`flex items-center gap-1 ${m.is_document_read ? 'text-emerald-500' : 'text-gray-400'}`}
                                >
                                    <FileIcon className="h-3.5 w-3.5" /> Dokumen
                                </span>
                            )}
                            {m.has_text && (
                                <span
                                    className={`flex items-center gap-1 ${m.is_text_read ? 'text-emerald-500' : 'text-gray-400'}`}
                                >
                                    <FileText className="h-3.5 w-3.5" /> Teks
                                </span>
                            )}
                        </div>

                        {m.quizzes.map((q) => (
                            <div
                                key={q.quiz_id}
                                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 ${
                                    q.is_passed
                                        ? 'bg-emerald-50 dark:bg-emerald-950/20'
                                        : q.attempts_count > 0
                                          ? 'bg-red-50 dark:bg-red-950/20'
                                          : 'bg-gray-100 dark:bg-gray-700/40'
                                }`}
                            >
                                <div className="flex min-w-0 items-center gap-1.5">
                                    <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                                    <span className="truncate text-[11px] text-gray-600 dark:text-gray-300">
                                        {q.quiz_title}
                                    </span>
                                </div>
                                <span
                                    className={`shrink-0 text-[10px] font-semibold ${q.is_passed ? 'text-emerald-600' : q.attempts_count > 0 ? 'text-red-500' : 'text-gray-400'}`}
                                >
                                    {q.is_passed
                                        ? 'LULUS'
                                        : q.attempts_count > 0
                                          ? `${q.highest_score ?? 0}/${q.passing_score} \u00b7 ${q.attempts_count}x`
                                          : 'BELUM DIKERJAKAN'}
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

export default function StudentsIndex({
    summary_url,
    my_team,
    scope_label,
    scope_value,
    status_date,
    course_count,
    my_activity,
}: Props) {
    const teamJourneys = my_team.journeys;
    const activityJourneys = my_activity.journeys;
    const allActivityCourses = activityJourneys.flatMap((j) => j.courses);

    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
        () => activityJourneys[0]?.courses[0]?.course_id ?? null,
    );
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityModules, setActivityModules] = useState<ModuleProgress[]>(
        [],
    );

    const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(
        () => {
            if (typeof window === 'undefined') return null;
            const journeyParam = new URLSearchParams(
                window.location.search,
            ).get('journey');
            return journeyParam ? Number(journeyParam) : null;
        },
    );
    const selectedJourney =
        teamJourneys.find((j) => j.journey_id === selectedJourneyId) ?? null;

    const [selectedActivityJourneyId, setSelectedActivityJourneyId] = useState<
        number | null
    >(activityJourneys[0]?.journey_id ?? null);
    const selectedActivityJourney =
        activityJourneys.find(
            (j) => j.journey_id === selectedActivityJourneyId,
        ) ?? null;

    const visibleActivityCourses = selectedActivityJourney?.courses ?? [];

    // Scroll list Journey & Modul Saya di My Activity: tampilkan 6 data awal, tambah 6 lagi
    // tiap kali di-scroll mendekati bawah.
    const journeyListScroll = useVisibleCount(activityJourneys.length, 6);
    const courseListScroll = useVisibleCount(visibleActivityCourses.length, 6);

    const [onlineByDivision, setOnlineByDivision] = useState<
        Record<string, number>
    >(() => {
        const map: Record<string, number> = {};
        teamJourneys.forEach((j) =>
            j.courses.forEach((c) =>
                c.by_division.forEach((d) => {
                    map[d.division] = d.online;
                }),
            ),
        );
        return map;
    });

    const [activeUsersByJourney, setActiveUsersByJourney] = useState<
        Record<number, number>
    >(() => {
        const map: Record<number, number> = {};
        teamJourneys.forEach((j) => {
            map[j.journey_id] = j.active_users;
        });
        activityJourneys.forEach((j) => {
            map[j.journey_id] = j.active_users;
        });
        return map;
    });

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Summary', href: summary_url },
    ];

    const selectCourse = async (courseId: number) => {
        setSelectedCourseId(courseId);
        setActivityLoading(true);
        try {
            const res = await fetch('/summary/my-activity/' + courseId);
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
                const res = await fetch('/summary/online-counts', {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                setOnlineByDivision((prev) => ({ ...prev, ...data }));
            } catch {}
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
                const res = await fetch('/summary/journey-active-counts', {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok || cancelled) return;
                const data = await res.json();
                setActiveUsersByJourney((prev) => ({ ...prev, ...data }));
            } catch {}
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

            <div className="max-w-8xl mx-auto flex flex-col gap-6 px-4 py-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white px-5 py-4 shadow-sm sm:flex-row sm:items-center dark:border-sky-900 dark:from-sky-950 dark:to-gray-900">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-500 dark:bg-sky-900/50">
                            <LayoutGrid className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium tracking-widest text-sky-400 uppercase">
                                Report
                            </p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                Summary
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                                {course_count} modul dipantau
                            </p>
                        </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                        <p>
                            {scope_label}:{' '}
                            <span className="font-semibold text-gray-600 dark:text-gray-300">
                                {scope_value}
                            </span>
                        </p>
                        <p>Status Data: {status_date}</p>
                    </div>
                </div>

                <div>
                    <div className="mb-3 flex items-center gap-2">
                        {selectedJourney && (
                            <button
                                type="button"
                                onClick={() => setSelectedJourneyId(null)}
                                className="flex items-center gap-1 text-gray-400 transition hover:text-sky-500 dark:hover:text-sky-400"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        )}
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            My Team
                            {selectedJourney ? (
                                <span className="font-normal text-gray-400">
                                    {' '}
                                    &bull;{' '}
                                    {displayJourneyName(
                                        selectedJourney.journey_title,
                                    )}
                                </span>
                            ) : (
                                ''
                            )}
                        </p>
                    </div>

                    {teamJourneys.length === 0 ? (
                        <div className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-gray-400 shadow-sm dark:bg-gray-800">
                            Belum ada journey dengan modul yang bisa ditampilkan
                            untuk tim Anda.
                        </div>
                    ) : !selectedJourney ? (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {teamJourneys.map((j) => (
                                <MyTeamJourneyCard
                                    key={j.journey_id}
                                    journey={j}
                                    onOpen={() =>
                                        setSelectedJourneyId(j.journey_id)
                                    }
                                />
                            ))}
                        </div>
                    ) : selectedJourney.courses.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white px-4 py-16 text-center shadow-sm dark:bg-gray-800">
                            <Inbox className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm text-gray-400">
                                Belum ada modul yang tersedia.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {selectedJourney.courses.map((c) => (
                                <MyTeamCourseCard
                                    key={c.course_id}
                                    course={c}
                                    summaryUrl={summary_url}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {!selectedJourney && (
                    <div>
                        <p className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                            My Activity
                        </p>

                        {activityJourneys.length === 0 ? (
                            <div className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-gray-400 shadow-sm dark:bg-gray-800">
                                Tidak ada journey mandatory untuk divisi Anda.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[220px_300px_1fr]">
                                {/* Kiri: daftar Journey */}
                                <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800">
                                    <ListCardHeader
                                        icon={<Map className="h-4 w-4" />}
                                        eyebrow="Mandatory"
                                        title="Journey"
                                    />
                                    <div
                                        className="max-h-[480px] divide-y divide-gray-50 overflow-y-auto dark:divide-gray-700"
                                        onScroll={
                                            journeyListScroll.handleScroll
                                        }
                                    >
                                        {activityJourneys
                                            .slice(
                                                0,
                                                journeyListScroll.visibleCount,
                                            )
                                            .map((j) => {
                                                const active =
                                                    j.journey_id ===
                                                    selectedActivityJourneyId;
                                                return (
                                                    <button
                                                        key={j.journey_id}
                                                        type="button"
                                                        onClick={() =>
                                                            selectActivityJourney(
                                                                j,
                                                            )
                                                        }
                                                        className={`w-full px-4 py-3 text-left transition-colors ${
                                                            active
                                                                ? 'bg-sky-50 dark:bg-sky-950/20'
                                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'
                                                        }`}
                                                    >
                                                        <p
                                                            className={`truncate text-sm font-semibold ${active ? 'text-sky-700 dark:text-sky-400' : 'text-gray-700 dark:text-gray-200'}`}
                                                        >
                                                            {displayJourneyName(
                                                                j.journey_title,
                                                            )}
                                                        </p>
                                                        <p className="mt-0.5 text-[11px] text-gray-400">
                                                            {j.completed_count}/
                                                            {j.total_courses}{' '}
                                                            selesai
                                                        </p>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* Tengah: daftar Course milik journey yang dipilih */}
                                <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800">
                                    <ListCardHeader
                                        icon={
                                            <CheckCircle2 className="h-4 w-4" />
                                        }
                                        eyebrow="Journey Mandatory"
                                        title="Modul Saya"
                                    />
                                    <div
                                        className="max-h-[480px] divide-y divide-gray-50 overflow-y-auto dark:divide-gray-700"
                                        onScroll={courseListScroll.handleScroll}
                                    >
                                        {visibleActivityCourses.length === 0 ? (
                                            <p className="px-4 py-8 text-center text-sm text-gray-400">
                                                Tidak ada modul mandatory.
                                            </p>
                                        ) : (
                                            visibleActivityCourses
                                                .slice(
                                                    0,
                                                    courseListScroll.visibleCount,
                                                )
                                                .map((c) => {
                                                    const active =
                                                        c.course_id ===
                                                        selectedCourseId;
                                                    const statusText =
                                                        c.status === 'completed'
                                                            ? 'Selesai'
                                                            : c.status ===
                                                                'in_progress'
                                                              ? 'Sedang dikerjakan'
                                                              : 'Belum dimulai';
                                                    return (
                                                        <button
                                                            key={c.course_id}
                                                            type="button"
                                                            onClick={() =>
                                                                selectCourse(
                                                                    c.course_id,
                                                                )
                                                            }
                                                            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                                                                active
                                                                    ? 'bg-sky-50 dark:bg-sky-950/20'
                                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/20'
                                                            }`}
                                                        >
                                                            <div className="min-w-0">
                                                                <p
                                                                    className={`truncate text-sm font-semibold ${active ? 'text-sky-700 dark:text-sky-400' : 'text-gray-700 dark:text-gray-200'}`}
                                                                >
                                                                    {c.title}
                                                                </p>
                                                                <p className="mt-0.5 text-[11px] text-gray-400">
                                                                    {statusText}
                                                                </p>
                                                            </div>
                                                            <div className="shrink-0">
                                                                {c.status ===
                                                                'completed' ? (
                                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                                                ) : c.status ===
                                                                  'in_progress' ? (
                                                                    <span className="text-xs font-bold text-amber-500">
                                                                        {
                                                                            c.progress_percentage
                                                                        }
                                                                        %
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-sm font-bold text-gray-300">
                                                                        &mdash;
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>

                                {/* Kanan: Detail Progress modul dari course yang dipilih */}
                                <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800">
                                    <ListCardHeader
                                        icon={
                                            <LayoutGrid className="h-4 w-4" />
                                        }
                                        eyebrow="Detail Progress"
                                        title={
                                            allActivityCourses.find(
                                                (c) =>
                                                    c.course_id ===
                                                    selectedCourseId,
                                            )?.title ?? '-'
                                        }
                                    />
                                    <div className="p-4">
                                        {activityLoading ? (
                                            <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
                                                <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                                Memuat materi training...
                                            </div>
                                        ) : (
                                            <ModulesDetail
                                                modules={activityModules}
                                            />
                                        )}

                                        {selectedActivityJourney && (
                                            <ActivityJourneyActiveUsers
                                                journey={
                                                    selectedActivityJourney
                                                }
                                                liveActiveCount={
                                                    activeUsersByJourney[
                                                        selectedActivityJourney
                                                            .journey_id
                                                    ]
                                                }
                                            />
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

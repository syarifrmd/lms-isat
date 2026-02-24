import { type SharedData, type UserCourseCalendar, type UserDashboardData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BarChart3,
    BookMarked,
    BookOpen,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Flame,
    GraduationCap,
    LayoutDashboard,
    MapPin,
    Star,
    TrendingUp,
    Trophy,
    User,
} from 'lucide-react';
import { useState } from 'react';

interface UserDashboardProps {
    data?: UserDashboardData;
}

function getCategoryBadge(cat: string | null | undefined) {
    const map: Record<string, string> = {
        Programming: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        Design:      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        Business:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        Marketing:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    return cat ? (map[cat] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400') : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
}

/* Avatar dengan inisial */
function AvatarFallback({ name }: { name: string }) {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0]?.toUpperCase() ?? '')
        .join('');
    return (
        <div className="flex h-full w-full items-center justify-center rounded-full
                        bg-linear-to-br from-orange-400 to-amber-500 text-white font-bold text-xl select-none">
            {initials}
        </div>
    );
}

/// Kalendar
const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const NAMA_BULAN   = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

const DOT_COLORS = [
    'bg-blue-500',
    'bg-orange-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-pink-500',
    'bg-amber-500',
];

function MiniCalendar({ courses }: { courses: UserCourseCalendar[] }) {
    const today = new Date();
    const [cur, setCur] = useState({ year: today.getFullYear(), month: today.getMonth() });

    const prev = () => setCur(c => ({
        year : c.month === 0 ? c.year - 1 : c.year,
        month: c.month === 0 ? 11 : c.month - 1,
    }));
    const next = () => setCur(c => ({
        year : c.month === 11 ? c.year + 1 : c.year,
        month: c.month === 11 ? 0 : c.month + 1,
    }));

    const firstDay    = new Date(cur.year, cur.month, 1).getDay();
    const daysInMonth = new Date(cur.year, cur.month + 1, 0).getDate();

    const rawCells: (number | null)[] = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (rawCells.length % 7 !== 0) rawCells.push(null);

    /* Group into rows of 7 */
    const rows: (number | null)[][] = [];
    for (let i = 0; i < rawCells.length; i += 7) rows.push(rawCells.slice(i, i + 7));

    const todayD = today.getDate();
    const isCurrentMonth = cur.month === today.getMonth() && cur.year === today.getFullYear();
    const isToday = (d: number) => isCurrentMonth && d === todayD;

    /* Find which row index contains today */
    const todayRowIdx = isCurrentMonth
        ? rows.findIndex(row => row.includes(todayD))
        : -1;

    /* All courses active on a given date (can be multiple) */
    const getCoursesForDate = (d: number): UserCourseCalendar[] => {
        const dateStr = `${cur.year}-${String(cur.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return courses.filter(c => {
            const start = c.start_date ?? null;
            const end   = c.end_date   ?? null;
            return (start || end) &&
                (!start || dateStr >= start) &&
                (!end   || dateStr <= end);
        });
    };

    return (
        <div className="flex flex-col gap-2">
            {/* Header navigasi */}
            <div className="flex items-center justify-between mb-1">
                <button onClick={prev}
                        className="flex h-7 w-7 items-center justify-center rounded-lg
                                   text-muted-foreground hover:bg-muted transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold text-foreground">
                    {NAMA_BULAN[cur.month]} {cur.year}
                </span>
                <button onClick={next}
                        className="flex h-7 w-7 items-center justify-center rounded-lg
                                   text-muted-foreground hover:bg-muted transition-colors">
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Nama hari */}
            <div className="grid grid-cols-7 text-center mb-0.5">
                {HARI_SINGKAT.map(h => (
                    <span key={h} className="text-[9px] font-semibold text-muted-foreground">{h}</span>
                ))}
            </div>

            {/* Baris tanggal */}
            {rows.map((row, rowIdx) => (
                <div
                    key={rowIdx}
                    className={`grid grid-cols-7 rounded-xl transition-colors ${
                        rowIdx === todayRowIdx
                            ? 'bg-blue-50 dark:bg-blue-950/30'
                            : ''
                    }`}
                >
                    {row.map((d, colIdx) => {
                        if (!d) return <div key={colIdx} className="h-10" />;

                        const activeCourses = getCoursesForDate(d);
                        const today_        = isToday(d);
                        const maxDots       = 3;
                        const visibleDots   = activeCourses.slice(0, maxDots);
                        const extraDots     = activeCourses.length - maxDots;

                        return (
                            <div key={colIdx} className="group relative flex flex-col items-center justify-center h-10">
                                {/* Nomor tanggal */}
                                <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors
                                    ${today_
                                        ? 'bg-blue-500 text-white font-bold shadow'
                                        : 'text-foreground group-hover:bg-muted cursor-default'
                                    }`}>
                                    {d}
                                </span>

                                {/* Dot indikator */}
                                {activeCourses.length > 0 && (
                                    <div className="flex items-center gap-0.75 mt-0.5 h-2">
                                        {visibleDots.map((c, di) => (
                                            <span
                                                key={di}
                                                className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[c.color_index]}`}
                                            />
                                        ))}
                                        {extraDots > 0 && (
                                            <span className="text-[7px] font-bold text-muted-foreground leading-none">
                                                +{extraDots}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Tooltip */}
                                {activeCourses.length > 0 && (
                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                                                    z-50 hidden group-hover:block
                                                    min-w-max max-w-52 rounded-lg border border-border/60
                                                    bg-popover px-3 py-2 shadow-lg">
                                        <div className="flex flex-col gap-1.5">
                                            {activeCourses.map((c, ti) => (
                                                <div key={ti} className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLORS[c.color_index]}`}/>
                                                    <p className="text-[10px] font-medium text-popover-foreground leading-snug">
                                                        {c.title}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <span className="absolute top-full left-1/2 -translate-x-1/2
                                                         border-[5px] border-transparent border-t-border/60" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Legenda course */}
            {courses.length > 0 && (
                <div className="mt-1 flex flex-col gap-1 border-t border-border/40 pt-2">
                    {courses.slice(0, 5).map(c => (
                        <div key={c.course_id} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLORS[c.color_index]}`}/>
                            <span className="truncate">{c.title}</span>
                        </div>
                    ))}
                    {courses.length > 5 && (
                        <p className="text-[10px] text-muted-foreground">+{courses.length - 5} kursus lainnya</p>
                    )}
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════
   Komponen utama
══════════════════════════════════════════════ */
export default function UserDashboard({ data }: UserDashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const stats          = data?.stats;
    const activeCourses  = data?.active_courses   ?? [];
    const recentAttempts = data?.recent_attempts  ?? [];
    const weeklyProgress = data?.weekly_progress  ?? [];
    const courseCalendar = data?.course_calendar  ?? [];

    const maxMinutes = Math.max(...weeklyProgress.map(w => w.minutes), 1);

    /** Format menit ke tampilan manusiawi: "45 mnt" / "1 jam 30 mnt" / "2 jam" */
    const formatDuration = (mins: number): string => {
        if (mins <= 0) return '–';
        if (mins < 60) return `${mins} mnt`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m === 0 ? `${h} jam` : `${h} jam ${m} mnt`;
    };

    const statCards = [
        { label: 'Terdaftar',    value: stats?.enrolled_courses  ?? 0, icon: BookOpen,     color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-100 dark:border-blue-800/40' },
        { label: 'Selesai',      value: stats?.completed_courses ?? 0, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/40' },
        { label: 'Kuis',         value: stats?.quiz_attempts     ?? 0, icon: ClipboardList, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800/40' },
        { label: 'Sertifikat',   value: stats?.certificates      ?? 0, icon: GraduationCap, color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-100 dark:border-amber-800/40' },
    ];

    const quickLinks = [
        { label: 'Jelajahi Kursus',  href: '/courses',      icon: BookOpen,      color: 'bg-blue-500' },
        { label: 'Sertifikat Saya',  href: '/certificates', icon: GraduationCap, color: 'bg-amber-500' },
        { label: 'Papan Peringkat',  href: '/leaderboard',  icon: Trophy,        color: 'bg-purple-500' },
        { label: 'Progres Saya',     href: '/courses',      icon: BarChart3,     color: 'bg-emerald-500' },
    ];

    const jam  = new Date().getHours();
    const sapa = jam < 12 ? 'Selamat Pagi,' : jam < 17 ? 'Selamat Siang,' : 'Selamat Malam,';

    const upcomingCourses = activeCourses.slice(0, 3);

    return (
        <div className="flex gap-6 items-start min-w-0">

            {/* ═══════════════════════════════════════
                KIRI — Konten utama (flex-1 ≈70%)
            ═══════════════════════════════════════ */}
            <div className="flex flex-1 min-w-0 flex-col gap-6">

                {/* Banner sapaan */}
                <div className="flex flex-col gap-3 rounded-2xl border border-border/60
                                bg-linear-to-br from-orange-50 via-white to-amber-50
                                dark:from-orange-950/30 dark:via-background dark:to-amber-950/20
                                px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-0.5 min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">{sapa}</p>
                            <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">{user.name}</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                                Teruslah belajar! setiap modul adalah langkah maju.
                            </p>
                        </div>
                        {/* Avatar ringkas di mobile */}
                        <div className="sm:hidden h-10 w-10 shrink-0 rounded-full overflow-hidden ring-2 ring-orange-200">
                            {user.avatar
                                ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                : <AvatarFallback name={user.name} />}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-white
                                        px-3 py-2 dark:border-amber-800/50 dark:bg-amber-900/10 shadow-sm">
                            <Flame className="h-4 w-4 text-orange-500" />
                            <div className="flex items-center gap-1 leading-tight">
                                <span className="text-xs text-muted-foreground">XP</span>
                                <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                    {stats?.xp?.toLocaleString('id-ID') ?? 0}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-white
                                        px-3 py-2 dark:border-violet-800/50 dark:bg-violet-900/10 shadow-sm">
                            <Trophy className="h-4 w-4 text-violet-500" />
                            <div className="flex items-center gap-1 leading-tight">
                                <span className="text-xs text-muted-foreground">Peringkat</span>
                                <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                                    #{stats?.rank ?? '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kartu statistik */}
                <div className="grid px-4 grid-cols-2 gap-4 sm:grid-cols-4">
                    {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
                        <div key={label}
                             className={`flex flex-col gap-3 rounded-2xl border ${border} ${bg} px-5 py-4 shadow-sm`}>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl
                                            bg-white dark:bg-background/60 shadow-sm">
                                <Icon className={`h-5 w-5 ${color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{value}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Aktivitas mingguan + Aksi cepat */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* Bar chart jam belajar */}
                    <div className="lg:col-span-2 flex flex-col gap-4 rounded-2xl border border-border/60
                                    bg-card px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 shrink-0" />
                                <h2 className="text-sm sm:text-base font-semibold text-foreground truncate">Aktivitas Mingguan</h2>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-1
                                             text-[10px] sm:text-xs font-medium text-orange-600
                                             dark:bg-orange-900/20 dark:text-orange-400">
                                <Flame className="h-3 w-3" />
                                <span className="hidden sm:inline">7 hari terakhir</span>
                                <span className="sm:hidden">7 hari</span>
                            </span>
                        </div>

                        <div className="flex gap-1.5 h-28">
                            {weeklyProgress.map((w, i) => {
                                const pct     = maxMinutes > 0 ? Math.max((w.minutes / maxMinutes) * 100, w.minutes > 0 ? 5 : 2) : 2;
                                const isToday = i === weeklyProgress.length - 1;
                                return (
                                    <div key={w.date} className="group relative flex flex-1 flex-col justify-end h-full">
                                        {/* Tooltip - absolute di atas bar */}
                                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
                                                        hidden group-hover:block z-20
                                                        bg-popover border border-border rounded-lg px-2 py-1 shadow-md
                                                        text-[10px] font-semibold text-foreground whitespace-nowrap">
                                            {formatDuration(w.minutes)}
                                        </div>
                                        {/* Bar tumbuh ke atas dari dasar */}
                                        <div
                                            className={`w-full rounded-t-md transition-all duration-500 ${
                                                isToday         ? 'bg-orange-400 dark:bg-orange-500'
                                                : w.minutes > 0 ? 'bg-blue-300 dark:bg-blue-700/70'
                                                : 'bg-muted'
                                            }`}
                                            style={{ height: `${pct}%` }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Label hari di bawah bar */}
                        <div className="flex gap-1.5">
                            {weeklyProgress.map((w, i) => (
                                <span key={i} className={`flex-1 text-center text-[10px] font-medium ${
                                    i === weeklyProgress.length - 1
                                        ? 'text-orange-500 dark:text-orange-400'
                                        : 'text-muted-foreground'
                                }`}>
                                    {w.day}
                                </span>
                            ))}
                        </div>

                        {/* Keterangan total minggu ini */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1 text-xs text-muted-foreground border-t border-border/40">
                            <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
                                {[
                                    { label: 'Hari ini',     cls: 'bg-orange-400 dark:bg-orange-500' },
                                    { label: 'Hari lainnya', cls: 'bg-blue-300 dark:bg-blue-700/70' },
                                    { label: 'Tidak aktif',  cls: 'bg-muted' },
                                ].map(({ label, cls }) => (
                                    <span key={label} className="flex items-center gap-1">
                                        <span className={`inline-block h-2 w-2 rounded-sm ${cls}`} />
                                        {label}
                                    </span>
                                ))}
                            </div>
                            <span className="font-semibold text-foreground">
                                Total: {formatDuration(weeklyProgress.reduce((s, w) => s + w.minutes, 0))}
                            </span>
                        </div>
                    </div>

                    {/* Aksi cepat */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
                        <div className="flex items-center gap-2">
                            <LayoutDashboard className="h-5 w-5 text-violet-500" />
                            <h2 className="text-base font-semibold text-foreground">Aksi Cepat</h2>
                        </div>
                        {/* Grid 2×2 di mobile, list di ≥lg */}
                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-3">
                            {quickLinks.map(({ label, href, icon: Icon, color }) => (
                                <Link key={label} href={href}
                                      className="flex items-center gap-2 sm:gap-3 rounded-xl border border-border/60
                                                 bg-background hover:bg-muted/60 px-3 py-2.5 sm:px-4 sm:py-3
                                                 transition-colors group">
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}>
                                        <Icon className="h-4 w-4 text-white" />
                                    </span>
                                    <span className="flex-1 text-xs sm:text-sm font-medium text-foreground leading-tight">{label}</span>
                                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform hidden sm:block" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Kursus aktif + Hasil kuis */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* Kursus aktif */}
                    <div className="lg:col-span-2 flex flex-col gap-4 rounded-2xl border border-border/60
                                    bg-card px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookMarked className="h-5 w-5 text-blue-500" />
                                <h2 className="text-base font-semibold text-foreground">Kursus Aktif</h2>
                            </div>
                            <Link href="/courses"
                                  className="flex items-center gap-1 text-xs font-medium text-orange-500
                                             hover:text-orange-600 dark:text-orange-400 transition-colors">
                                Lihat Semua <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        {activeCourses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                                <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                                <p className="text-sm font-medium text-muted-foreground">Belum ada kursus aktif</p>
                                <Link href="/courses"
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2
                                                 text-sm font-semibold text-white hover:bg-orange-600 transition-colors">
                                    <BookOpen className="h-4 w-4" />
                                    Jelajahi Kursus
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {activeCourses.map(course => (
                                    <Link key={course.course_id} href={`/courses/${course.course_id}`}
                                          className="group flex items-start gap-3 rounded-xl border border-border/60
                                                     bg-background/50 hover:bg-muted/40 px-3 py-3 sm:px-4 sm:py-3.5 transition-colors">
                                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center
                                                        rounded-xl bg-linear-to-br from-blue-100 to-blue-200
                                                        dark:from-blue-900/30 dark:to-blue-800/30 overflow-hidden">
                                            {course.cover_url
                                                ? <img src={course.cover_url} alt={course.title} className="h-full w-full object-cover" />
                                                : <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
                                        </div>
                                        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
                                            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                                                <p className="truncate text-sm font-semibold text-foreground">{course.title}</p>
                                                {course.category && (
                                                    <span className={`self-start sm:shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getCategoryBadge(course.category)}`}>
                                                        {course.category}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                Oleh {course.creator_name} · Daftar {course.enrolled_at}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 overflow-hidden rounded-full bg-muted h-1.5">
                                                    <div className="h-full rounded-full bg-linear-to-r from-blue-400 to-blue-600 transition-all"
                                                         style={{ width: `${course.progress}%` }} />
                                                </div>
                                                <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                                                    {Math.round(course.progress)}%
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform mt-1" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Hasil kuis terbaru */}
                    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-amber-500" />
                                <h2 className="text-base font-semibold text-foreground">Kuis Terakhir</h2>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {stats?.passed_quizzes ?? 0}/{stats?.quiz_attempts ?? 0} lulus
                            </span>
                        </div>

                        {recentAttempts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                                <ClipboardList className="h-9 w-9 text-muted-foreground/40" />
                                <p className="text-xs text-muted-foreground">Belum ada percobaan kuis.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {recentAttempts.map((attempt, idx) => (
                                    <div key={idx} className="flex items-start gap-3 rounded-xl border border-border/50
                                                              bg-background/50 px-3.5 py-3">
                                        <div className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl ${
                                            attempt.is_passed
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'bg-red-50 dark:bg-red-900/20'}`}>
                                            <span className={`text-xs font-bold leading-tight ${
                                                attempt.is_passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {Math.round(attempt.score)}
                                            </span>
                                            <Star className={`h-2.5 w-2.5 ${attempt.is_passed ? 'text-emerald-500' : 'text-red-400'}`} fill="currentColor" />
                                        </div>
                                        <div className="flex min-w-0 flex-col gap-0.5">
                                            <p className="truncate text-xs font-semibold text-foreground">{attempt.quiz_title}</p>
                                            <p className="truncate text-[10px] text-muted-foreground">{attempt.course_title}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                                                    attempt.is_passed
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {attempt.is_passed ? 'Lulus' : 'Tidak Lulus'}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground">{attempt.submitted_at}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(stats?.quiz_attempts ?? 0) > 0 && (
                            <div className="mt-auto pt-2 border-t border-border/40">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs text-muted-foreground">Tingkat Kelulusan</span>
                                    <span className="text-xs font-semibold text-foreground">
                                        {Math.round(((stats?.passed_quizzes ?? 0) / (stats?.quiz_attempts ?? 1)) * 100)}%
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all"
                                         style={{ width: `${Math.round(((stats?.passed_quizzes ?? 0) / (stats?.quiz_attempts ?? 1)) * 100)}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Empty state untuk pengguna baru */}
                {(stats?.enrolled_courses ?? 0) === 0 && (
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-orange-200
                                    bg-orange-50/50 dark:border-orange-800/30 dark:bg-orange-950/10 px-6 py-10 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30">
                            <BookOpen className="h-7 w-7 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-foreground">Mulai perjalanan belajarmu</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Jelajahi kursus yang tersedia dan daftar untuk mulai melacak progresmu.
                            </p>
                        </div>
                        <Link href="/courses"
                              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5
                                         text-sm font-semibold text-white hover:bg-orange-600 transition-colors">
                            <BookOpen className="h-4 w-4" />
                            Jelajahi Kursus
                        </Link>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════
                KANAN — Sidebar profil (≈30%, xl:block)
            ═══════════════════════════════════════ */}
            <aside className="hidden xl:flex w-74 shrink-0 flex-col gap-4">

                {/* Kartu profil */}
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60
                                bg-card px-5 py-6 shadow-sm">
                    <div className="relative h-20 w-20 rounded-full ring-4 ring-orange-100 dark:ring-orange-900/30 overflow-hidden">
                        {user.avatar
                            ? <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                            : <AvatarFallback name={user.name} />}
                    </div>

                    <div className="flex flex-col items-center gap-0.5 text-center">
                        <h2 className="text-base font-bold text-foreground">{user.name}</h2>
                        <p className="text-xs text-muted-foreground">
                            {user.email ? `@${user.email.split('@')[0]}` : `#${user.id}`}
                        </p>
                    </div>

                    <div className="w-full rounded-xl border border-border/60 divide-y divide-border/60 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" /> Peran
                            </span>
                            <span className="text-xs font-semibold text-foreground capitalize">{user.role}</span>
                        </div>
                        {user.region && (
                            <div className="flex items-center justify-between px-4 py-2.5">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" /> Region
                                </span>
                                <span className="text-xs font-semibold text-foreground">{String(user.region)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Flame className="h-3.5 w-3.5 text-orange-400" /> XP
                            </span>
                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                                {stats?.xp?.toLocaleString('id-ID') ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Trophy className="h-3.5 w-3.5 text-violet-400" /> Peringkat
                            </span>
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                #{stats?.rank ?? '—'}
                            </span>
                        </div>
                    </div>

                    <Link href="/settings/profile"
                          className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 py-2.5 text-center
                                     text-sm font-semibold text-white transition-colors shadow-sm">
                        Edit Profil
                    </Link>
                </div>

                {/* Kalender dengan range kursus */}
                <div className="rounded-2xl border border-border/60 bg-card px-5 py-5 shadow-sm">
                    <MiniCalendar courses={courseCalendar} />
                </div>

                {/* Kursus sedang berjalan */}
                <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-5 py-5 shadow-sm">
                    <div className="flex items-center gap-2">
                        <BookMarked className="h-4 w-4 text-blue-500" />
                        <h3 className="text-sm font-semibold text-foreground">Sedang Berjalan</h3>
                    </div>

                    {upcomingCourses.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            Belum ada kursus yang sedang berjalan.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {upcomingCourses.map(course => (
                                <Link key={course.course_id} href={`/courses/${course.course_id}`}
                                      className="flex items-center gap-3 rounded-xl border border-border/50
                                                 bg-background/50 hover:bg-muted/40 px-3 py-2.5 transition-colors group">
                                    <div className="w-1 self-stretch rounded-full bg-blue-400 dark:bg-blue-500 shrink-0" />
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center
                                                    rounded-lg bg-blue-50 dark:bg-blue-900/20 overflow-hidden">
                                        {course.cover_url
                                            ? <img src={course.cover_url} alt={course.title} className="h-full w-full object-cover rounded-lg" />
                                            : <BookOpen className="h-4 w-4 text-blue-500" />}
                                    </div>
                                    <div className="flex min-w-0 flex-col gap-0.5">
                                        <p className="truncate text-xs font-semibold text-foreground leading-tight">
                                            {course.title}
                                        </p>
                                        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                                                course.progress > 0 ? 'bg-emerald-400' : 'bg-amber-400'
                                            }`}/>
                                            {course.progress > 0 ? 'Sedang Berjalan' : 'Baru Mulai'} · {Math.round(course.progress)}%
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}

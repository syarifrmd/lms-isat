import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Award,
    BookOpen,
    CheckCircle,
    ChevronRight,
    GraduationCap,
    Settings,
    Star,
    TrendingUp,
    Users,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
    total_users: number;
    total_trainers: number;
    total_students: number;
    total_courses: number;
    total_enrollments: number;
    completed_enrollments: number;
    completion_rate: number;
    platform_avg_rating: number | null;
}

interface PopularCourse {
    id: number;
    title: string;
    status: string;
    enrollments_count: number;
    creator_name: string;
    average_rating: number | null;
}

interface RecentEnrollment {
    course_title: string;
    user_name: string;
    status: string;
    progress: number;
    enrolled_at: string;
}

interface TrainerStat {
    trainer_name: string;
    student_total: number;
}

interface AdminData {
    stats: AdminStats;
    courses_by_status: Record<string, number>;
    popular_courses: PopularCourse[];
    monthly_enrollments: Record<string, number>;
    recent_enrollments: RecentEnrollment[];
    trainer_stats: TrainerStat[];
}

interface AdminDashboardProps {
    data?: AdminData;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
    published: { label: 'Published', color: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
    draft:     { label: 'Draft',     color: 'text-amber-700 dark:text-amber-400',    bar: 'bg-amber-400'  },
    archived:  { label: 'Archived',  color: 'text-gray-600 dark:text-gray-400',      bar: 'bg-gray-400'   },
};

const ENROLL_STATUS_CONFIG: Record<string, string> = {
    active:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    dropped:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function formatMonth(key: string) {
    const [year, month] = key.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
}

function toMonthKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function getLastSixMonthsSeries(raw: Record<string, number>) {
    const now = new Date();
    const months: string[] = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(toMonthKey(d));
    }

    return months.map((key) => [key, raw[key] ?? 0] as const);
}



// ── Subcomponents ─────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    tone = 'default',
    icon: Icon,
    iconBg,
    iconColor,
    borderColor,
}: {
    label: string;
    value: string | number;
    tone?: 'default' | 'highlight';
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    borderColor: string;
}) {
    const iconWrapperClass = tone === 'highlight'
        ? `${iconBg} group-hover:border-white/20 group-hover:bg-white/10`
        : iconBg;
    const iconColorClass = tone === 'highlight'
        ? `${iconColor} group-hover:text-white`
        : iconColor;

    return (
        <div className={`group relative h-full overflow-hidden rounded-[22px] border p-4 font-sans shadow-sm transition-all hover:shadow-md ${tone === 'highlight'
            ? 'border-gray-100 bg-white hover:border-red-700/20 hover:bg-linear-to-br hover:from-red-600 hover:via-red-500 hover:to-red-500 hover:text-white hover:shadow-red-950/10 dark:border-white/10 dark:bg-neutral-900'
            : `bg-white ${borderColor} dark:bg-neutral-900`
        }`}>
            <div className="flex h-full min-h-33 flex-col">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${tone === 'highlight' ? 'text-gray-700 group-hover:text-white/90 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>
                            {label}
                        </p>
                    </div>
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${iconWrapperClass}`}>
                        <Icon className={`h-4.5 w-4.5 ${iconColorClass}`} />
                    </div>
                </div>

                <div className="mt-4 flex flex-1 items-end">
                    <p className={`text-[2.05rem] font-semibold leading-none tracking-tight ${tone === 'highlight' ? 'text-gray-950 group-hover:text-white dark:text-white' : 'text-gray-950 dark:text-white'}`}>
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminDashboard({ data }: AdminDashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const stats = data?.stats;



    // Monthly enrollments bar chart
    const monthlyData = getLastSixMonthsSeries(data?.monthly_enrollments ?? {});
    const maxMonthly = Math.max(...monthlyData.map(([, v]) => v), 1);

    // Course status distribution
    const statusEntries = Object.entries(data?.courses_by_status ?? {});
    const totalCoursesForBar = statusEntries.reduce((s, [, v]) => s + v, 0) || 1;

    // Quick links
    const quickLinks = [
        { label: 'Settings',       href: '/settings',    icon: Settings },
    ];

    return (
        <div className="space-y-8 p-4 md:p-6">

            {/* ── Hero ── */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-red-500 to-red-700 p-6 md:p-8 text-white shadow-lg">
                <div className="relative z-10 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-white">Admin Portal</p>
                        <h1 className="mt-1 text-2xl md:text-3xl font-bold leading-tight">
                            {user.full_name || user.name}
                        </h1>
                    </div>
                    <div className="flex items-center justify-center rounded-2xl">
                      <img 
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        alt={user.name}
                        className="h-14 w-14 shrink-0 rounded-full border-2 border-yellow-400 object-cover md:h-20 md:w-20"
                      />
                    </div>
                </div>
                {/* Quick links */}
                <div className="relative z-10 mt-6 flex flex-wrap gap-2">
                    {quickLinks.map(({ label, href, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/20"
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </Link>
                    ))}
                </div>
                {/* Decorative */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-red-100/20" />
                <div className="pointer-events-none absolute -bottom-12 -right-4 h-64 w-64 rounded-full bg-red-100/20" />
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 items-stretch gap-4 md:grid-cols-3 xl:grid-cols-7">
                <StatCard
                    label="Total Users"
                    value={stats?.total_users ?? 0}
                    tone="highlight"
                    icon={Users}
                    iconBg="border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-800"
                    iconColor="text-red-500 dark:text-red-400"
                    borderColor="border-transparent"
                />
                <StatCard
                    label="Trainers"
                    value={stats?.total_trainers ?? 0}
                    tone="highlight"
                    icon={Award}
                    iconBg="border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-800"
                    iconColor="text-red-500 dark:text-red-400"
                    borderColor="border-gray-100 dark:border-white/10"
                />
                <StatCard
                    label="Students"
                    value={stats?.total_students ?? 0}
                    tone="highlight"
                    icon={GraduationCap}
                    iconBg="border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-800"
                    iconColor="text-red-500 dark:text-red-400"
                    borderColor="border-gray-100 dark:border-white/10"
                />
                <StatCard
                    label="Total Courses"
                    value={stats?.total_courses ?? 0}
                    tone="highlight"
                    icon={BookOpen}
                    iconBg="border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-800"
                    iconColor="text-red-500 dark:text-red-400"
                    borderColor="border-gray-100 dark:border-white/10"
                />
                <StatCard
                    label="Enrollments"
                    value={stats?.total_enrollments ?? 0}
                    tone="highlight"
                    icon={Activity}
                    iconBg="border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-800"
                    iconColor="text-red-500 dark:text-red-400"
                    borderColor="border-gray-100 dark:border-white/10"
                />
                <StatCard
                    label="Completion Rate"
                    value={`${stats?.completion_rate ?? 0}%`}
                    tone="highlight"
                    icon={CheckCircle}
                    iconBg="border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-800"
                    iconColor="text-red-500 dark:text-red-400"
                    borderColor="border-gray-100 dark:border-white/10"
                />
                <StatCard
                    label="Avg Platform Rating"
                    value={stats?.platform_avg_rating ? `${stats.platform_avg_rating} / 5` : 'No ratings'}
                    tone="highlight"
                    icon={Star}
                    iconBg="border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-800"
                    iconColor="text-red-500 dark:text-red-400"
                    borderColor="border-gray-100 dark:border-white/10"
                />
            </div>

            {/* ── Mid Row: Enrollment Chart + Course Status ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                {/* Monthly Enrollment Bar Chart (2/3 width) */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white dark:border-white/8 dark:bg-neutral-900 p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Enrollments</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">Past 6 months</p>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                    <div className="grid h-40 grid-cols-6 items-end gap-3">
                        {monthlyData.map(([key, val]) => {
                            const pct = Math.round((val / maxMonthly) * 100);
                            const barHeight = val > 0 ? Math.max(pct, 8) : 0;
                            return (
                                <div key={key} className="group flex h-full flex-col items-center justify-end gap-2">
                                    <div className="relative flex w-full flex-1 items-end">
                                        <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded-md bg-gray-900 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white dark:text-gray-900">
                                            {val}
                                        </span>
                                        <div className="relative h-27.5 w-full overflow-hidden rounded-md">
                                            <div className="absolute bottom-0 h-px w-full bg-blue-100 dark:bg-blue-900/30" />
                                            <div
                                                className="absolute bottom-0 w-full rounded-md bg-blue-500 transition-all duration-500 dark:bg-blue-600"
                                                style={{ height: `${barHeight}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{formatMonth(key)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Course Status Distribution (1/3 width) */}
                <div className="rounded-2xl border border-gray-100 bg-white dark:border-white/8 dark:bg-neutral-900 p-6 shadow-sm">
                    <div className="mb-5">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Course Status</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">{totalCoursesForBar} total courses</p>
                    </div>
                    <div className="space-y-4">
                        {statusEntries.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No courses found.</p>
                        ) : (
                            statusEntries.map(([status, count]) => {
                                const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'text-gray-600', bar: 'bg-gray-400' };
                                const pct = Math.round((count / totalCoursesForBar) * 100);
                                return (
                                    <div key={status} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {count} <span className="font-normal text-muted-foreground">({pct}%)</span>
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                                            <div
                                                className={`h-full rounded-full ${cfg.bar} transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* ── Bottom Row: Popular Courses + Recent Enrollments ── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

                {/* Popular Courses */}
                <div className="rounded-2xl border border-gray-100 bg-white dark:border-white/8 dark:bg-neutral-900 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/8">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Top Courses</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">By enrollment count</p>
                        </div>
                        <Link
                            href="/courses"
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                            View all
                            <ChevronRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-white/5">
                        {(data?.popular_courses ?? []).length === 0 ? (
                            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No courses found.</p>
                        ) : (
                            (data?.popular_courses ?? []).map((course, i) => {
                                const cfg = STATUS_CONFIG[course.status] ?? STATUS_CONFIG.draft;
                                return (
                                    <Link
                                        key={course.id}
                                        href={`/courses/${course.id}`}
                                        className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
                                            {i + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {course.title}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">by {course.creator_name}</p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                                            {course.average_rating !== null && course.average_rating !== undefined && (
                                                <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                    {course.average_rating}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                <Users className="h-3 w-3" />
                                                {course.enrollments_count}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent Enrollments */}
                <div className="rounded-2xl border border-gray-100 bg-white dark:border-white/8 dark:bg-neutral-900 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/8">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Enrollments</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">Latest student activity</p>
                        </div>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-white/5">
                        {(data?.recent_enrollments ?? []).length === 0 ? (
                            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No enrollments yet.</p>
                        ) : (
                            (data?.recent_enrollments ?? []).map((e, i) => {
                                const rawStatus = e.status ?? 'active';
                                const badgeCls = ENROLL_STATUS_CONFIG[rawStatus] ?? ENROLL_STATUS_CONFIG.active;
                                return (
                                    <div key={i} className="flex items-start gap-4 px-5 py-3.5">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-200 to-slate-300 text-xs font-bold text-slate-700 dark:from-neutral-700 dark:to-neutral-600 dark:text-slate-300">
                                            {(e.user_name || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {e.user_name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">{e.course_title}</p>
                                            {/* Progress bar */}
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                                                    <div
                                                        className="h-full rounded-full bg-blue-500"
                                                        style={{ width: `${Math.round(Number(e.progress ?? 0))}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {Math.round(Number(e.progress ?? 0))}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${badgeCls}`}>
                                                {rawStatus}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{e.enrolled_at}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* ── Trainer Leaderboard ── */}
            {(data?.trainer_stats ?? []).length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white dark:border-white/8 dark:bg-neutral-900 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/8">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Trainer Leaderboard</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">Ranked by total enrolled students</p>
                        </div>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-white/5">
                        {(data?.trainer_stats ?? []).map((t, i) => {
                            const maxStudents = Math.max(...(data?.trainer_stats ?? []).map((x) => Number(x.student_total)), 1);
                            const widthPct = Math.round((Number(t.student_total) / maxStudents) * 100);
                            const rankColors = ['text-amber-500', 'text-slate-500', 'text-amber-700', 'text-muted-foreground', 'text-muted-foreground'];
                            return (
                                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                                    <span className={`w-5 shrink-0 text-center text-sm font-bold ${rankColors[i] ?? 'text-muted-foreground'}`}>
                                        {i + 1}
                                    </span>
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                                        {(t.trainer_name || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{t.trainer_name}</p>
                                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-neutral-800">
                                            <div
                                                className="h-full rounded-full bg-purple-500"
                                                style={{ width: `${widthPct}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {t.student_total}
                                        <span className="ml-1 text-xs font-normal text-muted-foreground">students</span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Award,
    BookOpen,
    CheckCircle,
    ChevronRight,
    GraduationCap,
    LayoutDashboard,
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

// ── Subcomponents ─────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    iconBg,
    iconColor,
    borderColor,
}: {
    label: string;
    value: string | number;
    sub?: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    borderColor: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-neutral-900 p-5 shadow-sm ${borderColor}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
            </div>
            {/* Subtle decorative arc */}
            <div className={`pointer-events-none absolute -right-4 -bottom-4 h-20 w-20 rounded-full opacity-10 ${iconBg}`} />
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminDashboard({ data }: AdminDashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const stats = data?.stats;

    const initials = (user.full_name || user.name || 'A')
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    // Monthly enrollments bar chart
    const monthlyData = Object.entries(data?.monthly_enrollments ?? {});
    const maxMonthly = Math.max(...monthlyData.map(([, v]) => v), 1);

    // Course status distribution
    const statusEntries = Object.entries(data?.courses_by_status ?? {});
    const totalCoursesForBar = statusEntries.reduce((s, [, v]) => s + v, 0) || 1;

    // Quick links
    const quickLinks = [
        { label: 'Dashboard',      href: '/dashboard',   icon: LayoutDashboard },
        { label: 'User Management', href: '/admin/users', icon: Users },
        { label: 'All Courses',    href: '/courses',     icon: BookOpen },
        { label: 'Settings',       href: '/settings',    icon: Settings },
    ];

    return (
        <div className="space-y-8 p-4 md:p-6">

            {/* ── Hero ── */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-800 to-slate-900 p-6 md:p-8 text-white shadow-lg">
                <div className="relative z-10 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-medium text-slate-400">Admin Portal</p>
                        <h1 className="mt-1 text-2xl md:text-3xl font-bold leading-tight">
                            {user.full_name || user.name}
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Platform overview — all systems operational
                        </p>
                    </div>
                    <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold shrink-0 border border-white/10">
                        {initials}
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
                <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute -bottom-12 -right-4 h-64 w-64 rounded-full bg-white/3" />
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-7">
                <StatCard
                    label="Total Users"
                    value={stats?.total_users ?? 0}
                    icon={Users}
                    iconBg="bg-blue-50 dark:bg-blue-900/20"
                    iconColor="text-blue-600 dark:text-blue-400"
                    borderColor="border-blue-100 dark:border-blue-900/40"
                />
                <StatCard
                    label="Trainers"
                    value={stats?.total_trainers ?? 0}
                    icon={Award}
                    iconBg="bg-purple-50 dark:bg-purple-900/20"
                    iconColor="text-purple-600 dark:text-purple-400"
                    borderColor="border-purple-100 dark:border-purple-900/40"
                />
                <StatCard
                    label="Students"
                    value={stats?.total_students ?? 0}
                    icon={GraduationCap}
                    iconBg="bg-emerald-50 dark:bg-emerald-900/20"
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    borderColor="border-emerald-100 dark:border-emerald-900/40"
                />
                <StatCard
                    label="Total Courses"
                    value={stats?.total_courses ?? 0}
                    icon={BookOpen}
                    iconBg="bg-amber-50 dark:bg-amber-900/20"
                    iconColor="text-amber-600 dark:text-amber-400"
                    borderColor="border-amber-100 dark:border-amber-900/40"
                />
                <StatCard
                    label="Enrollments"
                    value={stats?.total_enrollments ?? 0}
                    icon={Activity}
                    iconBg="bg-rose-50 dark:bg-rose-900/20"
                    iconColor="text-rose-600 dark:text-rose-400"
                    borderColor="border-rose-100 dark:border-rose-900/40"
                />
                <StatCard
                    label="Completion Rate"
                    value={`${stats?.completion_rate ?? 0}%`}
                    sub={`${stats?.completed_enrollments ?? 0} completed`}
                    icon={CheckCircle}
                    iconBg="bg-teal-50 dark:bg-teal-900/20"
                    iconColor="text-teal-600 dark:text-teal-400"
                    borderColor="border-teal-100 dark:border-teal-900/40"
                />
                <StatCard
                    label="Avg Platform Rating"
                    value={stats?.platform_avg_rating ? `${stats.platform_avg_rating} / 5` : 'No ratings'}
                    icon={Star}
                    iconBg="bg-amber-50 dark:bg-amber-900/20"
                    iconColor="text-amber-600 dark:text-amber-400"
                    borderColor="border-amber-100 dark:border-amber-900/40"
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
                    <div className="flex h-36 items-end gap-2">
                        {monthlyData.map(([key, val]) => {
                            const pct = Math.round((val / maxMonthly) * 100);
                            return (
                                <div key={key} className="group flex flex-1 flex-col items-center gap-1.5">
                                    <span className="hidden text-[10px] font-semibold text-gray-700 dark:text-gray-300 group-hover:block">
                                        {val}
                                    </span>
                                    <div className="relative w-full overflow-hidden rounded-t-md bg-blue-100 dark:bg-blue-900/20" style={{ height: '100px' }}>
                                        <div
                                            className="absolute bottom-0 w-full rounded-t-md bg-blue-500 dark:bg-blue-600 transition-all duration-500"
                                            style={{ height: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-medium text-muted-foreground">{formatMonth(key)}</span>
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

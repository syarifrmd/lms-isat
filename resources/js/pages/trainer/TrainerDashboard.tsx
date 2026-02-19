import { logout } from '@/routes';
import { type SharedData, type TrainerDashboardData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CheckCircle,
    ChevronRight,
    FileText,
    LogOut,
    PlusCircle,
    Users,
    Video,
    Youtube,
    ChevronDown,
} from 'lucide-react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';

interface TrainerDashboardProps {
    data?: TrainerDashboardData;
    youtube_connected: boolean;
}

const statusColors: Record<string, string> = {
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function TrainerDashboard({ data, youtube_connected }: TrainerDashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const stats = [
        {
            label: 'Total Courses',
            value: data?.stats?.total_courses ?? 0,
            icon: BookOpen,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-100 dark:border-blue-800/40',
        },
        {
            label: 'Total Students',
            value: data?.stats?.total_students ?? 0,
            icon: Users,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-100 dark:border-emerald-800/40',
        },
        {
            label: 'Published',
            value: data?.stats?.completed_courses ?? 0,
            icon: CheckCircle,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            border: 'border-purple-100 dark:border-purple-800/40',
        },
        {
            label: 'Avg Rating',
            value: data?.stats?.average_rating ?? '0.0',
            icon: Award,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-100 dark:border-amber-800/40',
        },
    ];

    const courses = data?.recent_courses ?? [];

    const quickActions = [
        {
            label: 'Upload Video',
            desc: 'Add learning materials',
            icon: Video,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            href: '/courses/create',
        },
        {
            label: 'Create Quiz',
            desc: 'Test student knowledge',
            icon: FileText,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            href: '/courses/create',
        },
        {
            label: 'My Courses',
            desc: 'Manage your courses',
            icon: BookOpen,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            href: '/courses',
        },
    ];

    const initials = (user.full_name || user.name || 'T')
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    return (
        <div className="space-y-6 p-4 md:p-6">
            {/* ── Hero greeting ── */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-red-600 to-rose-700 p-5 md:p-8 text-white shadow-lg">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-red-100">Selamat datang kembali 👋</p>
                        <h1 className="mt-1 text-2xl md:text-3xl font-bold leading-tight">
                            {user.full_name || user.name}
                        </h1>
                        <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide">
                            Trainer
                        </span>
                    </div>
                    <div className="hidden sm:flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold shrink-0">
                        {initials}
                    </div>
                </div>

                {/* YouTube badge */}
                <div className="relative z-10 mt-4">
                    {youtube_connected ? (
                        <Menu as="div" className="relative inline-block">
                            <Menu.Button className="flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-1.5 text-sm font-medium transition-colors">
                                <CheckCircle className="h-4 w-4 text-green-300" />
                                YouTube Connected
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute left-0 mt-2 w-48 origin-top-left rounded-xl bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 border border-gray-100 dark:border-zinc-700">
                                    <div className="p-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <Link
                                                    href="/auth/google/disconnect"
                                                    method="post"
                                                    as="button"
                                                    className={`${active ? 'bg-red-50 dark:bg-red-900/20 text-red-700' : 'text-gray-700 dark:text-gray-200'} flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm`}
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Disconnect YouTube
                                                </Link>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    ) : (
                        <a
                            href="/auth/google"
                            className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-1.5 text-sm font-medium transition-colors"
                        >
                            <Youtube className="h-4 w-4" />
                            Hubungkan YouTube
                        </a>
                    )}
                </div>

                {/* Decorative circles */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
                <div className="pointer-events-none absolute -bottom-10 -right-4 h-56 w-56 rounded-full bg-white/5" />
            </div>

            {/* ── Stats grid ── */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className={`rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-sm ${stat.border}`}
                        >
                            <div className={`inline-flex rounded-lg p-2 ${stat.bg}`}>
                                <Icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                                {stat.value}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                {stat.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* ── Quick actions ── */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Aksi Cepat</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.label}
                                href={action.href}
                                className="flex items-center gap-3 rounded-xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                            >
                                <div className={`rounded-lg p-2.5 ${action.bg}`}>
                                    <Icon className={`h-5 w-5 ${action.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {action.label}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {action.desc}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* ── Recent courses ── */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Kursus Saya</h2>
                    <Link href="/courses" className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1">
                        Lihat semua <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>

                {courses.length > 0 ? (
                    <div className="space-y-3">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="flex items-center gap-3 rounded-xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 shadow-sm"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                                    <BookOpen className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                                        {course.title}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {course.students_count ?? 0} siswa
                                    </p>
                                </div>
                                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[course.status ?? 'draft']}`}>
                                    {course.status ?? 'draft'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 py-10 text-center">
                        <BookOpen className="mb-3 h-10 w-10 text-gray-300 dark:text-neutral-600" />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Belum ada kursus
                        </p>
                        <Link
                            href="/courses/create"
                            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                        >
                            <PlusCircle className="h-4 w-4" />
                            Buat Kursus
                        </Link>
                    </div>
                )}
            </div>

            {/* ── Account section with logout ── */}
            <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">Akun</h2>
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-sm font-bold text-red-700 dark:text-red-400">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {user.full_name || user.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                </div>
                <Link
                    href={logout().url}
                    method="post"
                    as="button"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Keluar
                </Link>
            </div>
        </div>
    );
}

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Award,
    CheckCircle2,
    Clock,
    CreditCard,
    Mail,
    MapPin,
    Search,
    Trophy,
    Users,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
    enrollment_id?: number | null;
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

interface AggregatedRow {
    no: number;
    group_value: string;
    total_dse: number;
    registered_count: number;
    completed_count: number;
    percentage: number;
}

interface ScopeFilter {
    field: string;
    label: string;
    value: string;
}

interface Props {
    summary_url: string;
    course: Course;
    students: StudentRow[];
    total_enrollments: number;
    total_completed: number;
    total_dse?: number;
    scope_label: string;
    scope_value: string;
    division_filter?: string | null;
    scope_filter?: ScopeFilter | null;
    from_division?: string | null;
    aggregated?: boolean;
    aggregated_group_label?: string;
    aggregated_group_field?: string | null;
    aggregated_rows?: AggregatedRow[];
}

function StatusCheckIcon({ done, label }: { done: boolean; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" />
            )}
            <span
                className={`text-xs ${done ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}
            >
                {label}
            </span>
        </div>
    );
}

function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
        </div>
    );
}

export default function StudentsShow({
    summary_url,
    course,
    students,
    total_enrollments,
    total_completed,
    total_dse,
    scope_label,
    scope_value,
    division_filter,
    scope_filter,
    from_division,
    aggregated,
    aggregated_group_label,
    aggregated_group_field,
    aggregated_rows,
}: Props) {
    const [search, setSearch] = useState('');
    const [profileUser, setProfileUser] = useState<StudentRow | null>(null);
    const [avatarError, setAvatarError] = useState(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 15;

    const openProfile = (s: StudentRow) => {
        setAvatarError(false);
        setProfileUser(s);
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Summary', href: summary_url },
        { title: course.title, href: summary_url + '/' + course.id },
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

    const groupLabel = aggregated_group_label ?? 'Region';
    const aggregatedRows = aggregated_rows ?? [];
    const filteredAggregatedRows = search
        ? aggregatedRows.filter((r) =>
              r.group_value.toLowerCase().includes(search.toLowerCase()),
          )
        : aggregatedRows;

    // Pagination: Daftar Peserta bisa sangat panjang (semua DSE dalam scope), jadi ditampilkan
    // 15 baris dulu per halaman.
    useEffect(() => {
        setPage(1);
    }, [search, division_filter, scope_filter]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredStudents.length / PAGE_SIZE),
    );
    const currentPage = Math.min(page, totalPages);
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );

    // Pagination untuk tabel Rekap (per Region/Area/Branch/Micro Cluster) juga 15 baris per
    // halaman, memakai state `page` yang sama (keduanya tidak pernah tampil bersamaan).
    const aggTotalPages = Math.max(
        1,
        Math.ceil(filteredAggregatedRows.length / PAGE_SIZE),
    );
    const aggCurrentPage = Math.min(page, aggTotalPages);
    const paginatedAggregatedRows = filteredAggregatedRows.slice(
        (aggCurrentPage - 1) * PAGE_SIZE,
        aggCurrentPage * PAGE_SIZE,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Report - ${course.title}`} />

            {/* Profile Modal */}
            <Dialog
                open={!!profileUser}
                onOpenChange={() => setProfileUser(null)}
            >
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base">
                            Profil Peserta
                        </DialogTitle>
                    </DialogHeader>
                    {profileUser && (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col items-center gap-2 pt-1">
                                {profileUser.avatar && !avatarError ? (
                                    <img
                                        src={profileUser.avatar}
                                        alt={profileUser.name}
                                        onError={() => setAvatarError(true)}
                                        className="h-16 w-16 rounded-full border border-sky-100 bg-gray-100 object-cover dark:border-sky-900 dark:bg-gray-700"
                                    />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-600 dark:bg-sky-900 dark:text-sky-300">
                                        {profileUser.name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                )}
                                <div className="text-center">
                                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                                        {profileUser.name}
                                    </p>
                                    {profileUser.completed_at ? (
                                        <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                                            Selesai
                                        </span>
                                    ) : profileUser.enrollment_id ? (
                                        <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                            Dalam Proses
                                        </span>
                                    ) : (
                                        <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                            Belum Terdaftar
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-gray-700 dark:border-gray-700">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Username
                                        </p>
                                        <p className="text-sm text-gray-800 dark:text-gray-100">
                                            {profileUser.username ||
                                                profileUser.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <CreditCard className="h-4 w-4 shrink-0 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            NIK
                                        </p>
                                        <p className="text-sm text-gray-800 dark:text-gray-100">
                                            {profileUser.employee_id ?? '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Lokasi
                                        </p>
                                        <p className="text-sm text-gray-800 dark:text-gray-100">
                                            {profileUser.location ?? '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <Users className="h-4 w-4 shrink-0 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-400">
                                            Divisi
                                        </p>
                                        <p className="text-sm text-gray-800 dark:text-gray-100">
                                            {profileUser.division ?? '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-700">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Progress Modul</span>
                                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                                        {profileUser.progress_percentage ?? 0}%
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                    <div
                                        className="h-2 rounded-full bg-sky-500 transition-all"
                                        style={{
                                            width: `${profileUser.progress_percentage ?? 0}%`,
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>
                                        Daftar:{' '}
                                        {profileUser.enrollment_at ?? '-'}
                                    </span>
                                    <span>
                                        Selesai:{' '}
                                        {profileUser.completed_at ?? '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Ringkasan Kegagalan */}
                            <div className="rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-700">
                                <p className="mb-2 text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
                                    Ringkasan Kegagalan
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-950/30">
                                        <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                                        <div>
                                            <p className="text-[10px] text-red-400">
                                                Gagal Nilai
                                            </p>
                                            <p className="text-sm font-bold text-red-600 dark:text-red-400">
                                                {profileUser.score_failed_count ??
                                                    0}
                                                x
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30">
                                        <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                                        <div>
                                            <p className="text-[10px] text-amber-400">
                                                Gagal Waktu
                                            </p>
                                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                                {profileUser.time_failed_count ??
                                                    0}
                                                x
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Detail per Materi Training */}
                            {profileUser.modules_progress &&
                                profileUser.modules_progress.length > 0 && (
                                    <div className="rounded-xl border border-gray-100 px-4 py-3 dark:border-gray-700">
                                        <p className="mb-3 text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
                                            Detail Materi Training &amp; Kuis
                                        </p>
                                        <div className="space-y-3">
                                            {profileUser.modules_progress.map(
                                                (mod) => {
                                                    const totalItems = [
                                                        mod.has_video,
                                                        mod.has_document,
                                                    ].filter(Boolean).length;
                                                    const completedItems = [
                                                        mod.has_video
                                                            ? mod.is_video_watched
                                                            : null,
                                                        mod.has_document
                                                            ? mod.is_document_read
                                                            : null,
                                                    ].filter(
                                                        (v) => v === true,
                                                    ).length;

                                                    return (
                                                        <div
                                                            key={mod.module_id}
                                                        >
                                                            <div className="mb-1.5 flex items-center justify-between">
                                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                                    {
                                                                        mod.order_sequence
                                                                    }
                                                                    .{' '}
                                                                    {
                                                                        mod.module_title
                                                                    }
                                                                </p>
                                                                {totalItems >
                                                                    0 && (
                                                                    <span
                                                                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                                                                            completedItems >=
                                                                            totalItems
                                                                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                                        }`}
                                                                    >
                                                                        {
                                                                            completedItems
                                                                        }
                                                                        /
                                                                        {
                                                                            totalItems
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {totalItems > 0 && (
                                                                <div className="mb-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-3">
                                                                    {mod.has_video && (
                                                                        <StatusCheckIcon
                                                                            done={
                                                                                mod.is_video_watched
                                                                            }
                                                                            label="Video"
                                                                        />
                                                                    )}
                                                                    {mod.has_text && (
                                                                        <StatusCheckIcon
                                                                            done={
                                                                                mod.is_text_read
                                                                            }
                                                                            label="Text"
                                                                        />
                                                                    )}
                                                                    {mod.has_document && (
                                                                        <StatusCheckIcon
                                                                            done={
                                                                                mod.is_document_read
                                                                            }
                                                                            label="Dokumen"
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}

                                                            {mod.quizzes
                                                                .length > 0 ? (
                                                                <div className="space-y-1.5 pl-3">
                                                                    {mod.quizzes.map(
                                                                        (q) => (
                                                                            <div
                                                                                key={
                                                                                    q.quiz_id
                                                                                }
                                                                                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                                                                                    q.is_passed
                                                                                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/20'
                                                                                        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                                                                }`}
                                                                            >
                                                                                <div className="flex min-w-0 items-center gap-1.5">
                                                                                    <Award
                                                                                        className={`h-3 w-3 shrink-0 ${q.is_passed ? 'text-emerald-500' : 'text-gray-400'}`}
                                                                                    />
                                                                                    <span className="truncate font-medium text-gray-700 dark:text-gray-200">
                                                                                        {
                                                                                            q.quiz_title
                                                                                        }
                                                                                    </span>
                                                                                </div>
                                                                                <div className="ml-2 flex shrink-0 items-center gap-2">
                                                                                    {q.highest_score !==
                                                                                        null && (
                                                                                        <span className="flex items-center gap-1 text-gray-500">
                                                                                            <Trophy className="h-3 w-3 text-amber-400" />
                                                                                            {
                                                                                                q.highest_score
                                                                                            }
                                                                                            {q.passing_score >
                                                                                                0 &&
                                                                                                `/${q.passing_score}`}
                                                                                        </span>
                                                                                    )}
                                                                                    {q.failed_score_count >
                                                                                        0 && (
                                                                                        <span className="flex items-center gap-0.5 font-semibold text-red-500">
                                                                                            <XCircle className="h-3 w-3" />
                                                                                            {
                                                                                                q.failed_score_count
                                                                                            }
                                                                                        </span>
                                                                                    )}
                                                                                    {q.failed_time_count >
                                                                                        0 && (
                                                                                        <span className="flex items-center gap-0.5 font-semibold text-amber-500">
                                                                                            <Clock className="h-3 w-3" />
                                                                                            {
                                                                                                q.failed_time_count
                                                                                            }
                                                                                        </span>
                                                                                    )}
                                                                                    {q.is_passed ? (
                                                                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                                                            LULUS
                                                                                        </span>
                                                                                    ) : q.attempts_count ===
                                                                                      0 ? (
                                                                                        <span className="text-gray-400">
                                                                                            &mdash;
                                                                                        </span>
                                                                                    ) : null}
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="pl-3 text-[11px] text-gray-400">
                                                                    Tidak ada
                                                                    kuis
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-2 text-[11px] text-gray-400 dark:border-gray-700">
                                            <span className="flex items-center gap-1">
                                                <XCircle className="h-3 w-3 text-red-400" />{' '}
                                                = Gagal Nilai
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-amber-400" />{' '}
                                                = Gagal Waktu
                                            </span>
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="max-w-8xl mx-auto flex flex-col gap-6 px-4 py-6">
                {/* Back */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {scope_filter && (
                        <button
                            onClick={() =>
                                router.visit(
                                    `${summary_url}/${course.id}?division=${from_division ?? 'CSE'}&journey=${course.journey_id ?? ''}`,
                                )
                            }
                            className="flex w-fit items-center gap-1.5 text-sm text-gray-400 transition hover:text-sky-500 dark:text-gray-500 dark:hover:text-sky-400"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </button>
                    )}
                    <button
                        onClick={() =>
                            router.visit(
                                course.journey_id
                                    ? summary_url +
                                          '?journey=' +
                                          course.journey_id
                                    : summary_url,
                            )
                        }
                        className="flex w-fit items-center gap-1.5 text-sm text-gray-400 transition hover:text-sky-500 dark:text-gray-500 dark:hover:text-sky-400"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Daftar Modul
                    </button>
                </div>

                {/* Header Card */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5 shadow-sm xl:flex-row xl:items-center dark:border-sky-900 dark:from-sky-950 dark:to-gray-900">
                    <div>
                        <p className="text-xs font-medium tracking-widest text-sky-400 uppercase">
                            Detail Modul
                        </p>
                        <h1 className="mt-0.5 text-xl font-bold text-gray-800 dark:text-gray-100">
                            {course.title}
                        </h1>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            {course.category && (
                                <>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {course.category}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-600">
                                        &bull;
                                    </span>
                                </>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {total_enrollments}
                                {typeof total_dse === 'number'
                                    ? `/${total_dse}`
                                    : ''}{' '}
                                user terdaftar
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">
                                &bull;
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {scope_label}: {scope_value}
                            </span>
                            {division_filter && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600">
                                        &bull;
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                        Divisi: {division_filter}
                                    </span>
                                </>
                            )}
                            {scope_filter && (
                                <>
                                    <span className="text-gray-300 dark:text-gray-600">
                                        &bull;
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        {scope_filter.label}:{' '}
                                        {scope_filter.value}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Stats */}
                    <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 xl:w-auto xl:shrink-0">
                        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-500 dark:bg-sky-900/40">
                                <Users className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs tracking-widest text-gray-400 uppercase">
                                    Terdaftar
                                </p>
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    {total_enrollments}
                                    {typeof total_dse === 'number' && (
                                        <span className="text-sm font-medium text-gray-400">
                                            /{total_dse}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-500 dark:bg-green-900/40">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs tracking-widest text-gray-400 uppercase">
                                    Selesai
                                </p>
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    {total_completed}
                                    {typeof total_dse === 'number' && (
                                        <span className="text-sm font-medium text-gray-400">
                                            /{total_dse}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:col-span-2 md:col-span-1 lg:col-span-1 dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-900/40">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs tracking-widest text-gray-400 uppercase">
                                    Berjalan
                                </p>
                                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    {total_enrollments - total_completed}
                                    {typeof total_dse === 'number' && (
                                        <span className="text-sm font-medium text-gray-400">
                                            /{total_dse}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {aggregated ? (
                    /* Rekap Card: 1 baris per Region/Area/Branch (klik HOR/HOS/BSM), bukan per peserta */
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:border-gray-700">
                            <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
                                Rekap {groupLabel}
                            </h2>
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={`Cari ${groupLabel.toLowerCase()}...`}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-4 pl-9 text-sm text-gray-800 placeholder-gray-400 transition outline-none focus:ring-2 focus:ring-sky-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-sky-700"
                                />
                            </div>
                        </div>

                        <div className="sm:max-lg:overflow-x-auto">
                            <div className="sm:max-lg:min-w-[48rem]">
                                {filteredAggregatedRows.length > 0 && (
                                    <div className="hidden gap-4 border-b border-gray-100 bg-gray-50/50 px-5 py-2 sm:grid sm:grid-cols-[3rem_minmax(0,1fr)_9rem_9rem_9rem] sm:items-center dark:border-gray-700 dark:bg-gray-900/20">
                                        <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            No
                                        </span>
                                        <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            {groupLabel}
                                        </span>
                                        <span className="text-center text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            Jumlah DSE
                                        </span>
                                        <span className="text-center text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            Modul Selesai
                                        </span>
                                        <span className="text-center text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            Persentase
                                        </span>
                                    </div>
                                )}

                                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {filteredAggregatedRows.length === 0 ? (
                                        <p className="px-5 py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                                            {search
                                                ? 'Tidak ada hasil yang cocok.'
                                                : `Belum ada ${groupLabel.toLowerCase()} dalam cakupan.`}
                                        </p>
                                    ) : (
                                        paginatedAggregatedRows.map(
                                            (r, idx) => {
                                                // Baris rekap di level manapun (HOR/HOS/BSM/CSE) bisa di-drill ke
                                                // daftar peserta DSE untuk region/area/branch/micro cluster tsb
                                                // (mirip gambar 5), selama backend mengirim group_field-nya.
                                                const isDrillable =
                                                    !!aggregated_group_field;

                                                const rowContent = (
                                                    <>
                                                        <span className="w-full shrink-0 text-xs text-gray-300 sm:w-auto">
                                                            {(aggCurrentPage -
                                                                1) *
                                                                PAGE_SIZE +
                                                                idx +
                                                                1}
                                                        </span>

                                                        <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                                                            {r.group_value}
                                                        </p>

                                                        <p className="flex items-center justify-between text-sm text-gray-600 sm:block sm:text-center dark:text-gray-300">
                                                            <span>
                                                                {r.total_dse}
                                                            </span>
                                                            <span className="text-xs text-gray-400 sm:hidden">
                                                                Jumlah DSE
                                                            </span>
                                                        </p>

                                                        <p className="flex items-center justify-between text-sm text-gray-600 sm:block sm:text-center dark:text-gray-300">
                                                            <span>
                                                                {
                                                                    r.completed_count
                                                                }
                                                            </span>
                                                            <span className="text-xs text-gray-400 sm:hidden">
                                                                Modul Selesai
                                                            </span>
                                                        </p>

                                                        <div className="sm:flex sm:justify-center">
                                                            <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                                                                {r.percentage}%
                                                            </span>
                                                        </div>
                                                    </>
                                                );

                                                if (isDrillable) {
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={r.group_value}
                                                            onClick={() =>
                                                                router.visit(
                                                                    `${summary_url}/${course.id}?division=DSE&journey=${course.journey_id ?? ''}&${aggregated_group_field}=${encodeURIComponent(r.group_value)}&from_division=${division_filter ?? ''}`,
                                                                )
                                                            }
                                                            className="flex w-full flex-col gap-2 px-5 py-3 text-left transition-colors hover:bg-gray-50/60 sm:grid sm:grid-cols-[3rem_minmax(0,1fr)_9rem_9rem_9rem] sm:items-center sm:gap-4 dark:hover:bg-gray-700/20"
                                                        >
                                                            {rowContent}
                                                        </button>
                                                    );
                                                }

                                                return (
                                                    <div
                                                        key={r.group_value}
                                                        className="flex flex-col gap-2 px-5 py-3 sm:grid sm:grid-cols-[3rem_minmax(0,1fr)_9rem_9rem_9rem] sm:items-center sm:gap-4"
                                                    >
                                                        {rowContent}
                                                    </div>
                                                );
                                            },
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        {filteredAggregatedRows.length > PAGE_SIZE && (
                            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
                                <p className="text-[11px] text-gray-400">
                                    Menampilkan{' '}
                                    {(aggCurrentPage - 1) * PAGE_SIZE + 1}-
                                    {Math.min(
                                        aggCurrentPage * PAGE_SIZE,
                                        filteredAggregatedRows.length,
                                    )}{' '}
                                    dari {filteredAggregatedRows.length}{' '}
                                    {groupLabel.toLowerCase()}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={aggCurrentPage <= 1}
                                        onClick={() =>
                                            setPage((p) => Math.max(1, p - 1))
                                        }
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/40"
                                    >
                                        Sebelumnya
                                    </button>
                                    <span className="px-1 text-xs text-gray-400">
                                        {aggCurrentPage} / {aggTotalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={
                                            aggCurrentPage >= aggTotalPages
                                        }
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.min(aggTotalPages, p + 1),
                                            )
                                        }
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/40"
                                    >
                                        Berikutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* List Card (flat, simplified: nama, lokasi, progress) */
                    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:border-gray-700">
                            <h2 className="text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
                                Daftar Peserta
                            </h2>
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, email, NIK, divisi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-4 pl-9 text-sm text-gray-800 placeholder-gray-400 transition outline-none focus:ring-2 focus:ring-sky-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-sky-700"
                                />
                            </div>
                        </div>

                        <div className="sm:max-xl:overflow-x-auto">
                            <div className="sm:max-xl:min-w-[58rem]">
                                {/* Header kolom (hanya tampil di desktop, mengikuti grid template yang sama dengan baris data) */}
                                {filteredStudents.length > 0 && (
                                    <div className="hidden gap-4 border-b border-gray-100 bg-gray-50/50 px-5 py-2 sm:grid sm:grid-cols-[2rem_minmax(0,1fr)_11rem_5rem_7rem_4rem_7rem_5.5rem] sm:items-center dark:border-gray-700 dark:bg-gray-900/20">
                                        <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            No
                                        </span>
                                        <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            Peserta
                                        </span>
                                        <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            Lokasi
                                        </span>
                                        <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            Divisi
                                        </span>
                                        <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            Progress
                                        </span>
                                        <span className="text-center text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            Gagal
                                        </span>
                                        <span className="text-center text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            Status
                                        </span>
                                        <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                                            Tanggal
                                        </span>
                                    </div>
                                )}

                                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {filteredStudents.length === 0 ? (
                                        <p className="px-5 py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                                            {search
                                                ? 'Tidak ada hasil yang cocok.'
                                                : 'Belum ada peserta yang terdaftar.'}
                                        </p>
                                    ) : (
                                        paginatedStudents.map((s, idx) => (
                                            <button
                                                type="button"
                                                key={
                                                    s.enrollment_id ??
                                                    `u-${s.user_id}`
                                                }
                                                onClick={() => openProfile(s)}
                                                className="flex w-full flex-col gap-2 px-5 py-3 text-left transition-colors hover:bg-gray-50/60 sm:grid sm:grid-cols-[2rem_minmax(0,1fr)_11rem_5rem_7rem_4rem_7rem_5.5rem] sm:items-center sm:gap-4 dark:hover:bg-gray-700/20"
                                            >
                                                <span className="w-full shrink-0 text-xs text-gray-300 sm:w-auto">
                                                    {(currentPage - 1) *
                                                        PAGE_SIZE +
                                                        idx +
                                                        1}
                                                </span>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                                                        {s.name}
                                                    </p>
                                                    <p className="truncate text-[11px] text-gray-400">
                                                        {s.employee_id} &bull;{' '}
                                                        {s.email}
                                                    </p>
                                                </div>

                                                <div
                                                    className="min-w-0 text-xs leading-snug break-words text-gray-400"
                                                    title={s.location ?? '-'}
                                                >
                                                    {s.location ?? '-'}
                                                </div>

                                                <div
                                                    className="min-w-0 truncate text-xs text-gray-400"
                                                    title={s.division ?? '-'}
                                                >
                                                    {s.division ?? '-'}
                                                </div>

                                                <div className="min-w-0">
                                                    <ProgressBar
                                                        value={
                                                            s.progress_percentage
                                                        }
                                                    />
                                                    <p className="mt-1 text-[10px] text-gray-400">
                                                        {s.progress_percentage}%
                                                    </p>
                                                </div>

                                                <div className="sm:text-center">
                                                    {s.score_failed_count >
                                                    0 ? (
                                                        <span className="text-[11px] text-red-500">
                                                            &#8855;{' '}
                                                            {
                                                                s.score_failed_count
                                                            }
                                                            x
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-300 dark:text-gray-600">
                                                            &mdash;
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="sm:flex sm:justify-center">
                                                    <span
                                                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                                                            s.completed_at
                                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                                                : s.enrollment_id
                                                                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                                                                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700/40 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {s.completed_at
                                                            ? 'Selesai'
                                                            : s.enrollment_id
                                                              ? 'Dalam Proses'
                                                              : 'Belum Terdaftar'}
                                                    </span>
                                                </div>

                                                <span className="text-[11px] text-gray-400">
                                                    {s.enrollment_at ?? '-'}
                                                </span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {filteredStudents.length > PAGE_SIZE && (
                            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 dark:border-gray-700">
                                <p className="text-[11px] text-gray-400">
                                    Menampilkan{' '}
                                    {(currentPage - 1) * PAGE_SIZE + 1}-
                                    {Math.min(
                                        currentPage * PAGE_SIZE,
                                        filteredStudents.length,
                                    )}{' '}
                                    dari {filteredStudents.length} peserta
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={currentPage <= 1}
                                        onClick={() =>
                                            setPage((p) => Math.max(1, p - 1))
                                        }
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/40"
                                    >
                                        Sebelumnya
                                    </button>
                                    <span className="px-1 text-xs text-gray-400">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={currentPage >= totalPages}
                                        onClick={() =>
                                            setPage((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/40"
                                    >
                                        Berikutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

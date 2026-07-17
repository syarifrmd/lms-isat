import { type SharedData, type UserDashboardData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CheckCircle2,
    ClipboardList,
    Flame,
    GraduationCap,
    Layers,
    MapPin,
    Star,
    Trophy,
    User,
} from 'lucide-react';

interface UserDashboardProps {
    data?: UserDashboardData;
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

/* ══════════════════════════════════════════════
   Komponen utama
══════════════════════════════════════════════ */
export default function UserDashboard({ data }: UserDashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const stats          = data?.stats;
    const recentAttempts = data?.recent_attempts  ?? [];

    const statCards = [
        { label: 'Course Tersedia', value: stats?.courses_available ?? 0, icon: BookOpen,     color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20',     border: 'border-blue-100 dark:border-blue-800/40' },
        { label: 'Modul Tersedia',  value: stats?.modules_available ?? 0, icon: Layers,        color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/40' },
        { label: 'Modul Selesai',   value: stats?.modules_completed ?? 0, icon: CheckCircle2,  color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-100 dark:border-violet-800/40' },
        { label: 'Stamp',           value: stats?.certificates      ?? 0, icon: GraduationCap, color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-100 dark:border-amber-800/40' },
    ];

    const jam  = new Date().getHours();
    const sapa = jam < 12 ? 'Selamat Pagi,' : jam < 17 ? 'Selamat Siang,' : 'Selamat Malam,';

    // Label & nilai wilayah kerja mengikuti level division:
    // HOC -> Circle, HOR -> Region, HOS -> Area, BSM -> Branch, CSE/RSE/DSE -> Micro Cluster
    const divisionUpper = String(user.division ?? '').toUpperCase();
    const scopeField =
        divisionUpper === 'HOC' ? { label: 'Circle',         value: user.circle }
        : divisionUpper === 'HOR' ? { label: 'Region',        value: user.region }
        : divisionUpper === 'HOS' ? { label: 'Area',          value: user.area }
        : divisionUpper === 'BSM' ? { label: 'Branch',        value: user.branch }
        : { label: 'Micro Cluster', value: user.micro_cluster }; // CSE, RSE, DSE, atau lainnya

    return (
        <div className="flex flex-col xl:flex-row gap-6 items-stretch min-w-0 px-4 py-6 pb-28 xl:pb-6">

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
                            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block mt-1">
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
                </div>
              
                {/* Kartu statistik */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                    {statCards.map(({ label, value, icon: Icon, color, bg, border }) => (
                        <div key={label}
                             className={`flex flex-col gap-3 rounded-2xl border ${border} ${bg} px-4 py-4 sm:px-5 shadow-sm`}>
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
                        <Link href="/journeys"
                              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5
                                         text-sm font-semibold text-white hover:bg-orange-600 transition-colors">
                            <BookOpen className="h-4 w-4" />
                            Jelajahi Journey
                        </Link>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════
                KANAN — Sidebar profil (≈30%, xl:block)
            ═══════════════════════════════════════ */}
            <aside className="flex w-full xl:w-74 shrink-0 flex-col gap-4">

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
                            {user.username ?? `#${user.id}`}
                        </p>
                    </div>

                    <div className="w-full rounded-xl border border-border/60 divide-y divide-border/60 overflow-hidden">
                        {user.division && (
                            <div className="flex items-center justify-between px-4 py-2.5">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" /> Division
                                </span>
                                <span className="text-xs font-semibold text-foreground">{String(user.division)}</span>
                            </div>
                        )}
                        {scopeField.value && (
                            <div className="flex items-center justify-between px-4 py-2.5">
                                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" /> {scopeField.label}
                                </span>
                                <span className="text-xs font-semibold text-foreground">{String(scopeField.value)}</span>
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
                        <Link href="/leaderboard"
                              className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Trophy className="h-3.5 w-3.5 text-violet-400" /> Peringkat
                            </span>
                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                #{stats?.rank ?? '—'}
                            </span>
                        </Link>
                    </div>

                    <Link href="/settings/profile"
                          className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 py-2.5 text-center
                                     text-sm font-semibold text-white transition-colors shadow-sm">
                        Edit Profil
                    </Link>
                </div>
            </aside>
        </div>
    );
}
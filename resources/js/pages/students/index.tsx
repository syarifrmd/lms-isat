import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Users2,
    AlertCircle,
    Bookmark,
    ChevronRight,
    ChevronDown,
    Building2,
    MapPinned,
} from 'lucide-react';
import { useState } from 'react';

interface CourseRef {
    id: number;
    title: string;
    is_mandatory: boolean;
}

interface PerCourseStat {
    course_id: number;
    course_title: string;
    is_mandatory: boolean;
    enrolled: number;
    finish: number;
    presentase: number;
}

interface GroupStat {
    name: string;
    total_selesai: number;
    finish_total: number;
    presentase_total: number;
    per_course: PerCourseStat[];
}

interface MicroClusterRow extends GroupStat {}

interface BranchRow extends GroupStat {
    micro_clusters: MicroClusterRow[];
}

interface DivisionRow extends GroupStat {
    branches: BranchRow[];
}

interface Props {
    summary: DivisionRow[];
    summaryCourses: CourseRef[];
}

function PercentPill({ value }: { value: number }) {
    const tone =
        value >= 75
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
            : value >= 40
                ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900'
                : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900';

    return (
        <span className={`inline-block min-w-[52px] text-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
            {value}%
        </span>
    );
}

export default function StudentsIndex({ summary, summaryCourses }: Props) {
    const [openDivisions, setOpenDivisions] = useState<Set<string>>(new Set());
    const [openBranches, setOpenBranches] = useState<Set<string>>(new Set());

    const toggleDivision = (name: string) => {
        setOpenDivisions((prev) => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    const toggleBranch = (key: string) => {
        setOpenBranches((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Summary', href: '/students' },
    ];

    const grandTotalSelesai = summary.reduce((sum, d) => sum + d.total_selesai, 0);
    const grandFinishTotal = summary.reduce((sum, d) => sum + d.finish_total, 0);
    const grandPresentase = grandFinishTotal > 0 ? Math.round((grandTotalSelesai / grandFinishTotal) * 1000) / 10 : 0;

    const colCount = 4 + summaryCourses.length * 2;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Summary" />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* Header Card */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Report</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600">Summary</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                {summary.length} division &bull; {summaryCourses.length} course dipantau
                            </p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex items-center gap-3 shadow-sm shrink-0">
                        <div className="h-9 w-9 rounded-full bg-sky-50 dark:bg-sky-900/40 text-sky-500 flex items-center justify-center">
                            <Users2 className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wide text-gray-400">Total Presentase</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                {grandTotalSelesai} / {grandFinishTotal} selesai ({grandPresentase}%)
                            </p>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 dark:text-gray-500 px-1">
                    <span className="flex items-center gap-1"><ChevronRight className="h-3 w-3" /> Klik nama Division / Branch untuk membuka rincian</span>
                    <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Branch</span>
                    <span className="flex items-center gap-1"><MapPinned className="h-3 w-3" /> Micro Cluster</span>
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-sky-50/70 dark:bg-sky-950/40 border-b border-gray-100 dark:border-gray-700">
                                    <th rowSpan={2} className="sticky left-0 z-10 bg-sky-50/70 dark:bg-sky-950/40 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 min-w-[240px]">
                                        Division / Branch / Micro Cluster
                                    </th>
                                    <th rowSpan={2} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-l border-gray-100 dark:border-gray-700">
                                        Total Selesai
                                    </th>
                                    <th rowSpan={2} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Total User
                                    </th>
                                    <th rowSpan={2} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700">
                                        Total Presentase
                                    </th>
                                    {summaryCourses.map((course) => (
                                        <th key={course.id} colSpan={2} className="px-3 py-2 text-center border-r border-gray-100 dark:border-gray-700 max-w-[220px]">
                                            <div className="flex flex-col items-center gap-1">
                                                <Link
                                                    href={`/students/${course.id}`}
                                                    className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 truncate max-w-[200px] hover:underline"
                                                    title={`Lihat report ${course.title}`}
                                                >
                                                    {course.title}
                                                </Link>
                                                {course.is_mandatory ? (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60">
                                                        <AlertCircle className="h-2.5 w-2.5" /> Mandatory
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                                        <Bookmark className="h-2.5 w-2.5" /> Non-Mandatory
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                                <tr className="bg-sky-50/40 dark:bg-sky-950/20 border-b border-gray-100 dark:border-gray-700">
                                    {summaryCourses.map((course) => (
                                        <>
                                            <th key={`${course.id}-f`} className="px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-gray-400">
                                                Selesai
                                            </th>
                                            <th key={`${course.id}-p`} className="px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-gray-400 border-r border-gray-100 dark:border-gray-700">
                                                %
                                            </th>
                                        </>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {summary.length === 0 ? (
                                    <tr>
                                        <td colSpan={colCount} className="px-5 py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                                            Belum ada data enrollment untuk direkap.
                                        </td>
                                    </tr>
                                ) : (
                                    summary.map((division) => {
                                        const divOpen = openDivisions.has(division.name);
                                        return (
                                            <>
                                                {/* DIVISION ROW */}
                                                <tr
                                                    key={`div-${division.name}`}
                                                    onClick={() => toggleDivision(division.name)}
                                                    className="cursor-pointer bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-100/60 dark:hover:bg-sky-900/30 transition-colors"
                                                >
                                                    <td className="sticky left-0 z-10 bg-sky-50/50 dark:bg-sky-950/20 px-4 py-2.5 font-semibold text-gray-800 dark:text-gray-100">
                                                        <div className="flex items-center gap-1.5">
                                                            {divOpen ? <ChevronDown className="h-4 w-4 text-sky-500 shrink-0" /> : <ChevronRight className="h-4 w-4 text-sky-500 shrink-0" />}
                                                            <span>{division.name}</span>
                                                            <span className="ml-1 text-[10px] font-medium text-gray-400">({division.branches.length} branch)</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center font-semibold text-gray-700 dark:text-gray-200 border-l border-gray-100 dark:border-gray-700">
                                                        {division.total_selesai}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center text-gray-500 dark:text-gray-400">{division.finish_total}</td>
                                                    <td className="px-3 py-2.5 text-center border-r border-gray-100 dark:border-gray-700">
                                                        <PercentPill value={division.presentase_total} />
                                                    </td>
                                                    {division.per_course.map((pc) => (
                                                        <>
                                                            <td key={`${pc.course_id}-f`} className="px-2 py-2.5 text-center text-gray-600 dark:text-gray-300">
                                                                {pc.finish}
                                                            </td>
                                                            <td key={`${pc.course_id}-p`} className="px-2 py-2.5 text-center text-[11px] text-gray-400 border-r border-gray-100 dark:border-gray-700">
                                                                {pc.presentase}%
                                                            </td>
                                                        </>
                                                    ))}
                                                </tr>

                                                {/* BRANCH ROWS */}
                                                {divOpen &&
                                                    division.branches.map((branch) => {
                                                        const branchKey = `${division.name}|${branch.name}`;
                                                        const branchOpen = openBranches.has(branchKey);
                                                        return (
                                                            <>
                                                                <tr
                                                                    key={`branch-${branchKey}`}
                                                                    onClick={() => toggleBranch(branchKey)}
                                                                    className="cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                                                                >
                                                                    <td className="sticky left-0 z-10 bg-white dark:bg-gray-800 px-4 py-2 pl-9 text-gray-700 dark:text-gray-200">
                                                                        <div className="flex items-center gap-1.5">
                                                                            {branchOpen ? <ChevronDown className="h-3.5 w-3.5 text-sky-400 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                                                                            <Building2 className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                                                                            <span className="font-medium">{branch.name}</span>
                                                                            <span className="ml-1 text-[10px] text-gray-400">({branch.micro_clusters.length} micro cluster)</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300 border-l border-gray-100 dark:border-gray-700">
                                                                        {branch.total_selesai}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-center text-gray-400">{branch.finish_total}</td>
                                                                    <td className="px-3 py-2 text-center border-r border-gray-100 dark:border-gray-700">
                                                                        <PercentPill value={branch.presentase_total} />
                                                                    </td>
                                                                    {branch.per_course.map((pc) => (
                                                                        <>
                                                                            <td key={`${pc.course_id}-f`} className="px-2 py-2 text-center text-gray-500 dark:text-gray-400">
                                                                                {pc.finish}
                                                                            </td>
                                                                            <td key={`${pc.course_id}-p`} className="px-2 py-2 text-center text-[11px] text-gray-400 border-r border-gray-100 dark:border-gray-700">
                                                                                {pc.presentase}%
                                                                            </td>
                                                                        </>
                                                                    ))}
                                                                </tr>

                                                                {/* MICRO CLUSTER ROWS */}
                                                                {branchOpen &&
                                                                    branch.micro_clusters.map((mc) => (
                                                                        <tr
                                                                            key={`mc-${branchKey}|${mc.name}`}
                                                                            className="bg-gray-50/60 dark:bg-gray-900/30"
                                                                        >
                                                                            <td className="sticky left-0 z-10 bg-gray-50/60 dark:bg-gray-900/30 px-4 py-2 pl-16 text-gray-600 dark:text-gray-300">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <MapPinned className="h-3 w-3 text-gray-300 shrink-0" />
                                                                                    <span>{mc.name}</span>
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400 border-l border-gray-100 dark:border-gray-700">
                                                                                {mc.total_selesai}
                                                                            </td>
                                                                            <td className="px-3 py-2 text-center text-gray-400">{mc.finish_total}</td>
                                                                            <td className="px-3 py-2 text-center border-r border-gray-100 dark:border-gray-700">
                                                                                <PercentPill value={mc.presentase_total} />
                                                                            </td>
                                                                            {mc.per_course.map((pc) => (
                                                                                <>
                                                                                    <td key={`${pc.course_id}-f`} className="px-2 py-2 text-center text-gray-500 dark:text-gray-400">
                                                                                        {pc.finish}
                                                                                    </td>
                                                                                    <td key={`${pc.course_id}-p`} className="px-2 py-2 text-center text-[11px] text-gray-400 border-r border-gray-100 dark:border-gray-700">
                                                                                        {pc.presentase}%
                                                                                    </td>
                                                                                </>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                            </>
                                                        );
                                                    })}
                                            </>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* <p className="text-[11px] text-gray-400 dark:text-gray-500 px-1">
                    Total Presentase = Total Selesai &divide; Total User &times; 100%. Data disaring otomatis sesuai hak akses akun Anda (division / branch / micro cluster).
                </p> */}
            </div>
        </AppLayout>
    );
}
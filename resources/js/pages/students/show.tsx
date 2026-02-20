import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Enrollment {
    user_id: string;
    name: string;
    email: string;
    region?: string;
    employee_id?: string;
    status?: string;
    progress_percentage: number;
    enrollment_at?: string;
    completed_at?: string;
}

interface Course {
    id: number;
    title: string;
    description?: string;
    category?: string;
    status?: string;
}

interface Props {
    course: Course;
    enrollments: Enrollment[];
}

export default function StudentsShow({ course, enrollments }: Props) {
    const [search, setSearch] = useState('');

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pemantauan Students', href: '/students' },
        { title: course.title, href: `/students/${course.id}` },
    ];

    const filtered = enrollments.filter(
        (e) =>
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.email.toLowerCase().includes(search.toLowerCase()) ||
            (e.employee_id ?? '').toLowerCase().includes(search.toLowerCase()),
    );

    const totalCompleted = enrollments.filter((e) => !!e.completed_at).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Students - ${course.title}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-3">
                    <Button
                        variant="ghost"
                        className="w-fit gap-2 px-0 hover:bg-transparent"
                        onClick={() => router.visit('/students')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Daftar Course
                    </Button>

                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
                            {course.category && (
                                <p className="text-muted-foreground text-sm mt-0.5">{course.category}</p>
                            )}
                        </div>

                        {/* Summary stats */}
                        <div className="flex gap-3">
                            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
                                <Users className="text-muted-foreground h-4 w-4" />
                                <div>
                                    <div className="text-xs text-muted-foreground">Total Terdaftar</div>
                                    <div className="font-semibold leading-tight">{enrollments.length}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <div>
                                    <div className="text-xs text-muted-foreground">Selesai</div>
                                    <div className="font-semibold leading-tight">{totalCompleted}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
                                <Clock className="h-4 w-4 text-yellow-500" />
                                <div>
                                    <div className="text-xs text-muted-foreground">Sedang Berjalan</div>
                                    <div className="font-semibold leading-tight">
                                        {enrollments.length - totalCompleted}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Table */}
                <div className="flex flex-col gap-4">
                    <Input
                        placeholder="Cari nama, email, atau NIK..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-sm"
                    />

                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">#</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>NIK</TableHead>
                                    <TableHead>Region</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tgl Daftar</TableHead>
                                    <TableHead>Tgl Selesai</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length > 0 ? (
                                    filtered.map((enrollment, index) => (
                                        <TableRow key={enrollment.user_id}>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">{enrollment.name}</TableCell>
                                            <TableCell className="text-sm">{enrollment.email}</TableCell>
                                            <TableCell className="text-sm">
                                                {enrollment.employee_id ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {enrollment.region ?? '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-muted h-2 w-24 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-2 rounded-full bg-primary transition-all"
                                                            style={{
                                                                width: `${enrollment.progress_percentage ?? 0}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {enrollment.progress_percentage ?? 0}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {enrollment.completed_at ? (
                                                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                        Selesai
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">Dalam Proses</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {enrollment.enrollment_at ?? '-'}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {enrollment.completed_at ?? '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={9}
                                            className="py-10 text-center text-muted-foreground"
                                        >
                                            {search ? 'Tidak ada hasil yang cocok.' : 'Belum ada student yang terdaftar.'}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

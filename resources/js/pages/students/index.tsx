import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { BookOpen, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Course {
    id: number;
    title: string;
    description?: string;
    category?: string;
    status?: string;
    enrollments_count: number;
}

interface Props {
    courses: Course[];
}

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pemantauan Students', href: '/students' },
];

export default function StudentsIndex({ courses }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pemantauan Students" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Pemantauan Students</h1>
                    <p className="text-muted-foreground">
                        Pilih course untuk melihat daftar student yang terdaftar.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {courses.length > 0 ? (
                        courses.map((course) => (
                            <Card key={course.id} className="flex flex-col transition-shadow hover:shadow-md">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="bg-primary/10 text-primary rounded-lg p-2 shrink-0">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        {course.status && (
                                            <Badge
                                                variant={course.status === 'published' ? 'default' : 'secondary'}
                                                className="capitalize"
                                            >
                                                {course.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="mt-2 text-base leading-snug">
                                        {course.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="pb-2">
                                    {course.category && (
                                        <p className="text-muted-foreground text-xs mb-2">{course.category}</p>
                                    )}
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Users className="h-4 w-4" />
                                        <span>
                                            <span className="font-semibold text-foreground">
                                                {course.enrollments_count}
                                            </span>{' '}
                                            student terdaftar
                                        </span>
                                    </div>
                                </CardContent>

                                <CardFooter className="mt-auto pt-3">
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => router.visit(`/students/${course.id}`)}
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        Lihat Students
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-muted-foreground">
                            <BookOpen className="mb-4 h-12 w-12 opacity-20" />
                            <p className="font-medium">Belum ada course tersedia.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

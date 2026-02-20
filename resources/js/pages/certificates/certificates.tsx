import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Head } from '@inertiajs/react';
import { Award, Download, Eye } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Course {
    id: number;
    title: string;
    description?: string;
}

interface CertificatesProps {
    courses: Course[];
}

export default function Certificates({ courses }: CertificatesProps) {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const breadcrumbs = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Sertifikat Saya',
            href: '/certificates',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* Modal Preview */}
            <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
                <DialogContent className="flex max-w-4xl h-[80vh] flex-col gap-2 p-6">
                    <DialogHeader className="shrink-9">
                        <DialogTitle className="text-base">{selectedCourse?.title}</DialogTitle>
                    </DialogHeader>
                    {selectedCourse && (
                        <iframe
                            src={`/certificate/${selectedCourse.id}`}
                            className="w-full flex-2 rounded-md border"
                            title="Certificate Preview"
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Head title="Sertifikat Saya" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Sertifikat Saya</h1>
                    <p className="text-muted-foreground">
                        Unduh sertifikat untuk kursus yang telah Anda selesaikan sebagai bukti pencapaian kompetensi.
                    </p>
                </div>

                <div className="grid auto-rows-min gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {courses.length > 0 ? (
                        courses.map((course) => (
                            <Card key={course.id} className="flex flex-col transition-shadow hover:shadow-md">
                                <CardHeader className="pb-3">
                                    <div className="mb-2 flex items-center gap-2">
                                        <div className="bg-primary/10 text-primary rounded-lg p-2">
                                            <Award className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                                    <CardDescription className="line-clamp-2">
                                        {course.description || 'Selamat! Anda telah menyelesaikan kursus ini.'}
                                    </CardDescription>
                                </CardHeader>

                                <CardFooter className="mt-auto gap-2 pt-4">
                                    <Button
                                        className="w-full gap-2"
                                        variant="outline"
                                        onClick={() => setSelectedCourse(course)}
                                    >
                                        <Eye className="h-4 w-4" />
                                        Lihat
                                    </Button>
                                    <a
                                        href={`/certificate/${course.id}/download`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full"
                                    >
                                        <Button className="w-full gap-2" variant="outline">
                                            <Download className="h-4 w-4" />
                                            Unduh PDF
                                        </Button>
                                    </a>
                                </CardFooter>
                                
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-muted-foreground">
                            <Award className="mb-4 h-12 w-12 opacity-20" />
                            <p className="font-medium">Belum ada sertifikat yang tersedia.</p>
                            <p className="text-sm">Selesaikan kursus dan kuis untuk membuka sertifikat Anda.</p>
                            <Button variant="link" className="mt-2" asChild>
                                <a href="/courses">Lihat Kursus</a>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

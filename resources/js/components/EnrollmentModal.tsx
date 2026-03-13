import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, Clock, Users, Award } from 'lucide-react';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface Course {
    id: number;
    title: string;
    description: string;
    category?: string;
    start_date?: string;
    end_date?: string;
    modules?: unknown[];
}

interface EnrollmentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    course: Course;
    onConfirm?: () => void;
}

export function EnrollmentModal({ open, onOpenChange, course, onConfirm }: EnrollmentModalProps) {
    const [isEnrolling, setIsEnrolling] = useState(false);

    const handleEnroll = () => {
        setIsEnrolling(true);
        
        router.post(`/courses/${course.id}/enroll`, {}, {
            onSuccess: () => {
                onOpenChange(false);
                if (onConfirm) onConfirm();
            },
            onError: () => {
                setIsEnrolling(false);
            },
            onFinish: () => {
                setIsEnrolling(false);
            }
        });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Tidak ditentukan';
        return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: localeId });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-[50vw] max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Konfirmasi Pendaftaran Kursus</DialogTitle>
                    <DialogDescription>
                        Pastikan Anda memahami informasi kursus sebelum mendaftar
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 overflow-y-auto pr-1 flex-1 min-h-0">
                    {/* Course Title */}
                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <BookOpen className="w-5 h-5 text-primary mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">{course.title}</h3>
                                {course.category && (
                                    <Badge variant="secondary" className="mt-1">
                                        {course.category}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {course.description && (
                        <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground leading-relaxed wrap-break-word whitespace-pre-wrap max-h-36 overflow-y-auto pr-1">
                                {course.description}
                            </p>
                        </div>
                    )}

                    {/* Course Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Waktu Mulai</p>
                                <p className="text-sm font-semibold mt-1">
                                    {formatDate(course.start_date)}
                                </p>
                            </div>
                        </div>

                        {/* End Date */}
                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <Clock className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Batas Akhir</p>
                                <p className="text-sm font-semibold mt-1">
                                    {formatDate(course.end_date)}
                                </p>
                            </div>
                        </div>

                        {/* Modules Count */}
                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Total Modul</p>
                                <p className="text-sm font-semibold mt-1">
                                    {course.modules?.length || 0} Modul Pembelajaran
                                </p>
                            </div>
                        </div>

                        {/* Certificate */}
                        <div className="flex items-start gap-3 rounded-lg border p-3">
                            <Award className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Sertifikat</p>
                                <p className="text-sm font-semibold mt-1">
                                    Tersedia setelah kursus selesai
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4">
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            <strong>Catatan:</strong> Setelah mendaftar, Anda dapat mengakses semua materi kursus dan harus menyelesaikan semua modul sebelum deadline untuk mendapatkan sertifikat.
                        </p>
                    </div>
                </div>

                <DialogFooter className="shrink-0 border-t pt-4 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isEnrolling}
                        className="w-full sm:w-auto"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                        className="w-full sm:w-auto"
                    >
                        {isEnrolling ? 'Mendaftar...' : 'Daftar Sekarang'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClockIcon, PlusCircle, Trash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SharedData } from '@/types';
import { useState } from 'react';
import { EnrollmentModal } from '@/components/EnrollmentModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Course {
    id: number;
    title: string;
    description: string;
    cover_url: string;
    category: string;
    status: string;
    created_at: string;
    start_date?: string;
    end_date?: string;
    modules?: Array<any>;
    creator: {
        name: string;
    };
    is_enrolled?: boolean;
}

export default function CoursesIndex({ courses }: { courses: Course[] }) {
    const { auth } = usePage<SharedData>().props;
    const canCreateCourse = auth.user.role === 'trainer' || auth.user.role === 'admin';
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);

    const handleEnrollClick = (course: Course) => {
        setSelectedCourse(course);
        setShowEnrollModal(true);
    };
    const [courseToDelete, setCourseToDelete] = useState<number | null>(null);

    const handleDelete = () => {
        if (courseToDelete) {
            router.delete(`/courses/${courseToDelete}`, {
                onSuccess: () => setCourseToDelete(null),
            });
        }
    };

    console.log(courses);
    return (
        <AppLayout breadcrumbs={[{ title: 'Courses', href: '/courses' }]}>
            <Head title="Courses" />

            <div className="container px-4 mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Available Courses</h1>
                    {canCreateCourse && (
                         <Button asChild>
                            <Link href="/courses/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Course
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
                            <div className="relative aspect-video w-full overflow-hidden bg-muted">
                                {course.cover_url ? (
                                    <img 
                                        src={course.cover_url} 
                                        alt={course.title} 
                                        className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full bg-linear-to-br from-indigo-500 to-purple-600 text-white">
                                         <span className="text-2xl font-bold">{course.title.charAt(0)}</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                     <Badge variant="secondary" className="bg-background/90 text-foreground shadow-xs backdrop-blur-sm">
                                        {course.category || 'General'}
                                    </Badge>
                                </div>
                            </div>
                            
                            <CardHeader className="pb-2">
                                <CardTitle className="line-clamp-2 text-xl">{course.title}</CardTitle>
                            </CardHeader>
                            
                            <CardContent className="grow pb-4">
                                <p className="text-muted-foreground line-clamp-3 text-sm">
                                    {course.description || 'No description available for this course.'}
                                </p>
                            </CardContent>
                            
                            <CardFooter className="relative border-t pt-4 bg-muted/50">
                                <div className="w-full flex items-center justify-between">
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <ClockIcon className="mr-1 h-3 w-3" />
                                        <span>{formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}</span>
                                    </div>
                                    
                                <div className="flex items-center gap-2">
                                        {canCreateCourse ? (
                                            <>
                                                <button 
                                                    onClick={() => setCourseToDelete(course.id)}
                                                    className="group flex items-center gap-1 cursor-pointer border border-red-600 px-3 py-1 rounded-[10px] text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200"
                                                >
                                                    <Trash className="h-4 w-4 group-hover:text-white transition-colors" />
                                                    <span className="text-xs font-medium">Remove</span>
                                                </button>

                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={`/courses/${course.id}`}>View Course</Link>
                                                </Button>
                                            </>
                                        ) : (
                                            // Cek status enrollment di sini
                                            course.is_enrolled ? (
                                                <Button asChild size="sm" variant="secondary">
                                                    <Link href={`/courses/${course.id}`}>
                                                        Lanjutkan Belajar
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleEnrollClick(course)}
                                                >
                                                    Daftar Kursus
                                                </Button>
                                            )
                                        )}
                                    </div>
                                    {/* AKHIR PERBAIKAN */}

                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                    
                    {courses.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                             <h3 className="text-lg font-medium">No courses available yet</h3>
                             <p className="text-muted-foreground">Check back later for new content.</p>
                        </div>
                    )}
                </div>

            {selectedCourse && (
                <EnrollmentModal
                    open={showEnrollModal}
                    onOpenChange={setShowEnrollModal}
                    course={selectedCourse}
                    onConfirm={() => {
                        window.location.href = `/courses/${selectedCourse.id}`;
                    }}
                />
            )}
            </div>

        

            <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the course and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            
        </AppLayout>
    );
}

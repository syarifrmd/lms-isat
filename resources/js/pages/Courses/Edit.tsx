import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import InputError from '@/components/input-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course } from '@/types';

export default function EditCourse({ course }: { course: Course }) {
    const { data, setData, post, processing, errors } = useForm({
        title: course.title || '',
        description: course.description || '',
        category: course.category || '',
        status: course.status || 'draft',
        start_date: course.start_date || '',
        end_date: course.end_date || '',
        cover_image: null as File | null,
        _method: 'PUT',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/courses/${course.id}`, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Courses', href: '/courses' },
            { title: 'Edit Course', href: `/courses/${course.id}/edit` }
        ]}>
            <Head title={`Edit ${course.title}`} />

            <div className="container mx-auto py-8 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Edit Course</CardTitle>
                        <CardDescription>
                            Update the course details below.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={submit}>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Course Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Advanced React Patterns"
                                    required
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('description', e.target.value)}
                                    placeholder="What will students learn in this course?"
                                    rows={5}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="space-y-2">
                                <Label>Waktu Kursus</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date" className="text-sm text-muted-foreground">Waktu Mulai</Label>
                                        <Input
                                            id="start_date"
                                            type="datetime-local"
                                            value={data.start_date ? data.start_date.substring(0, 16) : ''}
                                            onChange={(e) => setData('start_date', e.target.value)}
                                        />
                                        <InputError message={errors.start_date} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="end_date" className="text-sm text-muted-foreground">Waktu Deadline</Label>
                                        <Input
                                            id="end_date"
                                            type="datetime-local"
                                            value={data.end_date ? data.end_date.substring(0, 16) : ''}
                                            onChange={(e) => setData('end_date', e.target.value)}
                                        />
                                        <InputError message={errors.end_date} />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Tentukan periode waktu kursus berlangsung
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(value) => setData('category', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Development">Development</SelectItem>
                                            <SelectItem value="Business">Business</SelectItem>
                                            <SelectItem value="Design">Design</SelectItem>
                                            <SelectItem value="Marketing">Marketing</SelectItem>
                                            <SelectItem value="IT & Software">IT & Software</SelectItem>
                                            <SelectItem value="Personal Development">Personal Development</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                     <Select
                                        value={data.status}
                                        onValueChange={(value) => setData('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                            </div>

                             <div className="space-y-2">
                                <Label htmlFor="cover_image">Cover Image</Label>
                                {course.cover_url && (
                                    <div className="mb-2">
                                        <img src={course.cover_url} alt="Current Cover" className="w-32 h-20 object-cover rounded-md" />
                                    </div>
                                )}
                                <Input
                                    id="cover_image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setData('cover_image', e.target.files ? e.target.files[0] : null)}
                                />
                                <p className="text-xs text-muted-foreground">Recommended size: 1280x720px (16:9 aspect ratio)</p>
                                <InputError message={errors.cover_image} />
                            </div>

                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="outline" type="button" onClick={() => window.history.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update Course'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}

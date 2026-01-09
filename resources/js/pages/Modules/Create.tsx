import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Youtube, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import RichTextEditor from '@/components/rich-text-editor';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Course {
    id: number;
    title: string;
}

export default function ModuleCreate({ course, youtube_connected }: { course: Course, youtube_connected: boolean }) {
    const [docType, setDocType] = useState<'upload' | 'link'>('upload');
    
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        content_text: '',
        video: null as File | null,
        doc_file: null as File | null,
        doc_url: '',
    });

    const submitModule = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/courses/${course.id}/modules`, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Courses', href: '/courses' }, 
                { title: course.title, href: `/courses/${course.id}` },
                { title: 'Create Module', href: `/courses/${course.id}/modules/create` }
            ]}
        >
            <Head title={`Create Module - ${course.title}`} />

            <div className="container mx-auto px-4 py-8">
                <Button variant="ghost" className="mb-4" asChild>
                    <Link href={`/courses/${course.id}`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Course
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Add New Module</CardTitle>
                        <CardDescription>
                            Create a new module for {course.title}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitModule} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Module Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Introduction to..."
                                    required
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="video">Video Upload (Optional)</Label>
                                <div className="bg-muted/30 p-4 rounded-md border text-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-medium">YouTube Integration:</p>
                                        {youtube_connected ? (
                                            <span className="flex items-center text-green-600 dark:text-green-400 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Connected
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                                                <AlertCircle className="w-3 h-3 mr-1" /> Not Connected
                                            </span>
                                        )}
                                    </div>
                                    <ul className="list-disc ml-5 space-y-1 text-muted-foreground mb-3">
                                        <li>If you upload a video, it will be uploaded to the linked YouTube channel.</li>
                                        <li>YouTube OAuth2 authentication is required on the server.</li>
                                    </ul>
                                    {!youtube_connected && (
                                        <div className="mt-2">
                                             <a 
                                                href="/auth/google" 
                                                className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors text-xs font-medium"
                                                target="_blank"
                                            >
                                                <Youtube className="w-3 h-3" />
                                                Connect YouTube Channel
                                            </a>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                (Refreshes dashboard, you may need to reload this page after connecting)
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <Input
                                    id="video"
                                    type="file"
                                    accept="video/mp4,video/quicktime"
                                    onChange={(e) => setData('video', e.target.files ? e.target.files[0] : null)}
                                />
                                <InputError message={errors.video} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Description / Content</Label>
                                <div className="min-h-[300px]">
                                    <RichTextEditor
                                        value={data.content_text}
                                        onChange={(value) => setData('content_text', value)}
                                        placeholder="Write your module content here... You can paste images."
                                    />
                                </div>
                                <InputError message={errors.content_text} />
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <Label className="text-base">Document (Optional)</Label>
                                <RadioGroup defaultValue="upload" value={docType} onValueChange={(v: string) => setDocType(v as 'upload' | 'link')} className="flex space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="upload" id="r1" />
                                        <Label htmlFor="r1">Upload File</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="link" id="r2" />
                                        <Label htmlFor="r2">Google Drive / URL Link</Label>
                                    </div>
                                </RadioGroup>

                                {docType === 'upload' ? (
                                    <div className="space-y-2">
                                        <Input
                                            id="doc_file"
                                            type="file"
                                            onChange={(e) => setData('doc_file', e.target.files ? e.target.files[0] : null)}
                                        />
                                        <p className="text-xs text-muted-foreground">Upload a PDF, Docx, etc.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Input
                                            id="doc_url"
                                            type="url"
                                            placeholder="https://docs.google.com/..."
                                            value={data.doc_url}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('doc_url', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Paste the shareable link here.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={processing} size="lg">
                                    {processing ? 'Creating Module...' : 'Create Module'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

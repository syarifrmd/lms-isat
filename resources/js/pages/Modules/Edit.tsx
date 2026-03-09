import AppLayout from '@/layouts/app-layout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Youtube, CheckCircle, AlertCircle, Upload, Link2, ListVideo } from 'lucide-react';
import { useState } from 'react';
import RichTextEditor from '@/components/rich-text-editor';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import InputError from '@/components/input-error';

interface Course {
    id: number;
    title: string;
}

interface Module {
    id: number;
    title: string;
    video_url: string | null;
    doc_url: string | null;
    content_text: string | null;
    order_sequence: number;
}

interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string | null;
    published: string;
}

export default function ModuleEdit({ course, module, youtube_connected, youtube_videos = [] }: {
    course: Course;
    module: Module;
    youtube_connected: boolean;
    youtube_videos: YouTubeVideo[];
}) {
    const [docType, setDocType] = useState<'upload' | 'link'>(module.doc_url && !module.doc_url.startsWith('/storage') ? 'link' : 'upload');
    const [videoMode, setVideoMode] = useState<'upload' | 'link' | 'channel'>('upload');

    const { data, setData, post, processing, errors, progress } = useForm({
        _method: 'PUT',
        title: module.title || '',
        content_text: module.content_text || '',
        video_mode: 'upload' as 'upload' | 'link' | 'channel',
        video: null as File | null,
        video_link: '',
        youtube_video_id: '',
        doc_file: null as File | null,
        doc_url: module.doc_url || '',
    });

    const handleVideoModeChange = (mode: 'upload' | 'link' | 'channel') => {
        setVideoMode(mode);
        setData('video_mode', mode);
    };

    const submitModule = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/courses/${course.id}/modules/${module.id}`, {
            forceFormData: true,
        });
    };

    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Courses', href: '/courses' }, 
                { title: course.title, href: `/courses/${course.id}` },
                { title: 'Edit Module', href: `/courses/${course.id}/modules/${module.id}/edit` }
            ]}
        >
            <Head title={`Edit - ${module.title}`} />

            <div className="container mx-auto py-8 max-w-3xl">
                <Button variant="ghost" className="mb-4" asChild>
                    <Link href={`/courses/${course.id}`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Course
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Module</CardTitle>
                        <CardDescription>
                            Update details for {module.title}.
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
                                <div className="flex justify-between items-center">
                                    <Label>Video (Optional)</Label>
                                    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${youtube_connected ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' : 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30'}`}>
                                        {youtube_connected
                                            ? <><CheckCircle className="w-3 h-3 mr-1" /> YouTube Connected</>
                                            : <><AlertCircle className="w-3 h-3 mr-1" /> YouTube Not Connected</>
                                        }
                                    </span>
                                </div>

                                {module.video_url && (
                                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md border text-sm">
                                        <img
                                            src={`https://img.youtube.com/vi/${module.video_url}/mqdefault.jpg`}
                                            alt="Current video thumbnail"
                                            className="w-24 rounded shrink-0"
                                        />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Current video (ID: <span className="font-mono">{module.video_url}</span>)</p>
                                            <p className="text-xs text-muted-foreground mt-1">Select a new video below to replace it.</p>
                                        </div>
                                    </div>
                                )}

                                <RadioGroup value={videoMode} onValueChange={(v) => handleVideoModeChange(v as 'upload' | 'link' | 'channel')} className="flex flex-wrap gap-3">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="upload" id="vm-upload" />
                                        <Label htmlFor="vm-upload" className="flex items-center gap-1 cursor-pointer"><Upload className="w-3.5 h-3.5" /> Upload File</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="link" id="vm-link" />
                                        <Label htmlFor="vm-link" className="flex items-center gap-1 cursor-pointer"><Link2 className="w-3.5 h-3.5" /> Paste YouTube URL</Label>
                                    </div>
                                    {youtube_connected && (
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="channel" id="vm-channel" />
                                            <Label htmlFor="vm-channel" className="flex items-center gap-1 cursor-pointer"><ListVideo className="w-3.5 h-3.5" /> Pick from Channel</Label>
                                        </div>
                                    )}
                                </RadioGroup>

                                {videoMode === 'upload' && (
                                    <div className="space-y-2">
                                        <div className="bg-muted/30 p-3 rounded-md border text-xs text-muted-foreground">
                                            Video will be uploaded to the linked YouTube channel. OAuth2 authentication required.
                                            {!youtube_connected && (
                                                <div className="mt-2">
                                                    <a href="/auth/google" className="inline-flex items-center gap-1 bg-red-600 text-white px-2.5 py-1 rounded hover:bg-red-700 transition-colors text-xs font-medium" target="_blank">
                                                        <Youtube className="w-3 h-3" /> Connect YouTube Channel
                                                    </a>
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
                                )}

                                {videoMode === 'link' && (
                                    <div className="space-y-2">
                                        <Input
                                            id="video_link"
                                            type="url"
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            value={data.video_link}
                                            onChange={(e) => setData('video_link', e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">Paste a YouTube video URL. The video ID will be extracted automatically.</p>
                                        <InputError message={errors.video_link} />
                                    </div>
                                )}

                                {videoMode === 'channel' && youtube_connected && (
                                    <div className="space-y-2">
                                        {youtube_videos.length === 0 ? (
                                            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border">No videos found in your channel, or unable to list videos.</p>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                                                {youtube_videos.map((vid) => (
                                                    <button
                                                        key={vid.id}
                                                        type="button"
                                                        onClick={() => setData('youtube_video_id', vid.id)}
                                                        className={`rounded-md border overflow-hidden text-left transition-all hover:ring-2 hover:ring-primary focus:outline-none ${data.youtube_video_id === vid.id ? 'ring-2 ring-primary' : ''}`}
                                                    >
                                                        {vid.thumbnail ? (
                                                            <img src={vid.thumbnail} alt={vid.title} className="w-full aspect-video object-cover" />
                                                        ) : (
                                                            <div className="w-full aspect-video bg-muted flex items-center justify-center">
                                                                <Youtube className="w-6 h-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div className="p-1.5">
                                                            <p className="text-xs font-medium leading-tight line-clamp-2">{vid.title}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {data.youtube_video_id && (
                                            <p className="text-xs text-green-600 dark:text-green-400">Selected: <span className="font-mono">{data.youtube_video_id}</span></p>
                                        )}
                                        <InputError message={errors.youtube_video_id} />
                                    </div>
                                )}
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
                                        <p className="text-xs text-muted-foreground">Upload a PDF, Docx, etc. (Overwrites current document)</p>
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

                            <div className="flex flex-col gap-4 pt-4">
                                {progress && (
                                    <div className="w-full space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Uploading...</span>
                                            <span>{progress.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                                            <div 
                                                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                                                style={{ width: `${progress.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={processing} size="lg">
                                        {processing ? 'Updating Module...' : 'Update Module'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

interface Course {
    id: number;
    title: string;
}

interface Module {
    id: number;
    title: string;
    video_url: string | null;



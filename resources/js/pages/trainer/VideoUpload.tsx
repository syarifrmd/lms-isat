import InputError from '@/components/input-error';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle, Upload, Youtube } from 'lucide-react';

interface UploadedVideo {
    id: string;
    url: string;
}

interface VideoUploadProps {
    youtube_connected: boolean;
    uploaded_video?: UploadedVideo | null;
}

export default function VideoUpload({ youtube_connected, uploaded_video }: VideoUploadProps) {
    const { data, setData, post, processing, errors, progress } = useForm({
        title: '',
        description: '',
        video: null as File | null,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/trainer/video-upload', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Upload Video', href: '/trainer/video-upload' },
            ]}
        >
            <Head title="Upload Video" />

            <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
                <Button variant="ghost" className="w-fit" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Dashboard
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Upload Video Cepat</CardTitle>
                        <CardDescription>
                            Upload video langsung ke channel YouTube terhubung tanpa membuat course terlebih dahulu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert variant={youtube_connected ? 'default' : 'destructive'}>
                            {youtube_connected ? (
                                <CheckCircle className="h-4 w-4" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertTitle>
                                {youtube_connected ? 'YouTube Connected' : 'YouTube Belum Terhubung'}
                            </AlertTitle>
                            <AlertDescription className="mt-1">
                                {youtube_connected
                                    ? 'Akun YouTube siap digunakan untuk upload.'
                                    : 'Hubungkan YouTube dulu agar bisa upload video.'}
                                {!youtube_connected && (
                                    <a
                                        href="/auth/google"
                                        className="mt-3 inline-flex items-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                                    >
                                        <Youtube className="h-3.5 w-3.5" />
                                        Hubungkan YouTube
                                    </a>
                                )}
                            </AlertDescription>
                        </Alert>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Judul Video</Label>
                                <Input
                                    id="title"
                                    placeholder="Contoh: Pengenalan Materi Keselamatan Kerja"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                />
                                <InputError message={errors.title} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                                <textarea
                                    id="description"
                                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-hidden ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Tulis deskripsi video di sini..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="video">File Video</Label>
                                <Input
                                    id="video"
                                    type="file"
                                    accept="video/mp4,video/quicktime"
                                    onChange={(e) => setData('video', e.target.files ? e.target.files[0] : null)}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">Format yang didukung: MP4 atau MOV.</p>
                                <InputError message={errors.video} />
                            </div>

                            {progress && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Uploading...</span>
                                        <span>{progress.percentage}%</span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                                        <div
                                            className="h-2.5 rounded-full bg-primary transition-all duration-300"
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={processing || !youtube_connected} size="lg">
                                    <Upload className="mr-2 h-4 w-4" />
                                    {processing ? 'Mengupload...' : 'Upload ke YouTube'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {uploaded_video && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Upload Berhasil</CardTitle>
                            <CardDescription>Video sudah tersedia di YouTube.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p>
                                Video ID: <span className="font-mono">{uploaded_video.id}</span>
                            </p>
                            <a
                                href={uploaded_video.url}
                                className="inline-flex items-center gap-1 font-medium text-red-600 transition-colors hover:text-red-700"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Youtube className="h-4 w-4" />
                                Lihat di YouTube
                            </a>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

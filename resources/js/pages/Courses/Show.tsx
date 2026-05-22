import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PlayCircle, FileText, Plus, File as FileIcon, Link as LinkIcon, Edit, FileQuestion, Clock, Award, AlertCircle, Lock, CheckCircle, Star, MessageSquare, Trash2 } from 'lucide-react';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import { Document, Page, pdfjs } from 'react-pdf';
import { Quiz, SharedData } from '@/types';
import { type FormEvent, useEffect, useRef, useState } from 'react';

interface Module {
    id: number;
    title: string;
    video_url: string;
    doc_url: string;
    content_text: string;
    order_sequence: number;
    duration_minutes?: number;
    is_completed?: boolean;
    is_locked?: boolean;
    is_text_read?: boolean;
    is_video_watched?: boolean;
    is_document_read?: boolean;
    quizzes?: QuizWithProgress[];
}

interface QuizWithProgress extends Quiz {
    attempts_count?: number;
    is_passed?: boolean;
}

interface Course {
    id: number;
    title: string;
    description: string;
    modules: Module[];
    quizzes?: Quiz[];
    created_by: string;
    creator?: CourseCreator;
}

interface CourseCreator {
    name: string;
    id?: string;
}

interface UserRating {
    rating: number;
    review: string | null;
}

interface RatingData {
    average: number | null;
    count: number;
    distribution: Record<string, number>;
    user_rating: UserRating | null;
}

interface ShowProps {
    course: Course;
    userProgress?: number;
    isEnrolled?: boolean;
    ratingData?: RatingData;
}

let youtubeApiPromise: Promise<void> | null = null;

const loadYouTubeApi = () => {
    if (typeof window === 'undefined') {
        return Promise.resolve();
    }

    const ytWindow = window as Window & {
        YT?: any;
        onYouTubeIframeAPIReady?: (() => void) | null;
    };

    if (ytWindow.YT?.Player) {
        return Promise.resolve();
    }

    if (!youtubeApiPromise) {
        youtubeApiPromise = new Promise<void>((resolve) => {
            const existingScript = document.getElementById('youtube-iframe-api');

            const onReady = () => {
                resolve();
            };

            if (!existingScript) {
                const script = document.createElement('script');
                script.id = 'youtube-iframe-api';
                script.src = 'https://www.youtube.com/iframe_api';
                document.body.appendChild(script);
            }

            const previousReady = ytWindow.onYouTubeIframeAPIReady;
            ytWindow.onYouTubeIframeAPIReady = () => {
                if (previousReady) {
                    previousReady();
                }

                onReady();
            };
        });
    }

    return youtubeApiPromise;
};

export default function CourseShow({ course, userProgress = 0, isEnrolled = false, ratingData }: ShowProps) {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.user.role === 'admin';
    const isTrainer = auth.user.role === 'trainer' || isAdmin;
    const canTakeQuiz = auth.user.role === 'user';
    const isCreator = course.created_by === auth.user.id;
    const canManage = isAdmin || isCreator; // admin can manage all, trainer only own
    const trainerName = course?.creator?.name || 'Instructor';
    const trainerId = course?.creator?.id || 'N/A';

    const trainerInitials = trainerName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    const [activeModuleItem, setActiveModuleItem] = useState<string>('');
    const [previewModuleId, setPreviewModuleId] = useState<number | null>(null);

    // ── Quiz confirmation modal ──────────────────────────────────────────────
    const [confirmQuiz, setConfirmQuiz] = useState<QuizWithProgress | null>(null);

    const startQuiz = () => {
        if (!confirmQuiz) return;
        router.visit(`/quiz/${confirmQuiz.id}`);
    };

    // ── Rating form ─────────────────────────────────────────────────────────
    const [hovered, setHovered] = useState(0);
    const { data: ratingForm, setData: setRatingData, post: postRating, delete: deleteRating, processing: ratingProcessing } = useForm({
        rating: ratingData?.user_rating?.rating ?? 0,
        review: ratingData?.user_rating?.review ?? '',
    });

    const submitRating = (e: FormEvent) => {
        e.preventDefault();
        postRating(`/courses/${course.id}/ratings`, { preserveScroll: true });
    };

    const removeRating = () => {
        deleteRating(`/courses/${course.id}/ratings`, { preserveScroll: true });
    };

    const getPreviewUri = (url: string) => {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (typeof window === 'undefined') return url;
        return new URL(url, window.location.origin).toString();
    };

    const getFileName = (url: string) => {
        const clean = url.split('?')[0];
        const name = clean.split('/').pop();
        return name || 'Dokumen';
    };

    const getFileExtension = (url: string) => {
        const clean = url.split('?')[0].toLowerCase();
        return clean.split('.').pop() || '';
    };

    const getOfficePreviewUrl = (url: string) => {
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    };

    // Configure pdfjs worker from CDN
    try {
        // @ts-ignore
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    } catch (e) {
        // ignore in non-browser env
    }

    function PdfViewer({ url, onPageChange }: { url: string; onPageChange?: (current: number, total: number) => void }) {
        const [numPages, setNumPages] = useState<number>(0);
        const [currentPage, setCurrentPage] = useState<number>(1);
        const containerRef = useRef<HTMLDivElement | null>(null);
        const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
        const debounceRef = useRef<number | null>(null);

        useEffect(() => {
            return () => {
                if (debounceRef.current) {
                    window.clearTimeout(debounceRef.current);
                    debounceRef.current = null;
                }
            };
        }, []);

        useEffect(() => {
            if (!containerRef.current || numPages <= 0) return;

            const root = containerRef.current;
            let observed = false;

            const observer = new IntersectionObserver(
                (entries) => {
                    // find the entry with largest intersectionRatio
                    let best: IntersectionObserverEntry | null = null;
                    for (const e of entries) {
                        if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
                    }

                    if (best && best.isIntersecting) {
                        const pageStr = best.target.getAttribute('data-page-number');
                        const pageNum = pageStr ? Number(pageStr) : 1;
                        if (pageNum !== currentPage) {
                            setCurrentPage(pageNum);
                            if (onPageChange) {
                                if (debounceRef.current) window.clearTimeout(debounceRef.current);
                                debounceRef.current = window.setTimeout(() => {
                                    onPageChange(pageNum, numPages);
                                }, 700) as unknown as number;
                            }
                        }
                    }
                },
                { root, threshold: [0.45, 0.6, 0.9] }
            );

            for (let i = 1; i <= numPages; i++) {
                const el = pageRefs.current[i];
                if (el) {
                    observer.observe(el);
                    observed = true;
                }
            }

            return () => {
                if (observed) observer.disconnect();
            };
        }, [numPages, onPageChange, currentPage]);

        const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
            setNumPages(numPages);
            setCurrentPage(1);
            if (onPageChange) {
                // initial notify
                onPageChange(1, numPages);
            }
        };

        return (
            <div ref={containerRef} className="h-full overflow-y-auto">
                <Document file={url} onLoadSuccess={onDocumentLoadSuccess}>
                    {Array.from({ length: numPages || 0 }, (_, i) => {
                        const pageNumber = i + 1;
                        return (
                            <div
                                key={`page-${pageNumber}`}
                                data-page-number={String(pageNumber)}
                                ref={(el) => { pageRefs.current[pageNumber] = el; }}
                                className="mb-4"
                            >
                                <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} />
                            </div>
                        );
                    })}
                </Document>
                <div className="mt-2 text-xs text-gray-400">Halaman: {currentPage}/{numPages}</div>
            </div>
        );
    }

    const renderDocPreview = (docUrl: string, moduleId: number) => {
        const fullUrl = getPreviewUri(docUrl);
        const extension = getFileExtension(docUrl);
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
        const isPdf = extension === 'pdf';
        const isOffice = ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(extension);
        const shouldLoadPreview = previewModuleId === moduleId;

        if (!shouldLoadPreview) {
            return (
                <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
                    <div className="rounded-full bg-sky-100 p-3 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                        <FileIcon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Preview dokumen dimuat saat dibutuhkan</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Ini mengurangi beban halaman agar tidak freeze saat membuka course.</p>
                    </div>
                    <Button size="sm" onClick={() => setPreviewModuleId(moduleId)}>
                        Tampilkan Preview
                    </Button>
                </div>
            );
        }

        if (isImage) {
            return (
                <div className="bg-gray-50 p-3 dark:bg-gray-900/30">
                    <img
                        src={fullUrl}
                        alt={getFileName(docUrl)}
                        className="max-h-130 w-full rounded-lg object-contain"
                        loading="lazy"
                    />
                </div>
            );
        }

        if (isPdf) {
            return (
                <div className="h-130 w-full">
                    <PdfViewer url={fullUrl} />
                </div>
            );
        }

        if (isOffice) {
            return (
                <iframe
                    src={getOfficePreviewUrl(fullUrl)}
                    title={getFileName(docUrl)}
                    className="h-130 w-full"
                    loading="lazy"
                />
            );
        }

        return (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Preview tidak tersedia untuk tipe file ini.</p>
                <Button variant="outline" size="sm" asChild>
                    <a href={docUrl} target="_blank" rel="noopener noreferrer">
                        Buka Dokumen
                    </a>
                </Button>
            </div>
        );
    };

    const ModuleProgressTracker = ({ module }: { module: Module }) => {
        const isUser = !isTrainer;

        const videoContainerRef = useRef<HTMLDivElement | null>(null);
        const videoPlayerRef = useRef<any>(null);
        const videoStateRef = useRef({ currentTime: 0, maxTime: 0, duration: 0 });
        const videoTimerRef = useRef<number | null>(null);
        const videoCompletionSentRef = useRef(false);

        const textContainerRef = useRef<HTMLDivElement | null>(null);
        const textElapsedRef = useRef(0);
        const textCompletionSentRef = useRef(false);
        const [textElapsedSeconds, setTextElapsedSeconds] = useState(0);
        const [textScrollPercentage, setTextScrollPercentage] = useState(0);

        const docContainerRef = useRef<HTMLDivElement | null>(null);
        const docCompletionSentRef = useRef(false);
        const [docScrollPercentage, setDocScrollPercentage] = useState(0);
        const docLastPageRef = useRef<number>(0);

        const postProgress = (path: string, payload: Record<string, number>) => {
            router.post(path, payload, {
                preserveScroll: true,
                preserveState: true,
            });
        };

        useEffect(() => {
            if (!isUser || !module.video_url || !videoContainerRef.current) {
                return;
            }

            let cancelled = false;

            const clearTimer = () => {
                if (videoTimerRef.current) {
                    window.clearInterval(videoTimerRef.current);
                    videoTimerRef.current = null;
                }
            };

            const maybeCompleteVideo = () => {
                const duration = videoStateRef.current.duration || (module.duration_minutes ? module.duration_minutes * 60 : 0);

                if (duration <= 0) {
                    return;
                }

                const threshold = Math.max(duration - 2, 0);
                const { currentTime, maxTime } = videoStateRef.current;

                if (!videoCompletionSentRef.current && currentTime >= threshold && maxTime >= threshold) {
                    videoCompletionSentRef.current = true;
                    postProgress(`/modules/${module.id}/progress/video`, {
                        current_time_seconds: currentTime,
                        max_position_seconds: maxTime,
                        duration_seconds: duration,
                    });
                }
            };

            const tick = () => {
                const player = videoPlayerRef.current;

                if (!player || typeof player.getCurrentTime !== 'function') {
                    return;
                }

                const currentTime = Number(player.getCurrentTime() || 0);
                const playerDuration = typeof player.getDuration === 'function' ? Number(player.getDuration() || 0) : 0;
                const duration = playerDuration > 0 ? playerDuration : (module.duration_minutes ?? 0) * 60;
                const maxTime = Math.max(videoStateRef.current.maxTime, currentTime);

                if (currentTime > maxTime + 2 && typeof player.seekTo === 'function') {
                    player.seekTo(maxTime, true);
                    return;
                }

                videoStateRef.current = {
                    currentTime,
                    maxTime,
                    duration: duration || videoStateRef.current.duration,
                };

                maybeCompleteVideo();
            };

            const initPlayer = async () => {
                await loadYouTubeApi();

                const ytWindow = window as Window & { YT?: any };

                if (cancelled || !videoContainerRef.current || !ytWindow.YT?.Player) {
                    return;
                }

                const YT = ytWindow.YT;

                if (videoPlayerRef.current?.destroy) {
                    videoPlayerRef.current.destroy();
                }

                videoPlayerRef.current = new YT.Player(videoContainerRef.current, {
                    videoId: module.video_url,
                    playerVars: {
                        controls: 1,
                        rel: 0,
                        modestbranding: 1,
                        fs: 1,
                        playsinline: 1,
                        disablekb: 1,
                        origin: window.location.origin,
                        enablejsapi: 1,
                    },
                    events: {
                        onReady: (event: any) => {
                            videoStateRef.current.duration = Number(event.target.getDuration?.() || 0) || (module.duration_minutes ? module.duration_minutes * 60 : 0);
                        },
                        onStateChange: (event: any) => {
                            if (event.data === YT.PlayerState.PLAYING) {
                                clearTimer();
                                videoTimerRef.current = window.setInterval(tick, 1000);
                            }

                            if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                                clearTimer();
                                tick();
                                if (event.data === YT.PlayerState.ENDED) {
                                    videoStateRef.current.maxTime = Math.max(videoStateRef.current.maxTime, videoStateRef.current.duration);
                                    videoStateRef.current.currentTime = Math.max(videoStateRef.current.currentTime, videoStateRef.current.duration);
                                    maybeCompleteVideo();
                                }
                            }
                        },
                    },
                });
            };

            initPlayer();

            return () => {
                cancelled = true;
                clearTimer();

                if (videoPlayerRef.current?.destroy) {
                    videoPlayerRef.current.destroy();
                    videoPlayerRef.current = null;
                }
            };
        }, [module.id, module.video_url, module.duration_minutes, isUser]);

        useEffect(() => {
            if (!isUser || !module.content_text || !textContainerRef.current) {
                return;
            }

            const container = textContainerRef.current;

            const evaluateText = () => {
                const scrollableHeight = Math.max(container.scrollHeight - container.clientHeight, 0);
                const scrollPercentage = scrollableHeight <= 0
                    ? 100
                    : Math.min(100, ((container.scrollTop + container.clientHeight) / container.scrollHeight) * 100);

                setTextScrollPercentage(scrollPercentage);

                if (!textCompletionSentRef.current && textElapsedRef.current >= 15 && scrollPercentage >= 99) {
                    textCompletionSentRef.current = true;
                    postProgress(`/modules/${module.id}/progress/text`, {
                        elapsed_seconds: textElapsedRef.current,
                        scroll_percentage: scrollPercentage,
                    });
                }
            };

            const onScroll = () => {
                evaluateText();
            };

            const timer = window.setInterval(() => {
                textElapsedRef.current += 1;
                setTextElapsedSeconds(textElapsedRef.current);
                evaluateText();
            }, 1000);

            container.addEventListener('scroll', onScroll, { passive: true });
            evaluateText();

            return () => {
                window.clearInterval(timer);
                container.removeEventListener('scroll', onScroll);
            };
        }, [module.id, module.content_text, isUser]);

        useEffect(() => {
            if (!isUser || !module.doc_url || !docContainerRef.current) {
                return;
            }

            const container = docContainerRef.current;

            const evaluateDocument = () => {
                const scrollableHeight = Math.max(container.scrollHeight - container.clientHeight, 0);
                const scrollPercentage = scrollableHeight <= 0
                    ? 100
                    : Math.min(100, ((container.scrollTop + container.clientHeight) / container.scrollHeight) * 100);

                setDocScrollPercentage(scrollPercentage);

                if (!docCompletionSentRef.current && scrollPercentage >= 99) {
                    const estimatedPages = Math.max(1, Math.ceil(container.scrollHeight / Math.max(container.clientHeight, 1)));
                    docCompletionSentRef.current = true;
                    postProgress(`/modules/${module.id}/progress/document`, {
                        current_page: estimatedPages,
                        total_pages: estimatedPages,
                    });
                }
            };

            const onScroll = () => {
                evaluateDocument();
            };

            container.addEventListener('scroll', onScroll, { passive: true });
            evaluateDocument();

            return () => {
                container.removeEventListener('scroll', onScroll);
            };
        }, [module.id, module.doc_url, isUser, previewModuleId]);

        useEffect(() => {
            if (!isUser || !module.doc_url) return;

            const sendFinal = () => {
                const current = docLastPageRef.current || 0;
                if (!current) return;
                // best-effort: use navigator.sendBeacon or fetch keepalive
                const totalEstimate = Math.max(1, Math.round((docScrollPercentage / 100) * (current || 1)));
                try {
                    const url = `/modules/${module.id}/progress/document`;
                    const payload = JSON.stringify({ current_page: current, total_pages: totalEstimate });
                    if (navigator && typeof navigator.sendBeacon === 'function') {
                        const blob = new Blob([payload], { type: 'application/json' });
                        navigator.sendBeacon(url, blob);
                    } else {
                        fetch(url, { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true });
                    }
                } catch (e) {
                    // ignore
                }
            };

            const onBeforeUnload = () => sendFinal();
            const onVisibilityChange = () => {
                if (document.visibilityState === 'hidden') sendFinal();
            };

            window.addEventListener('beforeunload', onBeforeUnload);
            document.addEventListener('visibilitychange', onVisibilityChange);

            return () => {
                window.removeEventListener('beforeunload', onBeforeUnload);
                document.removeEventListener('visibilitychange', onVisibilityChange);
            };
        }, [isUser, module.doc_url, module.id, docScrollPercentage]);

        if (!isUser) {
            return (
                <>
                    {module.video_url && (
                        <div className="mb-4">
                            <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${module.video_url}`}
                                    title={module.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute top-0 left-0 w-full h-full"
                                />
                            </div>
                        </div>
                    )}

                    {module.doc_url && (
                        <div className="mb-4 space-y-3">
                            <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="bg-sky-100 dark:bg-sky-900/40 p-2 rounded-lg shrink-0">
                                        <FileIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-gray-800 dark:text-gray-100">Dokumen Modul</p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {module.doc_url.startsWith('/storage/')
                                                ? getFileName(module.doc_url)
                                                : module.doc_url.replace(/^https?:\/\//, '').split('/')[0]}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" asChild className="shrink-0">
                                    <a href={module.doc_url} target="_blank" rel="noopener noreferrer">
                                        Lihat / Unduh <LinkIcon className="ml-2 w-3 h-3" />
                                    </a>
                                </Button>
                            </div>

                            <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                                {renderDocPreview(module.doc_url, module.id)}
                            </div>
                        </div>
                    )}

                    {module.content_text && (
                        <div className="mt-2">
                            <div className="prose prose-sm dark:prose-invert max-w-none rich-text-content"
                                dangerouslySetInnerHTML={{ __html: module.content_text }} />
                        </div>
                    )}
                </>
            );
        }

        return (
            <>
                {module.video_url && (
                    <div className="mb-4">
                        <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
                            <div ref={videoContainerRef} className="absolute inset-0" />
                        </div>
                        {!module.is_video_watched && (
                            <p className="mt-2 text-xs text-gray-400">
                                Video akan terkunci dari skip maju dan otomatis selesai setelah sampai akhir.
                            </p>
                        )}
                        {module.is_video_watched && (
                            <div className="mt-2 flex justify-end">
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Video Watched
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {module.doc_url && (
                    <div className="mb-4 space-y-3">
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="bg-sky-100 dark:bg-sky-900/40 p-2 rounded-lg shrink-0">
                                    <FileIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm text-gray-800 dark:text-gray-100">Dokumen Modul</p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {module.doc_url.startsWith('/storage/')
                                            ? getFileName(module.doc_url)
                                            : module.doc_url.replace(/^https?:\/\//, '').split('/')[0]}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" asChild className="shrink-0">
                                <a href={module.doc_url} target="_blank" rel="noopener noreferrer">
                                    Lihat / Unduh <LinkIcon className="ml-2 w-3 h-3" />
                                </a>
                            </Button>
                        </div>

                        <div ref={docContainerRef} className="h-136 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            {!previewModuleId || previewModuleId !== module.id ? (
                                <div className="flex min-h-72 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
                                    <div className="rounded-full bg-sky-100 p-3 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                                        <FileIcon className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Preview dokumen dimuat saat dibutuhkan</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">Scroll sampai bawah untuk menandai dokumen selesai dibaca.</p>
                                    </div>
                                    <Button size="sm" onClick={() => setPreviewModuleId(module.id)}>
                                        Tampilkan Preview
                                    </Button>
                                </div>
                            ) : (
                                <div className="h-full p-3">
                                    {getFileExtension(module.doc_url) === 'pdf' ? (
                                        <PdfViewer
                                            url={getPreviewUri(module.doc_url)}
                                            onPageChange={(current, total) => {
                                                docLastPageRef.current = current;
                                                setDocScrollPercentage((current / Math.max(total, 1)) * 100);
                                                if (!docCompletionSentRef.current) {
                                                    postProgress(`/modules/${module.id}/progress/document`, {
                                                        current_page: current,
                                                        total_pages: total,
                                                    });

                                                    if (current >= total) {
                                                        docCompletionSentRef.current = true;
                                                    }
                                                }
                                            }}
                                        />
                                    ) : (
                                        <DocViewer
                                            documents={[{ uri: getPreviewUri(module.doc_url), fileName: getFileName(module.doc_url) }]}
                                            pluginRenderers={DocViewerRenderers}
                                            config={{ header: { disableHeader: true } }}
                                            style={{ height: '100%' }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400">
                            Progress dokumen: {Math.round(docScrollPercentage)}%.
                        </p>
                    </div>
                )}

                {module.content_text && (
                    <div className="mt-2">
                        <div ref={textContainerRef} className="max-h-136 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                            <div className="prose prose-sm dark:prose-invert max-w-none rich-text-content"
                                dangerouslySetInnerHTML={{ __html: module.content_text }} />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                            <span>Timer baca: {textElapsedSeconds} detik</span>
                            <span>Scroll: {Math.round(textScrollPercentage)}%</span>
                        </div>
                    </div>
                )}
            </>
        );
    };


    return (
        <AppLayout 
            breadcrumbs={[
                { title: 'Courses', href: '/courses' }, 
                { title: course.title, href: `/courses/${course.id}` }
            ]}
        >
            <Head title={course.title} />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* ── Course Title Header ── */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-linear-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 shadow-sm px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Course</p>
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{course.title}</h1>
                            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{course.description}</p>
                        </div>
                        {isTrainer && canManage && (
                            <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
                                <Link href={`/courses/${course.id}/edit`}>
                                    <Edit className="w-3.5 h-3.5" />
                                    Edit Course
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Main grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT: Modules */}
                    <div className="lg:col-span-2 flex flex-col gap-4">

                        {/* Section header row */}
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                Course Modules
                                <span className="ml-2 text-gray-300 dark:text-gray-600 normal-case tracking-normal font-normal">
                                    ({course.modules.length})
                                </span>
                            </p>
                            {isTrainer && canManage && (
                                <Button asChild size="sm">
                                    <Link href={`/courses/${course.id}/modules/create`}>
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        Add Module
                                    </Link>
                                </Button>
                            )}
                        </div>

                        {/* Modules accordion */}
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                            <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                                value={activeModuleItem}
                                onValueChange={(value) => {
                                    setActiveModuleItem(value);
                                    setPreviewModuleId(null);
                                }}
                            >
                                {course.modules.length > 0 ? (
                                    course.modules.map((module, index) => (
                                        <AccordionItem key={module.id} value={`item-${module.id}`} disabled={module.is_locked}
                                            className="border-b border-gray-50 dark:border-gray-700/60 last:border-0">
                                            <AccordionTrigger className={`px-5 py-4 hover:no-underline hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors ${module.is_locked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <div className="flex items-center gap-4 text-left w-full">
                                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold shrink-0 ${
                                                        module.is_completed
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                                            : module.is_locked
                                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                                            : 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400'
                                                    }`}>
                                                        {module.is_completed ? <CheckCircle className="w-4 h-4" /> :
                                                         module.is_locked   ? <Lock className="w-3.5 h-3.5" /> :
                                                         index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                                            {module.title}
                                                            {module.is_locked && <span className="text-xs font-normal text-gray-400">(Locked)</span>}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                                                            {module.video_url && (
                                                                <span className="flex items-center gap-1"><PlayCircle className="w-3 h-3" /> Video</span>
                                                            )}
                                                            {module.doc_url && (
                                                                <a href={module.doc_url} target="_blank" rel="noopener noreferrer"
                                                                    className="flex items-center gap-1 hover:text-sky-500 transition-colors"
                                                                    onClick={e => e.stopPropagation()}>
                                                                    <FileIcon className="w-3 h-3" /> Document
                                                                </a>
                                                            )}
                                                            {module.content_text && (
                                                                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Text</span>
                                                            )}
                                                            {(module.quizzes?.length ?? 0) > 0 && (
                                                                <span className="flex items-center gap-1"><FileQuestion className="w-3 h-3" /> Quiz</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isTrainer && canManage && (
                                                        <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                                            <Link href={`/courses/${course.id}/modules/${module.id}/edit`}>
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </AccordionTrigger>

                                            <AccordionContent className="px-5 py-4 bg-gray-50/50 dark:bg-gray-700/20">
                                                <ModuleProgressTracker module={module} />

                                                {((isTrainer && canManage) || (module.quizzes?.length ?? 0) > 0) && (
                                                    <div className="mt-5 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                                                <FileQuestion className="w-3.5 h-3.5" /> Assessments
                                                            </p>
                                                            {isTrainer && canManage && (
                                                                <Button asChild size="sm" variant="outline">
                                                                    <Link href={`/assessments/${course.id}/quizzes/create`}>
                                                                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Quiz
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            {module.quizzes!.map((quiz) => (
                                                                <div key={quiz.id}
                                                                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50/60 dark:hover:bg-gray-700/40 transition-colors">
                                                                    <div className="flex-1 min-w-0 mr-4">
                                                                        <h3 className="font-medium text-sm text-gray-800 dark:text-gray-100 mb-1 truncate">{quiz.title}</h3>
                                                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                                                                            <span className="flex items-center gap-1">
                                                                                <FileQuestion className="h-3 w-3" />{quiz.questions_count || 0} Qs
                                                                            </span>
                                                                            {quiz.passing_score && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <AlertCircle className="h-3 w-3" />Pass: {quiz.passing_score}%
                                                                                </span>
                                                                            )}
                                                                            {quiz.is_timed && (
                                                                                <span className="flex items-center gap-1">
                                                                                    <Clock className="h-3 w-3" />{Math.floor((quiz.time_limit_second || 0) / 60)}m
                                                                                </span>
                                                                            )}
                                                                            <span className={`flex items-center gap-1 ${(quiz.attempts_count || 0) >= 3 ? 'text-red-500 font-medium' : ''}`}>
                                                                                <Award className="h-3 w-3" />
                                                                                Attempt: {quiz.attempts_count || 0}/3
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {(() => {
                                                                        const q = quiz;
                                                                        const attempts = q.attempts_count || 0;
                                                                        if (!canTakeQuiz) return (
                                                                            <Button size="sm" variant="outline" disabled className="h-7 px-2 text-[11px] cursor-not-allowed">
                                                                                <Lock className="w-3 h-3 mr-1" /> Khusus User
                                                                            </Button>
                                                                        );
                                                                        if (q.is_passed) return (
                                                                            <Button size="sm" variant="outline"
                                                                                className="h-7 px-2 text-[11px] text-emerald-600 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 cursor-default">
                                                                                <CheckCircle className="w-3 h-3 mr-1" /> Lulus
                                                                            </Button>
                                                                        );
                                                                        if (attempts >= 3) return (
                                                                            <Button size="sm" variant="destructive" disabled className="h-7 px-2 text-[11px] opacity-75 cursor-not-allowed">
                                                                                <AlertCircle className="w-3 h-3 mr-1" /> Tidak lulus
                                                                            </Button>
                                                                        );
                                                                        return (
                                                                            <Button size="sm" className="h-7 px-2 text-[11px]" onClick={() => setConfirmQuiz(quiz)}>
                                                                                Start Quiz
                                                                            </Button>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))
                                ) : (
                                    <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
                                        No modules yet. Add one to get started!
                                    </div>
                                )}
                            </Accordion>
                        </div>
                    </div>

                    {/* RIGHT: Sidebar – order-first on mobile, last column on desktop */}
                    <div className="flex flex-col gap-3 lg:gap-4 order-first lg:order-last">

                        {/* Progress card */}
                        {!isTrainer && (
                            <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-linear-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 shadow-sm p-4 lg:p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-sky-400">Progress Belajar</p>
                                    <span className="text-2xl lg:text-xl font-bold text-sky-600 leading-none">{userProgress}%</span>
                                </div>
                                <div className="w-full bg-sky-100 dark:bg-sky-900/40 rounded-full h-2.5">
                                    <div
                                        className="bg-sky-500 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${userProgress}%` }}
                                    />
                                </div>
                                <p className="mt-1.5 text-[11px] sm:text-xs text-sky-400">{userProgress < 100 ? 'Selesaikan semua modul untuk mendapat sertifikat' : ''}</p>
                                {userProgress === 100 && (
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-semibold flex items-center gap-1.5">
                                        <CheckCircle className="w-4 h-4" /> Kursus Selesai!
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Instructor card */}
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 lg:p-5">
                            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Instruktur</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 lg:h-11 lg:w-11 rounded-full bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300 flex items-center justify-center font-bold text-sm lg:text-base shrink-0">
                                    {trainerInitials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-sm lg:text-sm text-gray-800 dark:text-gray-100 truncate">{trainerName}</p>
                                    <p className="text-[11px] sm:text-xs text-gray-400">Pembuat Kursus</p>
                                    <p className="text-[11px] sm:text-xs text-gray-400">ID: {trainerId}</p>
                                </div>
                            </div>
                        </div>

                        {/* Rating card */}
                        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-4 lg:p-5 space-y-3 lg:space-y-4">
                            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Course Rating
                            </p>

                            {/* Average */}
                            <div className="flex items-end gap-3">
                                <span className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 leading-none">
                                    {ratingData?.average ?? '—'}
                                </span>
                                <div className="pb-0.5 space-y-1">
                                    <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(s => (
                                            <Star key={s} className={`w-3 h-3 sm:w-4 sm:h-4 ${
                                                s <= Math.round(ratingData?.average ?? 0)
                                                    ? 'text-amber-400 fill-amber-400'
                                                    : 'text-gray-200 dark:text-gray-600'
                                            }`} />
                                        ))}
                                    </div>
                                    <p className="text-[11px] sm:text-xs text-gray-400">{ratingData?.count ?? 0} rating{ratingData?.count !== 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            {/* Distribution bars */}
                            {(ratingData?.count ?? 0) > 0 && (
                                <div className="space-y-1.5">
                                    {[5,4,3,2,1].map(star => {
                                        const count = ratingData?.distribution?.[star] ?? 0;
                                        const pct = ratingData?.count ? Math.round((count / ratingData.count) * 100) : 0;
                                        return (
                                            <div key={star} className="flex items-center gap-2 text-xs">
                                                <span className="w-3 text-gray-400">{star}</span>
                                                <Star className="w-3 h-3 shrink-0 text-amber-400 fill-amber-400" />
                                                <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="w-6 text-right text-gray-400">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Rating form – enrolled users */}
                            {!isTrainer && isEnrolled && (
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 lg:pt-4 space-y-3">
                                    <p className="text-[13px] sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {ratingData?.user_rating ? 'Rating Anda' : 'Beri Rating Kursus'}
                                    </p>
                                    <form onSubmit={submitRating} className="space-y-3">
                                        <div className="flex gap-1">
                                            {[1,2,3,4,5].map(star => (
                                                <button key={star} type="button"
                                                    onMouseEnter={() => setHovered(star)}
                                                    onMouseLeave={() => setHovered(0)}
                                                    onClick={() => setRatingData('rating', star)}
                                                    className="p-0.5 focus:outline-none">
                                                    <Star className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                                                        star <= (hovered || ratingForm.rating)
                                                            ? 'text-amber-400 fill-amber-400'
                                                            : 'text-gray-200 dark:text-gray-600'
                                                    }`} />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={ratingForm.review}
                                            onChange={e => setRatingData('review', e.target.value)}
                                            placeholder="Share your experience (optional)..."
                                            rows={3}
                                            className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        />
                                        <div className="flex gap-2">
                                            <Button type="submit" size="sm"
                                                disabled={ratingProcessing || ratingForm.rating === 0}
                                                className="flex-1 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white">
                                                <Star className="w-3.5 h-3.5 fill-white" />
                                                {ratingData?.user_rating ? 'Update' : 'Submit'} Rating
                                            </Button>
                                            {ratingData?.user_rating && (
                                                <Button type="button" size="sm" variant="outline"
                                                    disabled={ratingProcessing} onClick={removeRating}
                                                    className="gap-1 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/20">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Not enrolled */}
                            {!isTrainer && !isEnrolled && (
                                <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-3 py-2.5 text-xs text-gray-400">
                                    <MessageSquare className="w-4 h-4 shrink-0" />
                                    Daftar kursus untuk memberi rating
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        {/* ── Quiz Confirmation Modal ── */}
            <Dialog open={!!confirmQuiz} onOpenChange={(open) => { if (!open) setConfirmQuiz(null); }}>
                <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">Mulai Quiz</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                            Pastikan kamu siap sebelum memulai quiz ini.
                        </DialogDescription>
                    </DialogHeader>

                    {confirmQuiz && (
                        <div className="space-y-3 py-1">
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">{confirmQuiz.title}</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-3 py-2.5">
                                    <FileQuestion className="w-4 h-4 text-sky-500 shrink-0" />
                                    <div>
                                        <p className="text-[11px] text-gray-400">Jumlah Soal</p>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{confirmQuiz.questions_count || 0} soal</p>
                                    </div>
                                </div>
                                {confirmQuiz.is_timed && (
                                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-3 py-2.5">
                                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-gray-400">Batas Waktu</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                {Math.floor((confirmQuiz.time_limit_second || 0) / 60)} menit
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {confirmQuiz.passing_score != null && (
                                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-3 py-2.5">
                                        <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-gray-400">Nilai Lulus</p>
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{confirmQuiz.passing_score}%</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 px-3 py-2.5">
                                    <AlertCircle className={`w-4 h-4 shrink-0 ${
                                        (confirmQuiz.attempts_count || 0) >= 2 ? 'text-red-500' : 'text-gray-400'
                                    }`} />
                                    <div>
                                        <p className="text-[11px] text-gray-400">Percobaan</p>
                                        <p className={`text-sm font-semibold ${
                                            (confirmQuiz.attempts_count || 0) >= 2 ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'
                                        }`}>
                                            {confirmQuiz.attempts_count || 0}/3 digunakan
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {(confirmQuiz.attempts_count || 0) >= 2 && (
                                <div className="flex items-center gap-2 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 text-xs text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    Ini adalah percobaan terakhirmu. Gunakan dengan bijak!
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex-row gap-2 sm:flex-row">
                        <Button variant="outline" className="flex-1" onClick={() => setConfirmQuiz(null)}>Batal</Button>
                        <Button className="flex-1" onClick={startQuiz}>
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Mulai Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
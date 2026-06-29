import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PlayCircle, FileText, Plus, File as FileIcon, Link as LinkIcon, Edit, FileQuestion, Clock, Award, AlertCircle, Lock, CheckCircle, Star, MessageSquare, Trash2, Volume2, VolumeX, Maximize, Minimize, Play, Pause, Terminal, Download } from 'lucide-react';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import PptxSlideViewer from '@/components/PptxSlideViewer';
import { PDFViewer, PDFViewerRef } from '@embedpdf/react-pdf-viewer';
import { Quiz, SharedData } from '@/types';
import { type FormEvent, useEffect, useRef, useState, useMemo, memo, useCallback } from 'react';

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
    doc_current_page?: number;
    doc_total_pages?: number;
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
    target_division?: string;
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

    const isLocalUrl = (url: string) => {
        if (!url) return false;
        try {
            const hostname = new URL(url).hostname;
            return (
                hostname === 'localhost' ||
                hostname === '127.0.0.1' ||
                hostname === '[::1]' ||
                hostname.endsWith('.test') ||
                hostname.endsWith('.local')
            );
        } catch (e) {
            if (typeof window !== 'undefined') {
                const hostname = window.location.hostname;
                return (
                    hostname === 'localhost' ||
                    hostname === '127.0.0.1' ||
                    hostname === '[::1]' ||
                    hostname.endsWith('.test') ||
                    hostname.endsWith('.local')
                );
            }
            return false;
        }
    };

    interface LocalOfficePlaceholderProps {
        url: string;
        fileName: string;
        isStudentView?: boolean;
        onSimulateComplete?: () => void;
        isCompleted?: boolean;
    }

    const LocalOfficePlaceholder = memo(function LocalOfficePlaceholder({
        url,
        fileName,
        isStudentView = false,
        onSimulateComplete,
        isCompleted = false
    }: LocalOfficePlaceholderProps) {
        const [showInstructions, setShowInstructions] = useState(false);

        return (
            <div className="flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/40 dark:to-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl min-h-72 select-none my-2">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-2xl mb-3">
                    <AlertCircle className="w-8 h-8" />
                </div>
                
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Preview PPTX/Office Terbatas di Localhost
                </h3>
                
                <p className="max-w-md text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed px-4">
                    Dokumen <span className="font-semibold text-sky-600 dark:text-sky-400">{fileName}</span> menggunakan Microsoft Office Web Viewer yang membutuhkan URL publik. Server Microsoft tidak dapat mengakses alamat <span className="font-mono bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">localhost</span> komputer Anda.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-xs mb-2">
                    <Button size="sm" asChild className="gap-1.5 flex-1 shadow-sm h-9">
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-3.5 h-3.5" />
                            Buka / Unduh File
                        </a>
                    </Button>

                    {isStudentView && !isCompleted && onSimulateComplete && (
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={onSimulateComplete}
                            className="gap-1.5 flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 h-9"
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Simulasi Selesai
                        </Button>
                    )}
                </div>

                {isStudentView && isCompleted && (
                    <div className="mt-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Dokumen selesai dibaca (Simulasi)
                    </div>
                )}

                <div className="mt-5 w-full max-w-sm border-t border-gray-100 dark:border-gray-800/80 pt-3">
                    <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className="text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 mx-auto transition-colors focus:outline-none"
                    >
                        <Terminal className="w-3.5 h-3.5" />
                        {showInstructions ? 'Sembunyikan panduan' : 'Bagaimana menampilkan preview asli?'}
                    </button>

                    {showInstructions && (
                        <div className="mt-3 p-3 bg-gray-900 text-left rounded-lg text-gray-300 font-mono text-[10px] leading-relaxed border border-gray-800 shadow-inner select-text">
                            <p className="text-gray-400 mb-1.5 font-sans font-semibold">Expose server lokal Anda menggunakan tunnel publik:</p>
                            <div className="bg-black/50 p-2 rounded border border-gray-800 text-amber-400 mb-2 font-mono font-bold select-all">
                                npx localtunnel --port 8000
                            </div>
                            <p className="font-sans text-gray-500 text-[9px]">
                              * Jalankan perintah di atas di terminal baru Anda, kemudian buka alamat URL publik yang dihasilkan (misalnya: https://xxx.localtunnel.me) di browser Anda untuk melihat preview asli.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    });


const PdfViewer = memo(function PdfViewer({ url, onPageChange, onLoaded }: { url: string; onPageChange?: (current: number, total: number) => void; onLoaded?: () => void }) {
    const viewerRef = useRef<PDFViewerRef>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [themePreference, setThemePreference] = useState<'light' | 'dark'>('light');

    const registryRef = useRef<any>(null);
    const [isRegistryReady, setIsRegistryReady] = useState(false);

    const onPageChangeRef = useRef(onPageChange);
    useEffect(() => { onPageChangeRef.current = onPageChange; }, [onPageChange]);
    
    const onLoadedRef = useRef(onLoaded);
    useEffect(() => { onLoadedRef.current = onLoaded; }, [onLoaded]);

    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setThemePreference(isDark ? 'dark' : 'light');
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains('dark');
            const pref = isDark ? 'dark' : 'light';
            setThemePreference(pref);
            viewerRef.current?.container?.setTheme({ preference: pref });
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (viewerRef.current?.container) {
            viewerRef.current.container.setTheme({ preference: themePreference });
        }
    }, [themePreference]);

    const handleReady = useCallback((registry: any) => {
        if (registryRef.current) return;
        registryRef.current = registry;
        setIsRegistryReady(true);
        if (onLoadedRef.current) onLoadedRef.current();
    }, []);

    const viewerConfig = useMemo(() => ({ src: url }), [url]);

    useEffect(() => {
        if (!isRegistryReady || !registryRef.current) return;
        const registry = registryRef.current;
        let unsubscribe: (() => void) | undefined;
        let loadingTimeout: number | null = null;
        let hasReported = false;
        const scrollPlugin: any = registry.getPlugin('scroll');
        const scrollCapability = scrollPlugin?.provides();

        if (scrollCapability) {
            const handlePageChange = (current: number, total: number) => {
                setCurrentPage(current);
                if (!onPageChangeRef.current) return;
                if (total > 1) {
                    if (loadingTimeout) { window.clearTimeout(loadingTimeout); loadingTimeout = null; }
                    hasReported = true;
                    onPageChangeRef.current(current, total);
                } else {
                    if (hasReported) onPageChangeRef.current(current, total);
                }
            };

            unsubscribe = scrollCapability.onPageChange((event: any) => {
                handlePageChange(event.pageNumber, event.totalPages);
            });

            const current = scrollCapability.getCurrentPage() || 1;
            const total = scrollCapability.getTotalPages() || 1;

            if (total > 1) {
                handlePageChange(current, total);
            } else {
                loadingTimeout = window.setTimeout(() => {
                    const settledCurrent = scrollCapability.getCurrentPage() || 1;
                    const settledTotal = scrollCapability.getTotalPages() || 1;
                    hasReported = true;
                    handlePageChange(settledCurrent, settledTotal);
                }, 2000);
            }
        }

        return () => {
            if (unsubscribe) unsubscribe();
            if (loadingTimeout) window.clearTimeout(loadingTimeout);
        };
    }, [isRegistryReady, url]);

    return (
        <div className="h-full w-full overflow-hidden rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 flex flex-col">
            <div className="flex-1 h-0 w-full">
                <PDFViewer ref={viewerRef} config={viewerConfig} onReady={handleReady} style={{ width: '100%', height: '100%' }} />
            </div>
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                <span>Halaman aktif: {currentPage}</span>
            </div>
        </div>
    );
});

const PremiumVideoPlayer = memo(    function PremiumVideoPlayer({
        videoId,
        isCompletedInitial,
        durationMinutes,
        onProgressUpdate,
    }: {
        videoId: string;
        isCompletedInitial: boolean;
        durationMinutes?: number;
        onProgressUpdate: (currentTime: number, maxTime: number, duration: number) => void;
    }) {
        const [isPlaying, setIsPlaying] = useState(false);
        const [currentTime, setCurrentTime] = useState(0);
        const [duration, setDuration] = useState(durationMinutes ? durationMinutes * 60 : 0);
        const [maxTime, setMaxTime] = useState(isCompletedInitial ? 999999 : 0);
        const [volume, setVolume] = useState(100);
        const [isMuted, setIsMuted] = useState(false);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [showControls, setShowControls] = useState(true);
        const [seekAlert, setSeekAlert] = useState(false);

        const containerRef = useRef<HTMLDivElement | null>(null);
        const iframeRef = useRef<HTMLDivElement | null>(null);
        const playerRef = useRef<any>(null);
        const controlsTimeoutRef = useRef<number | null>(null);
        const maxTimeRef = useRef(maxTime);

        useEffect(() => {
            maxTimeRef.current = maxTime;
        }, [maxTime]);

        const formatTime = (secs: number) => {
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        useEffect(() => {
            let cancelled = false;
            let timer: number | null = null;

            const initPlayer = async () => {
                await loadYouTubeApi();
                const ytWindow = window as any;
                if (cancelled || !iframeRef.current || !ytWindow.YT?.Player) return;

                if (playerRef.current?.destroy) {
                    playerRef.current.destroy();
                }

                playerRef.current = new ytWindow.YT.Player(iframeRef.current, {
                    videoId: videoId,
                    playerVars: {
                        controls: 0,
                        rel: 0,
                        modestbranding: 1,
                        fs: 0,
                        playsinline: 1,
                        disablekb: 1,
                        origin: window.location.origin,
                        enablejsapi: 1,
                    },
                    events: {
                        onReady: (event: any) => {
                            const dur = Number(event.target.getDuration?.() || 0);
                            if (dur > 0) {
                                setDuration(dur);
                                if (isCompletedInitial) {
                                    setMaxTime(dur);
                                }
                            }
                            event.target.setVolume(volume);
                            if (isMuted) event.target.mute();
                        },
                        onStateChange: (event: any) => {
                            const state = event.data;
                            if (state === ytWindow.YT.PlayerState.PLAYING) {
                                setIsPlaying(true);
                                startTimer();
                            } else {
                                setIsPlaying(false);
                                stopTimer();
                            }
                        }
                    }
                });
            };

            const tick = () => {
                const player = playerRef.current;
                if (!player || typeof player.getCurrentTime !== 'function') return;

                const curr = player.getCurrentTime();
                const dur = player.getDuration();
                if (dur > 0 && dur !== duration) {
                    setDuration(dur);
                }

                setCurrentTime(curr);

                if (curr > maxTimeRef.current + 2) {
                    player.seekTo(maxTimeRef.current, true);
                    setSeekAlert(true);
                    setTimeout(() => setSeekAlert(false), 2000);
                } else {
                    if (curr > maxTimeRef.current) {
                        setMaxTime(curr);
                    }
                    onProgressUpdate(curr, Math.max(maxTimeRef.current, curr), dur || duration);
                }
            };

            const startTimer = () => {
                stopTimer();
                timer = window.setInterval(tick, 250);
            };

            const stopTimer = () => {
                if (timer) {
                    window.clearInterval(timer);
                    timer = null;
                }
            };

            initPlayer();

            return () => {
                cancelled = true;
                stopTimer();
                if (playerRef.current?.destroy) {
                    playerRef.current.destroy();
                    playerRef.current = null;
                }
            };
        }, [videoId, isCompletedInitial]);

        const togglePlay = () => {
            const player = playerRef.current;
            if (!player) return;
            if (isPlaying) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        };

        const toggleMute = () => {
            const player = playerRef.current;
            if (!player) return;
            if (isMuted) {
                player.unMute();
                setIsMuted(false);
                player.setVolume(volume);
            } else {
                player.mute();
                setIsMuted(true);
            }
        };

        const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = Number(e.target.value);
            setVolume(val);
            const player = playerRef.current;
            if (player) {
                player.setVolume(val);
                if (val > 0 && isMuted) {
                    player.unMute();
                    setIsMuted(false);
                } else if (val === 0 && !isMuted) {
                    player.mute();
                    setIsMuted(true);
                }
            }
        };

        const toggleFullscreen = () => {
            const container = containerRef.current;
            if (!container) return;

            if (!document.fullscreenElement) {
                container.requestFullscreen().then(() => {
                    setIsFullscreen(true);
                }).catch(err => {
                    console.error("Fullscreen error:", err);
                });
            } else {
                document.exitFullscreen().then(() => {
                    setIsFullscreen(false);
                });
            }
        };

        useEffect(() => {
            const handleFullscreenChange = () => {
                setIsFullscreen(!!document.fullscreenElement);
            };
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
        }, []);

        const handleMouseMove = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) {
                window.clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = window.setTimeout(() => {
                if (isPlaying) {
                    setShowControls(false);
                }
            }, 2500);
        };

        useEffect(() => {
            return () => {
                if (controlsTimeoutRef.current) {
                    window.clearTimeout(controlsTimeoutRef.current);
                }
            };
        }, []);

        const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
            const player = playerRef.current;
            if (!player || duration <= 0) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            const targetPercent = clickX / width;
            const targetTime = targetPercent * duration;

            if (targetTime > maxTime) {
                setSeekAlert(true);
                setTimeout(() => setSeekAlert(false), 2000);
                player.seekTo(maxTime, true);
            } else {
                player.seekTo(targetTime, true);
                setCurrentTime(targetTime);
            }
        };

        return (
            <div 
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && setShowControls(false)}
                className="group relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800"
            >
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    <div ref={iframeRef} className="w-full h-full" />
                </div>

                <div 
                    className="absolute inset-0 z-10 cursor-pointer" 
                    onClick={togglePlay}
                />

                {seekAlert && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-md border border-amber-500/50 rounded-xl text-[11px] font-medium text-amber-400 flex items-center gap-2 animate-bounce shadow-2xl z-30">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Selesaikan bagian sebelumnya terlebih dahulu sebelum melompat ke depan!
                    </div>
                )}

                {(!isPlaying || showControls) && (
                    <div 
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 transition-opacity"
                    >
                        <button className="h-14 w-14 flex items-center justify-center rounded-full bg-white/25 backdrop-blur-md border border-white/30 text-white hover:scale-110 active:scale-95 transition-all shadow-xl">
                            {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-0.5" />}
                        </button>
                    </div>
                )}

                <div 
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-all duration-300 z-30 flex flex-col ${
                        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                    }`}
                >
                    <div 
                        className="relative w-full h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2 group/seek transition-all flex items-center mb-3"
                        onClick={handleSeekBarClick}
                    >
                        <div 
                            className="absolute left-0 top-0 bottom-0 bg-white/20 rounded-full"
                            style={{ width: `${(maxTime / Math.max(duration, 1)) * 100}%` }}
                        />
                        <div 
                            className="absolute left-0 top-0 bottom-0 bg-sky-500 rounded-full"
                            style={{ width: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
                        />
                        <div 
                            className="absolute h-3 w-3 bg-white border border-sky-600 rounded-full shadow-lg -translate-x-1/2 opacity-0 group-hover/seek:opacity-100 transition-opacity"
                            style={{ left: `${(currentTime / Math.max(duration, 1)) * 100}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={togglePlay}
                                className="text-white hover:text-sky-400 transition-colors p-1"
                            >
                                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                            </button>

                            <div className="flex items-center gap-2 group/volume">
                                <button 
                                    onClick={toggleMute}
                                    className="text-white hover:text-sky-400 transition-colors p-1"
                                >
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-0 group-hover/volume:w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer focus:outline-none transition-all duration-300 accent-sky-500 overflow-hidden"
                                />
                            </div>

                            <span className="text-[11px] font-semibold text-gray-200 select-none">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={toggleFullscreen}
                                className="text-white hover:text-sky-400 transition-colors p-1"
                            >
                                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);


const OfficeViewer = memo(
    function OfficeViewer({ url, totalPages, currentPage: initialPage, onPageChange, fileExtension }: { url: string; totalPages: number; currentPage: number; onPageChange: (current: number, total: number) => void; fileExtension?: string }) {
        const isPptx = fileExtension === 'pptx' || fileExtension === 'ppt';
        const [detectedTotal, setDetectedTotal] = useState<number | null>(null);

        // For PPTX: total comes from parsed slides. For others: use totalPages prop.
        const safeTotal = isPptx
            ? Math.max(detectedTotal || totalPages || 1, 1)
            : Math.max(totalPages || 1, 1);
        const [currentPage, setCurrentPage] = useState(() => Math.min(Math.max(initialPage || 1, 1), safeTotal));

        // When detectedTotal updates (after PPTX parse), clamp current page
        useEffect(() => {
            if (detectedTotal && detectedTotal > 0) {
                setCurrentPage(prev => Math.min(prev, detectedTotal));
            }
        }, [detectedTotal]);

        // Build the iframe src for non-PPTX office files
        const iframeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}&wdStartOn=${currentPage}`;

        const goToPage = useCallback((page: number) => {
            const safePage = Math.min(Math.max(page, 1), safeTotal);
            setCurrentPage(safePage);
            onPageChange(safePage, safeTotal);
        }, [safeTotal, onPageChange]);

        const handlePrev = useCallback(() => {
            goToPage(currentPage - 1);
        }, [currentPage, goToPage]);

        const handleNext = useCallback(() => {
            goToPage(currentPage + 1);
        }, [currentPage, goToPage]);

        const progressPct = Math.round((currentPage / safeTotal) * 100);

        const isLocal = isLocalUrl(url);
        const isNonPptxOffice = !isPptx;

        const handlePptxLoaded = useCallback((totalSlides: number) => {
            setDetectedTotal(totalSlides);
            // Notify parent of the real total
            onPageChange(Math.min(currentPage, totalSlides), totalSlides);
        }, [onPageChange, currentPage]);

        // Render content area based on file type
        const renderContent = () => {
            // Semua file Office (termasuk PPTX) menggunakan Microsoft Viewer.
            // Karena MS Viewer tidak bisa membaca file dari localhost, kita tampilkan placeholder jika diakses dari localhost.
            if (isLocal) {
                return (
                    <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
                        <LocalOfficePlaceholder
                            url={url}
                            fileName={getFileName(url)}
                            isStudentView={true}
                            onSimulateComplete={() => goToPage(safeTotal)}
                            isCompleted={currentPage >= safeTotal}
                        />
                    </div>
                );
            }

            return (
                <iframe
                    key={currentPage}
                    src={iframeSrc}
                    title="Office Document"
                    className="w-full h-full border-0 absolute inset-0"
                    loading="eager"
                />
            );
        };

        return (
            <div className="h-full w-full overflow-hidden rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 flex flex-col">
                <div className="flex-1 h-0 w-full relative">
                    {renderContent()}
                </div>
                {/* Custom navigation bar — progress updates when user clicks Next/Prev */}
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        disabled={currentPage <= 1}
                        className="h-8 text-xs gap-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                        ‹ Sebelumnya
                    </Button>

                    {/* Progress bar */}
                    <div className="flex-1 flex flex-col gap-1">
                        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <span className="text-[11px] text-center text-gray-500 dark:text-gray-400 select-none">
                            Slide {currentPage} / {safeTotal} &nbsp;·&nbsp; {progressPct}%
                        </span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNext}
                        disabled={currentPage >= safeTotal}
                        className="h-8 text-xs gap-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                        Selanjutnya ›
                    </Button>
                </div>
            </div>
        );
    }
);


    const renderDocPreview = (docUrl: string, moduleId: number, previewModuleId: number | null, setPreviewModuleId: (id: number | null) => void) => {
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
            const isPptx = extension === 'pptx' || extension === 'ppt';
            if (isPptx) {
                // Use client-side PPTX viewer for trainer preview (read-only, no progress tracking)
                return (
                    <div className="h-130 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <PptxSlideViewer url={fullUrl} />
                    </div>
                );
            }
            // Non-PPTX office files: use Microsoft viewer or LocalOfficePlaceholder on localhost
            const isLocal = isLocalUrl(fullUrl);
            if (isLocal) {
                return (
                    <LocalOfficePlaceholder 
                        url={fullUrl} 
                        fileName={getFileName(docUrl)} 
                        isStudentView={false}
                    />
                );
            }
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


    const ModuleProgressTracker = memo(function ModuleProgressTracker({ module, isTrainer, previewModuleId, setPreviewModuleId, setCurrentProgress, setLocalModules }: { module: Module, isTrainer: boolean, previewModuleId: number | null, setPreviewModuleId: (id: number | null) => void, setCurrentProgress: (p: number) => void, setLocalModules: React.Dispatch<React.SetStateAction<Module[]>> }) {
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
        const [docScrollPercentage, setDocScrollPercentage] = useState(() => {
            if (module.is_document_read) return 100;
            if (module.doc_current_page && module.doc_total_pages) {
                return (module.doc_current_page / module.doc_total_pages) * 100;
            }
            return 0;
        });
        const docLastPageRef = useRef<number>(module.doc_current_page || 1);

        const postProgress = (path: string, payload: Record<string, number>, onCompleted?: (data: any) => void) => {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            fetch(path, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {})
                },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    if (data.progress_percentage !== undefined) {
                        setCurrentProgress(data.progress_percentage);
                    }
                    
                    setLocalModules(prev => {
                        const updated = prev.map(m => m.id === module.id ? {
                            ...m,
                            is_completed: data.is_completed ?? m.is_completed,
                            is_text_read: data.is_text_read ?? m.is_text_read,
                            is_video_watched: data.is_video_watched ?? m.is_video_watched,
                            is_document_read: data.is_document_read ?? m.is_document_read,
                        } : m);
                        
                        if (isTrainer) return updated;
                        
                        let previousCompleted = true;
                        return updated.map(m => {
                            const isLocked = !previousCompleted;
                            previousCompleted = !!m.is_completed;
                            return { ...m, is_locked: isLocked };
                        });
                    });

                    if (onCompleted) {
                        onCompleted(data);
                    }
                    
                    // Automatically refresh inertia props so that global layout elements (like navbar progress) update
                    // @ts-ignore
                    router.reload({ preserveScroll: true });
                }
            })
            .catch(e => console.error('Tracking Error:', e));
        };

        useEffect(() => {
            videoCompletionSentRef.current = !!module.is_video_watched;
            textCompletionSentRef.current = !!module.is_text_read;
            docCompletionSentRef.current = !!module.is_document_read;
        }, [module.id, module.is_video_watched, module.is_text_read, module.is_document_read]);

        useEffect(() => {
            if (!isUser || !module.content_text || !textContainerRef.current) {
                return;
            }

            const container = textContainerRef.current;

const evaluateText = () => {
    const scrollableHeight = Math.max(container.scrollHeight - container.clientHeight, 0);
    
   
    const scrollPercentage = scrollableHeight <= 0 ? 100 : Math.min(100, ((container.scrollTop + container.clientHeight) / container.scrollHeight) * 100);
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
            if (!isUser || !module.doc_url || !docContainerRef.current || previewModuleId !== module.id) {
                return;
            }

            const extension = getFileExtension(module.doc_url);
            if (['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(extension)) {
                return;
            }

            const container = docContainerRef.current;

            // Di dalam useEffect dokumen non-office/pdf
const evaluateDocument = () => {
    const scrollableHeight = Math.max(container.scrollHeight - container.clientHeight, 0);
    
    
    if (scrollableHeight <= 0) return; 

    const scrollPercentage = Math.min(100, ((container.scrollTop + container.clientHeight) / container.scrollHeight) * 100);
    setDocScrollPercentage(scrollPercentage);

    if (!docCompletionSentRef.current && scrollPercentage >= 95) { 
        docCompletionSentRef.current = true;
        postProgress(`/modules/${module.id}/progress/document`, {
            current_page: 1,
            total_pages: 1,
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
                if (docScrollPercentage < 5) return; 
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
                                {renderDocPreview(module.doc_url, module.id, previewModuleId, setPreviewModuleId)}
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
                        <PremiumVideoPlayer
                            videoId={module.video_url}
                            isCompletedInitial={!!module.is_video_watched}
                            durationMinutes={module.duration_minutes}
                            onProgressUpdate={(currentTime, maxTime, duration) => {
                                const threshold = Math.max(duration - 2, 0);
                                if (!videoCompletionSentRef.current && currentTime >= threshold && maxTime >= threshold) {
                                    videoCompletionSentRef.current = true;
                                    postProgress(`/modules/${module.id}/progress/video`, {
                                        current_time_seconds: currentTime,
                                        max_position_seconds: maxTime,
                                        duration_seconds: duration,
                                    });
                                }
                            }}
                        />
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
                                    ) : ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'].includes(getFileExtension(module.doc_url)) ? (
                                        <OfficeViewer
                                            url={getPreviewUri(module.doc_url)}
                                            totalPages={module.doc_total_pages || 5}
                                            currentPage={module.doc_current_page || 1}
                                            fileExtension={getFileExtension(module.doc_url)}
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
    });

    // Timer materi
interface TimerProps {
    durationMinutes: number;
    courseId: number;
    userId: number | string;
    onTimeUp: () => void;
}

function CourseTimer({ durationMinutes, courseId, userId, onTimeUp }: TimerProps) {
    // Membuat kunci unik untuk penyimpanan di localStorage browser
    const localStorageKey = `course_timer_${userId}_${courseId}`;

    // State awal mengambil dari localStorage jika ada, jika tidak ada baru pakai durasi asli (menit * 60)
    const [secondsLeft, setSecondsLeft] = useState(() => {
        const savedTime = localStorage.getItem(localStorageKey);
        if (savedTime !== null) {
            const parsedTime = parseInt(savedTime, 10);
            // Jika waktu yang tersimpan ternyata sudah habis (<= 0), kembalikan 0
            return parsedTime > 0 ? parsedTime : 0;
        }
        return durationMinutes * 60;
    });

    useEffect(() => {
        // Jika waktu sudah habis
        if (secondsLeft <= 0) {
            onTimeUp();
            localStorage.removeItem(localStorageKey); // Hapus kunci karena sudah selesai
            return;
        }

        // Simpan sisa detik terbaru ke localStorage setiap kali detik berubah
        localStorage.setItem(localStorageKey, secondsLeft.toString());

        // Jalankan interval hitung mundur 1 detik
        const timerId = setInterval(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [secondsLeft, localStorageKey]);

    // Format tampilan ke bentuk MM:SS
    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm animate-pulse mb-4">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>{formatTime(secondsLeft)}</span>
        </div>
    );
}

export default function CourseShow({ course, userProgress = 0, isEnrolled = false, ratingData }: ShowProps) {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.user.role === 'admin';
    const isTrainer = auth.user.role === 'trainer' || isAdmin;
    const canTakeQuiz = auth.user.role === 'user';
    const isCreator = Number(course.created_by) === Number(auth.user.id);
    const canManage = isAdmin || isCreator || (auth.user.role === 'trainer' && course.target_division === auth.user.division); // admin can manage all, trainer own or if assigned to their division
    const trainerName = course?.creator?.name || 'Instructor';
    const trainerId = course?.creator?.id || 'N/A';
    const [isTimerFinished, setIsTimerFinished] = useState(false);

    const trainerInitials = trainerName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    const [activeModuleItem, setActiveModuleItem] = useState<string>('');
    const [previewModuleId, setPreviewModuleId] = useState<number | null>(null);

    // Dynamic AJAX states
    const [localModules, setLocalModules] = useState<Module[]>(course.modules);
    const [currentProgress, setCurrentProgress] = useState<number>(userProgress);

    useEffect(() => {
        setLocalModules(course.modules);
    }, [course.modules]);

    useEffect(() => {
        setCurrentProgress(userProgress);
    }, [userProgress]);

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

                        {/* timer materilayout user */}
{/* timer materilayout user - KHUSUS USER BIASA DAN MANDATORY SAJA */}
{(() => {
    const { auth } = usePage<any>().props;
    const isUserBiasa = auth?.user && !['admin', 'trainer'].includes(auth.user.role);

    // Timer HANYA jalan/muncul jika yang buka adalah User biasa DAN course ini Mandatory
    if (isUserBiasa && course.is_mandatory && Number(course.is_timer_active) === 1 && !isTimerFinished) {
        return (
            <CourseTimer 
                durationMinutes={course.duration_minutes ?? 5} 
                onTimeUp={() => {
                    setIsTimerFinished(true);
                }} 
            />
        );
    }
    return null;
})()}              </div>
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
                                    ({localModules.length})
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
                                {localModules.length > 0 ? (
                                    localModules.map((module, index) => (
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
                                                <ModuleProgressTracker module={module} isTrainer={isTrainer} previewModuleId={previewModuleId} setPreviewModuleId={setPreviewModuleId} setCurrentProgress={setCurrentProgress} setLocalModules={setLocalModules} />

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
    <Button 
        size="sm" 
        variant="outline" 
        className="h-7 px-2 text-[11px] text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-pointer"
        // onClick={() => {
        //     // Mengarahkan window/scroll kembali ke bagian materi paling atas secara smooth
        //     window.scrollTo({ top: 0, behavior: 'smooth' });
        //     alert("Batas percobaan kuis habis (3x). Silakan baca ulang seluruh materi di atas terlebih dahulu untuk membuka kembali kuis.");
        // }}
    >
        <Lock className="w-3 h-3 mr-1" /> Terkunci 
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
                                    <span className="text-2xl lg:text-xl font-bold text-sky-600 leading-none">{currentProgress}%</span>
                                </div>
                                <div className="w-full bg-sky-100 dark:bg-sky-900/40 rounded-full h-2.5">
                                    <div
                                        className="bg-sky-500 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${currentProgress}%` }}
                                    />
                                </div>
                                <p className="mt-1.5 text-[11px] sm:text-xs text-sky-400">{currentProgress < 100 ? 'Selesaikan semua modul untuk mendapat sertifikat' : ''}</p>
                                {currentProgress === 100 && (
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
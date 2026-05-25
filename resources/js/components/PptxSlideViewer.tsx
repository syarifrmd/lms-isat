import { memo, useEffect, useRef, useState } from 'react';
import { Loader2, FileWarning } from 'lucide-react';

interface PptxSlideViewerProps {
    /** URL to the .pptx file (can be local /storage/... or absolute http://...) */
    url: string;
    /** Current page/slide to display (1-indexed) */
    currentPage?: number;
    /** Called when slides are parsed, or when current page changes */
    onPageChange?: (current: number, total: number) => void;
    /** Called once when the PPTX has been fully loaded and parsed */
    onLoaded?: (totalSlides: number) => void;
}

interface ParseState {
    status: 'idle' | 'loading' | 'ready' | 'error';
    slides: string[];
    error?: string;
}

/** The fixed dimensions we tell pptx-to-html to render at */
const SLIDE_W = 960;
const SLIDE_H = 540;

const PptxSlideViewer = memo(function PptxSlideViewer({
    url,
    currentPage = 1,
    onPageChange,
    onLoaded,
}: PptxSlideViewerProps) {
    const [state, setState] = useState<ParseState>({ status: 'idle', slides: [] });
    const onLoadedRef = useRef(onLoaded);
    const onPageChangeRef = useRef(onPageChange);
    const hasCalledLoaded = useRef(false);

    // For scaling
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => { onLoadedRef.current = onLoaded; }, [onLoaded]);
    useEffect(() => { onPageChangeRef.current = onPageChange; }, [onPageChange]);

    // Measure container and compute scale factor
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const computeScale = () => {
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            if (cw <= 0 || ch <= 0) return;
            // Scale to fit both width and height, maintaining aspect ratio
            const s = Math.min(cw / SLIDE_W, ch / SLIDE_H);
            setScale(s);
        };

        computeScale();

        const ro = new ResizeObserver(computeScale);
        ro.observe(container);
        return () => ro.disconnect();
    }, [state.status]); // re-attach when ready

    // Fetch & parse the PPTX file
    useEffect(() => {
        let cancelled = false;
        hasCalledLoaded.current = false;

        setState({ status: 'loading', slides: [] });

        (async () => {
            try {
                const { pptxToHtml } = await import('@jvmr/pptx-to-html');

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Gagal mengunduh file: HTTP ${response.status}`);
                }

                const arrayBuffer = await response.arrayBuffer();

                const slidesHtml = await pptxToHtml(arrayBuffer, {
                    width: SLIDE_W,
                    height: SLIDE_H,
                    scaleToFit: true,
                });

                if (cancelled) return;

                if (!slidesHtml || slidesHtml.length === 0) {
                    setState({ status: 'error', slides: [], error: 'File PPTX tidak memiliki slide atau format tidak didukung.' });
                    return;
                }

                setState({ status: 'ready', slides: slidesHtml });

                if (!hasCalledLoaded.current) {
                    hasCalledLoaded.current = true;
                    onLoadedRef.current?.(slidesHtml.length);
                }
            } catch (err: any) {
                if (cancelled) return;
                console.error('PptxSlideViewer parse error:', err);
                setState({
                    status: 'error',
                    slides: [],
                    error: err?.message || 'Terjadi kesalahan saat mem-parse file PPTX.',
                });
            }
        })();

        return () => { cancelled = true; };
    }, [url]);

    // Notify parent of page changes
    useEffect(() => {
        if (state.status === 'ready' && state.slides.length > 0) {
            const safePage = Math.min(Math.max(currentPage, 1), state.slides.length);
            onPageChangeRef.current?.(safePage, state.slides.length);
        }
    }, [currentPage, state.status, state.slides.length]);

    // ── Loading State ──
    if (state.status === 'idle' || state.status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center gap-3 p-8 min-h-60">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-sky-400/20 animate-ping" />
                    <div className="relative p-3 bg-sky-50 dark:bg-sky-950/40 rounded-full">
                        <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Memuat Presentasi...</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Mengunduh dan mem-parse slide PPTX</p>
                </div>
            </div>
        );
    }

    // ── Error State ──
    if (state.status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center gap-3 p-8 min-h-60">
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-full">
                    <FileWarning className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-center space-y-1 max-w-sm">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Gagal Memuat Presentasi</p>
                    <p className="text-xs text-red-500 dark:text-red-400">{state.error}</p>
                </div>
            </div>
        );
    }

    // ── Render current slide ──
    const totalSlides = state.slides.length;
    const safeIndex = Math.min(Math.max(currentPage - 1, 0), totalSlides - 1);
    const slideHtml = state.slides[safeIndex] || '';

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 overflow-hidden"
        >
            {/* 
              The slide HTML is rendered at a fixed SLIDE_W×SLIDE_H size.
              We wrap it in a div with that exact size, then use CSS transform: scale()
              to shrink/grow it to fit inside the container while keeping aspect ratio.
              transform-origin is top-left so the scaled result stays centered via the
              outer flexbox.
            */}
            <div
                style={{
                    width: SLIDE_W,
                    height: SLIDE_H,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    flexShrink: 0,
                    marginRight: -(SLIDE_W * (1 - scale)),
                    marginBottom: -(SLIDE_H * (1 - scale)),
                }}
            >
                <div
                    style={{ width: SLIDE_W, height: SLIDE_H, overflow: 'hidden', position: 'relative' }}
                    dangerouslySetInnerHTML={{ __html: slideHtml }}
                />
            </div>
        </div>
    );
});

export default PptxSlideViewer;

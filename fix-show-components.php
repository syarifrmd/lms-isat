<?php

$file = 'resources/js/pages/Courses/Show.tsx';
$lines = file($file);

function extractBlock(&$lines, $startPattern) {
    $startLine = -1;
    for ($i = 0; $i < count($lines); $i++) {
        if ($lines[$i] !== null && preg_match($startPattern, $lines[$i])) {
            $startLine = $i;
            break;
        }
    }
    
    if ($startLine === -1) return null;
    
    $braces = 0;
    $endLine = -1;
    for ($i = $startLine; $i < count($lines); $i++) {
        if ($lines[$i] === null) continue;
        $braces += substr_count($lines[$i], '{');
        $braces -= substr_count($lines[$i], '}');
        
        if ($braces === 0) {
            $endLine = $i;
            break;
        }
    }
    
    if ($endLine === -1) return null;
    
    $extracted = [];
    for ($i = $startLine; $i <= $endLine; $i++) {
        if ($lines[$i] !== null) {
            $extracted[] = $lines[$i];
            $lines[$i] = null; // Mark for removal
        }
    }
    
    // Check if the next line is a closing parenthesis or semicolon that belongs to the block (like `};` or `});`)
    if ($endLine + 1 < count($lines) && $lines[$endLine + 1] !== null) {
        $nextLine = trim($lines[$endLine + 1]);
        if ($nextLine === '};' || $nextLine === ');') {
            $extracted[] = $lines[$endLine + 1];
            $lines[$endLine + 1] = null;
        }
    }
    
    return implode("", $extracted);
}

// Extract components
$pdfViewerCode = extractBlock($lines, '/function PdfViewer\(/');
$videoPlayerCode = extractBlock($lines, '/function PremiumVideoPlayer\(/');
$officeViewerCode = extractBlock($lines, '/function OfficeViewer\(/');
$renderDocCode = extractBlock($lines, '/const renderDocPreview =/');
$trackerCode = extractBlock($lines, '/const ModuleProgressTracker =/');

// Now rebuild lines array without nulls
$newLines = [];
$courseShowStart = -1;
foreach ($lines as $i => $line) {
    if ($line !== null) {
        if (preg_match('/export default function CourseShow/', $line)) {
            $courseShowStart = count($newLines);
        }
        $newLines[] = $line;
    }
}

// Transform ModuleProgressTracker
$trackerProps = "{ module, isTrainer, previewModuleId, setPreviewModuleId, setCurrentProgress, setLocalModules }: { module: Module, isTrainer: boolean, previewModuleId: number | null, setPreviewModuleId: (id: number | null) => void, setCurrentProgress: (p: number) => void, setLocalModules: React.Dispatch<React.SetStateAction<Module[]>> }";
$trackerCode = preg_replace('/const ModuleProgressTracker = \([^)]*\) => \{/', "const ModuleProgressTracker = memo(function ModuleProgressTracker($trackerProps) {", $trackerCode);
$trackerCode = rtrim($trackerCode);
if (substr($trackerCode, -1) === '}') {
    $trackerCode .= ');';
} else if (substr($trackerCode, -2) === '};') {
    $trackerCode = substr($trackerCode, 0, -2) . '});';
}

// Transform renderDocPreview
$renderDocCode = preg_replace('/const renderDocPreview = \(([^)]*)\) => \{/', "const renderDocPreview = ($1, previewModuleId: number | null, setPreviewModuleId: (id: number | null) => void) => {", $renderDocCode);
$trackerCode = str_replace('renderDocPreview(module.doc_url, module.id)', 'renderDocPreview(module.doc_url, module.id, previewModuleId, setPreviewModuleId)', $trackerCode);

// We will completely replace PdfViewer with the optimized version to fix the re-renders
$optimizedPdfViewer = <<<EOF
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
EOF;

// Wrap video and office in memo
$videoPlayerCode = "const PremiumVideoPlayer = memo(" . $videoPlayerCode . ");\n";
$officeViewerCode = "const OfficeViewer = memo(" . $officeViewerCode . ");\n";

// Combine everything to be inserted BEFORE CourseShow
$insertedBlocks = implode("\n\n", [
    $optimizedPdfViewer,
    $videoPlayerCode,
    $officeViewerCode,
    $renderDocCode,
    $trackerCode
]) . "\n\n";

array_splice($newLines, $courseShowStart, 0, [$insertedBlocks]);

$finalContent = implode("", $newLines);

// Update calls to Tracker in the CourseShow JSX
$finalContent = str_replace(
    '<ModuleProgressTracker module={module} />',
    '<ModuleProgressTracker module={module} isTrainer={isTrainer} previewModuleId={previewModuleId} setPreviewModuleId={setPreviewModuleId} setCurrentProgress={setCurrentProgress} setLocalModules={setLocalModules} />',
    $finalContent
);

file_put_contents($file, $finalContent);
echo "Successfully extracted and transformed components.\\n";


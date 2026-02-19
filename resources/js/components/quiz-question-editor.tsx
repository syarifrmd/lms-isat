import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useEffect, useMemo, useRef } from 'react';

interface QuizQuestionEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

// Resolve a CSS variable to its computed value on :root
function getCSSVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function QuizQuestionEditor({ value, onChange, placeholder = 'Tulis pertanyaanmu di sini...' }: QuizQuestionEditorProps) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const quillRef = useRef<Quill | null>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const handleImageUpload = () => {
        const quill = quillRef.current;
        if (!quill) return;

        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                alert('Ukuran gambar maksimal 5 MB');
                return;
            }

            // Show a temporary placeholder while uploading
            const range = quill.getSelection(true);
            quill.insertText(range.index, 'Mengupload gambar...', 'user');

            try {
                const formData = new FormData();
                formData.append('image', file);

                // Get CSRF token — try meta tag first, then cookie
                const metaToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content;
                const cookieToken = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN='))?.split('=')[1];
                const csrfToken = metaToken ?? (cookieToken ? decodeURIComponent(cookieToken) : '');

                const response = await fetch('/assessments/upload-image', {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json',
                    },
                    body: formData,
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error('Upload failed:', response.status, errText);
                    throw new Error('Upload gagal: ' + response.status);
                }

                const json = await response.json() as { url: string };

                // Remove placeholder text and insert the image
                quill.deleteText(range.index, 'Mengupload gambar...'.length);
                quill.insertEmbed(range.index, 'image', json.url, 'user');
                quill.setSelection({ index: range.index + 1, length: 0 });
            } catch (err) {
                console.error('Image upload error:', err);
                quill.deleteText(range.index, 'Mengupload gambar...'.length);
                alert('Gagal mengupload gambar. Silakan coba lagi.');
            }
        };
    };

    const handleImageUploadRef = useRef(handleImageUpload);
    useEffect(() => {
        handleImageUploadRef.current = handleImageUpload;
    });

    const modules = useMemo(
        () => ({
            toolbar: {
                container: [
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link', 'image'],
                    ['clean'],
                ],
                handlers: {
                    image: () => handleImageUploadRef.current(),
                },
            },
        }),
        [],
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!containerRef.current) return;
        if (quillRef.current) return;

        const containerEl = containerRef.current;
        const editorEl = document.createElement('div');
        containerEl.appendChild(editorEl);

        const quill = new Quill(editorEl, {
            theme: 'snow',
            modules,
            placeholder,
        });

        quillRef.current = quill;

        quill.on('text-change', () => {
            const html = quill.root.innerHTML;
            onChangeRef.current(html === '<p><br></p>' ? '' : html);
        });

        // Apply theme colors after mount using resolved CSS vars
        const toolbar = containerEl.querySelector('.ql-toolbar') as HTMLElement | null;
        const container = containerEl.querySelector('.ql-container') as HTMLElement | null;
        const editor = containerEl.querySelector('.ql-editor') as HTMLElement | null;

        // Resolve CSS vars to actual color values
        const borderColor = `hsl(${getCSSVar('--border')})`;
        const bgColor = `hsl(${getCSSVar('--background')})`;
        const fgColor = `hsl(${getCSSVar('--foreground')})`;
        const mutedBg = `hsl(${getCSSVar('--muted')})`;
        const mutedFg = `hsl(${getCSSVar('--muted-foreground')})`;

        if (toolbar) {
            toolbar.style.border = 'none';
            toolbar.style.borderBottom = `1px solid ${borderColor}`;
            toolbar.style.background = mutedBg;
            toolbar.style.padding = '6px 8px';
        }
        if (container) {
            container.style.border = 'none';
            container.style.background = bgColor;
        }
        if (editor) {
            editor.style.minHeight = '110px';
            editor.style.color = fgColor;
            editor.style.background = bgColor;
            editor.style.fontSize = '0.9375rem';
        }

        // Style SVG icons in toolbar via injected <style> scoped to the wrapper
        const uid = `qe-${Math.random().toString(36).slice(2, 7)}`;
        containerEl.setAttribute('data-qe', uid);

        const iconColor = fgColor;
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            [data-qe="${uid}"] .ql-snow .ql-stroke { stroke: ${iconColor}; }
            [data-qe="${uid}"] .ql-snow .ql-fill,
            [data-qe="${uid}"] .ql-snow .ql-stroke.ql-fill { fill: ${iconColor}; }
            [data-qe="${uid}"] .ql-snow .ql-picker { color: ${iconColor}; }
            [data-qe="${uid}"] .ql-editor.ql-blank::before { color: ${mutedFg}; font-style: normal; left: 12px; }
            [data-qe="${uid}"] .ql-editor img {
                max-width: 100%; height: auto; border-radius: 0.5rem;
                margin: 6px 0; box-shadow: 0 1px 4px rgba(0,0,0,.12);
                display: block;
            }
            [data-qe="${uid}"] .ql-toolbar button { border-radius: 4px; }
            [data-qe="${uid}"] .ql-toolbar button:hover { background: rgba(0,0,0,.07); }
            [data-qe="${uid}"] .ql-toolbar button.ql-active { background: rgba(0,0,0,.12); }
        `;
        document.head.appendChild(styleEl);

        return () => {
            quillRef.current = null;
            containerEl.innerHTML = '';
            styleEl.remove();
        };
    }, [modules, placeholder]);

    // Sync external value changes
    useEffect(() => {
        const quill = quillRef.current;
        if (!quill) return;
        const current = quill.root.innerHTML;
        const next = value || '';
        if (next === current) return;
        const sel = quill.getSelection();
        quill.clipboard.dangerouslyPasteHTML(next, 'silent');
        if (sel) quill.setSelection(sel);
    }, [value]);

    return (
        <div
            ref={wrapperRef}
            className="rounded-lg overflow-hidden border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 transition-shadow"
        >
            <div ref={containerRef} />
        </div>
    );
}

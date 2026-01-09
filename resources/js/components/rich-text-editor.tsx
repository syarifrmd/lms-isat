import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useEffect, useMemo, useRef } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const editorElRef = useRef<HTMLDivElement | null>(null);
    const quillRef = useRef<Quill | null>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const modules = useMemo(
        () => ({
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'image'],
                ['clean'],
            ],
        }),
        [],
    );

    const isBrowser = typeof window !== 'undefined';

    useEffect(() => {
        if (!isBrowser) return;
        if (!containerRef.current) return;
        if (quillRef.current) return;

        const containerEl = containerRef.current;

        const editorEl = document.createElement('div');
        containerEl.appendChild(editorEl);
        editorElRef.current = editorEl;

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

        return () => {
            quillRef.current = null;
            editorElRef.current = null;
            containerEl.innerHTML = '';
        };
    }, [isBrowser, modules, placeholder]);

    useEffect(() => {
        const quill = quillRef.current;
        if (!quill) return;

        const currentHtml = quill.root.innerHTML;
        const nextHtml = value || '';
        if (nextHtml === currentHtml) return;

        const selection = quill.getSelection();
        quill.clipboard.dangerouslyPasteHTML(nextHtml, 'silent');
        if (selection) quill.setSelection(selection);
    }, [value]);

    return (
        <div className="rich-text-editor">
            {isBrowser ? (
                <div
                    ref={containerRef}
                    className="bg-background text-foreground"
                />
            ) : (
                <div className="bg-background text-muted-foreground rounded-md border p-3 text-sm">
                    {placeholder ?? 'Loading editor...'}
                </div>
            )}
            <style>{`
                .ql-toolbar {
                    border-radius: 0.5rem 0.5rem 0 0;
                    border-color: hsl(var(--border)) !important;
                }
                .ql-container {
                    border-radius: 0 0 0.5rem 0.5rem;
                    border-color: hsl(var(--border)) !important;
                    min-height: 150px;
                }
                .ql-editor {
                    min-height: 150px;
                }
                .ql-editor img {
                    max-width: 100%;
                    height: auto;
                    display: inline-block;
                }
            `}</style>
        </div>
    );
}

import React, { useState, useRef, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import certificateTemplates from '@/routes/admin/certificate-templates';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Camera, X, Plus } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { Rnd } from 'react-rnd';

interface LayoutElement {
    id: string;
    label: string;
    type: 'text' | 'signature';
    value?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize?: number;
    color?: string;
}

interface CertificateTemplate {
    id: number;
    name: string;
    background_image_path: string;
    signature_image_path?: string | null;
    layout_data: {
        elements: LayoutElement[];
        canvasWidth?: number;
        canvasHeight?: number;
    };
}

const defaultElements: LayoutElement[] = [
    { id: 'userName', label: 'Nama Peserta', type: 'text', x: 100, y: 200, width: 300, height: 40, fontSize: 36, color: '#000000' },
    { id: 'courseTitle', label: 'Judul Kursus', type: 'text', x: 100, y: 280, width: 400, height: 30, fontSize: 20, color: '#000000' },
    { id: 'completionDate', label: 'Tanggal Selesai', type: 'text', x: 100, y: 350, width: 200, height: 25, fontSize: 16, color: '#000000' },
    { id: 'customMessage', label: 'Pesan Custom', type: 'text', value: 'Dengan hormat diberikan kepada', x: 100, y: 400, width: 300, height: 25, fontSize: 14, color: '#000000' },
   
];

export default function Form({ template }: { template?: CertificateTemplate }) {
    const { errors } = usePage().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const signatureInputRef = useRef<HTMLInputElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        template?.background_image_path ? `/storage/${template.background_image_path}` : null
    );
    const [signaturePreview, setSignaturePreview] = useState<string | null>(
        template?.signature_image_path ? `/storage/${template.signature_image_path}` : null
    );
    const [elements, setElements] = useState<LayoutElement[]>(
        template?.layout_data?.elements || defaultElements
    );
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteElementId, setDeleteElementId] = useState<string | null>(null);
    const [canvasWidth, setCanvasWidth] = useState<number>(
        template?.layout_data?.canvasWidth ?? 800
    );
    const [canvasHeight, setCanvasHeight] = useState<number>(
        template?.layout_data?.canvasHeight ?? 566
    );
    const [previewScale, setPreviewScale] = useState<number>(1);
    const [clientErrors, setClientErrors] = useState<{ name?: string }>({});

    const { data, setData, post, put, processing } = useForm({
        name: template?.name || '',
        background_image: null as File | null,
        signature_image: null as File | null,
        layout_data: JSON.stringify({ elements, canvasWidth, canvasHeight }),
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setData('layout_data', JSON.stringify({ elements, canvasWidth, canvasHeight }));
        }, 300);
        return () => clearTimeout(timer);
    }, [elements, canvasWidth, canvasHeight, setData]);

    useEffect(() => {
        const updatePreviewScale = () => {
            const container = previewContainerRef.current;
            if (!container || canvasWidth <= 0) {
                setPreviewScale(1);
                return;
            }

            if (window.innerWidth >= 1024) {
                setPreviewScale(1);
                return;
            }

            const containerWidth = Math.max(0, container.clientWidth - 24);
            if (containerWidth <= 0) {
                setPreviewScale(1);
                return;
            }

            const nextScale = Math.min(1, Math.max(0.35, containerWidth / canvasWidth));
            setPreviewScale(nextScale);
        };

        updatePreviewScale();

        const resizeObserver = new ResizeObserver(updatePreviewScale);
        if (previewContainerRef.current) {
            resizeObserver.observe(previewContainerRef.current);
        }

        window.addEventListener('resize', updatePreviewScale);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', updatePreviewScale);
        };
    }, [canvasWidth, imagePreview]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const aspectRatio = img.width / img.height;
                    setCanvasWidth(800);
                    setCanvasHeight(Math.round(800 / aspectRatio));
                    setImagePreview(event.target?.result as string);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
            setData('background_image', file);
        }
    };

    const handleElementChange = (id: string, updates: Partial<LayoutElement>) => {
        setElements((prevElements) =>
            prevElements.map((el) => (el.id === id ? { ...el, ...updates } : el))
        );
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setElements((prevElements) => {
                const existingSignature = prevElements.find((el) => el.type === 'signature');
                if (existingSignature) {
                    setSelectedElement(existingSignature.id);
                    return prevElements;
                }

                const newSignatureElement: LayoutElement = {
                    id: `signature_${Date.now()}`,
                    label: 'Signature',
                    type: 'signature',
                    x: 450,
                    y: 300,
                    width: 100,
                    height: 100,
                };

                setSelectedElement(newSignatureElement.id);
                return [...prevElements, newSignatureElement];
            });

            const reader = new FileReader();
            reader.onload = (event) => {
                setSignaturePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
            setData('signature_image', file);
        }
    };

    const handleDeleteElement = () => {
        if (deleteElementId) {
            setElements((prevElements) =>
                prevElements.filter((el) => el.id !== deleteElementId)
            );
            setSelectedElement(null);
            setShowDeleteDialog(false);
            setDeleteElementId(null);
        }
    };

    const handleAddElement = () => {
        const newElement: LayoutElement = {
            id: `customMessage_${Date.now()}`,
            label: 'Pesan Custom Baru',
            type: 'text',
            value: 'Isi pesan custom baru',
            x: 50,
            y: 50,
            width: 200,
            height: 40,
            fontSize: 16,
            color: '#000000',
        };
        setElements([...elements, newElement]);
        setSelectedElement(newElement.id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const nextErrors: { name?: string } = {};
        if (!data.name.trim()) {
            nextErrors.name = 'This field is required.';
        }

        setClientErrors(nextErrors);

        if (nextErrors.name) {
            nameInputRef.current?.focus();
            return;
        }

        if (template) {
            put(certificateTemplates.update.url({ certificateTemplate: template.id }));
        } else {
            post(certificateTemplates.store.url());
        }
    };

    if (!imagePreview) {
        return (
            <AppLayout>
                <Head title={template ? 'Edit Desain Sertifikat' : 'Buat Desain Sertifikat'} />
                <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.get(certificateTemplates.index.url())}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Button>

                    <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-xl">{template ? 'Edit Desain Sertifikat' : 'Buat Desain Sertifikat'}</CardTitle>
                            <CardDescription>
                                Unggah gambar background sertifikat untuk memulai
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Nama Desain<span className="ml-1 text-red-500">*</span> </Label>
                                    <Input
                                        ref={nameInputRef}
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: Desain Sertifikat 2026"
                                        required
                                        className="mt-2"
                                    />
                                    {(clientErrors.name || errors.name) && (
                                        <p className="text-sm text-red-600 mt-1">{clientErrors.name || errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <Label>Background Sertifikat<span className="ml-1 text-red-500">*</span></Label>
                                    <div
                                        className="mt-2 cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm font-medium">Klik untuk unggah atau drag & drop</p>
                                        <p className="text-xs text-gray-500 mt-1">JPG, PNG (max 10MB)</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    {errors['background_image'] && (
                                        <p className="text-sm text-red-600 mt-1">{errors['background_image']}</p>
                                    )}
                                </div>

                    
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={template ? 'Edit Desain Sertifikat' : 'Buat Desain Sertifikat'} />
            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
                <Button
                    variant="ghost"
                    onClick={() => router.get(certificateTemplates.index.url())}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </Button>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        ref={signatureInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                    />

                    <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-xl">{template ? 'Edit Desain Sertifikat' : 'Buat Desain Sertifikat'}</CardTitle>
                            <CardDescription>
                                Atur nama template dan background sebelum mengedit posisi elemen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nama Desain</Label>
                                    <Input
                                        ref={nameInputRef}
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: Desain Sertifikat 2026"
                                        required
                                        className="mt-1"
                                    />
                                    {(clientErrors.name || errors.name) && (
                                        <p className="text-sm text-red-600 mt-1">{clientErrors.name || errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2 lg:col-span-2">
                                    <Label>Ganti Background (Opsional)</Label>
                                    <div
                                        className="mt-1 cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Camera className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                        <p className="text-sm font-medium">Klik untuk unggah atau drag & drop</p>
                                        <p className="text-xs text-gray-500 mt-1">JPG, PNG (max 10MB)</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    {errors['background_image'] && (
                                        <p className="text-sm text-red-600 mt-1">{errors['background_image']}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Canvas Area */}
                        <div className="lg:col-span-8 xl:col-span-9">
                            <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="text-lg">Editor Tata Letak</CardTitle>
                                    <CardDescription>
                                        Drag elemen di kanvas atau ubah properti di panel kanan.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        ref={previewContainerRef}
                                        className="relative mx-auto rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900"
                                        style={{
                                            width: '100%',
                                            maxHeight: '68vh',
                                            overflow: 'auto',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${canvasWidth * previewScale}px`,
                                                height: `${canvasHeight * previewScale}px`,
                                                margin: '0 auto',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    width: `${canvasWidth}px`,
                                                    height: `${canvasHeight}px`,
                                                    transform: `scale(${previewScale})`,
                                                    transformOrigin: 'top left',
                                                    backgroundImage: `url('${imagePreview}')`,
                                                    backgroundSize: 'contain',
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'center',
                                                }}
                                            >
                                            {elements.map((element) => (
                                                <Rnd
                                                    key={element.id}
                                                    scale={previewScale}
                                                    position={{
                                                        x: element.x,
                                                        y: element.y,
                                                    }}
                                                    size={{
                                                        width: element.width,
                                                        height: element.height,
                                                    }}
                                                    bounds="parent"
                                                    dragGrid={[1, 1]}
                                                    resizeGrid={[1, 1]}
                                                    onDrag={(e, d) => {
                                                        handleElementChange(element.id, {
                                                            x: Math.round(d.x),
                                                            y: Math.round(d.y),
                                                        });
                                                    }}
                                                    onDragStop={(e, d) => {
                                                        handleElementChange(element.id, {
                                                            x: Math.round(d.x),
                                                            y: Math.round(d.y),
                                                        });
                                                    }}
                                                    onResize={(e, direction, ref, delta, position) => {
                                                        handleElementChange(element.id, {
                                                            x: Math.round(position.x),
                                                            y: Math.round(position.y),
                                                            width: parseInt(ref.style.width),
                                                            height: parseInt(ref.style.height),
                                                        });
                                                    }}
                                                    onResizeStop={(e, direction, ref, delta, position) => {
                                                        handleElementChange(element.id, {
                                                            x: Math.round(position.x),
                                                            y: Math.round(position.y),
                                                            width: parseInt(ref.style.width),
                                                            height: parseInt(ref.style.height),
                                                        });
                                                    }}
                                                    minWidth={50}
                                                    minHeight={30}
                                                    onClick={() => setSelectedElement(element.id)}
                                                    disableDragging={false}
                                                    enableResizing={{
                                                        top: true,
                                                        right: true,
                                                        bottom: true,
                                                        left: true,
                                                        topRight: true,
                                                        bottomRight: true,
                                                        bottomLeft: true,
                                                        topLeft: true,
                                                    }}
                                                >
                                                    <div
                                                        className={`flex items-center justify-center font-semibold text-xs cursor-move select-none border-2 transition ${
                                                            selectedElement === element.id
                                                                ? 'border-2 border-dashed stroke-dasharray-20 border-gray-500  bg-transparent text-black dark:text-white'
                                                                : 'border-2 border-dashed stroke-dasharray-20 border-gray-500 bg-transparent text-black dark:text-white'
                                                        }`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            fontSize: `${Math.max(9, Math.min((element.fontSize || 16) / 3, 14))}px`,
                                                            touchAction: 'none',
                                                        }}
                                                    >
                                                        {selectedElement === element.id && (
                                                            <div className="pointer-events-none absolute -top-6 left-0 rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-mono text-white shadow">
                                                                {Math.round(element.x)}, {Math.round(element.y)}
                                                            </div>
                                                        )}
                                                        {element.type === 'signature' && signaturePreview ? (
                                                            <img
                                                                src={signaturePreview}
                                                                alt="Signature"
                                                                draggable={false}
                                                                className="pointer-events-none h-full w-full select-none object-contain"
                                                            />
                                                        ) : (
                                                            <span className="px-1 text-center whitespace-pre-wrap wrap-break-word leading-tight">
                                                                {element.type === 'signature'
                                                                    ? 'Signature'
                                                                    : element.id === 'customMessage' || element.id.startsWith('customMessage_')
                                                                      ? (element.value || 'Pesan Custom').substring(0, 60)
                                                                      : element.label.substring(0, 20)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Rnd>
                                            ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Properties Panel */}
                        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start lg:col-span-4 xl:col-span-3">
                            <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="text-base">Daftar Elemen</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                                        {elements.map((element) => (
                                            <div
                                                key={element.id}
                                                onClick={() => setSelectedElement(element.id)}
                                                className={`p-3 rounded-lg cursor-pointer border-2 transition ${
                                                    selectedElement === element.id
                                                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20'
                                                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 truncate">
                                                        <p className="font-medium text-sm truncate">{element.label}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {element.type === 'text' ? 'Teks' : 'Gambar Signature'}
                                                        </p>
                                                    </div>
                                                    {selectedElement === element.id && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteElementId(element.id);
                                                                setShowDeleteDialog(true);
                                                            }}
                                                            className="ml-2"
                                                        >
                                                            <X className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full mt-2 text-xs"
                                        onClick={() => signatureInputRef.current?.click()}
                                    >
                                        <Plus className="h-3 w-3 mr-2" />
                                        Upload Gambar Signature
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full text-xs"
                                        onClick={handleAddElement}
                                    >
                                        <Plus className="h-3 w-3 mr-2" />
                                        Tambah Elemen Teks
                                    </Button>
                                   
                                </CardContent>
                            </Card>

                            {selectedElement && (
                                <Card className="rounded-2xl border-gray-100 shadow-sm dark:border-gray-700">
                                    <CardHeader>
                                        <CardTitle className="text-base">Properti Elemen</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {(() => {
                                            const element = elements.find((el) => el.id === selectedElement);
                                            if (!element) return null;

                                            return (
                                                <>
                                                    <div className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs dark:border-gray-700 dark:bg-gray-900">
                                                        <p className="font-semibold text-gray-800 dark:text-gray-100">{element.label}</p>
                                                        <p className="text-gray-500">{element.type === 'text' ? 'Elemen Teks' : 'Elemen Signature'}</p>
                                                    </div>

                                                    <div className="rounded-md border border-gray-200 bg-gray-50 p-2 text-xs space-y-1 dark:border-gray-700 dark:bg-gray-900">
                                                        <p className="text-gray-700 dark:text-gray-300">Posisi: <span className="font-mono font-bold text-sky-600">({Math.round(element.x)}, {Math.round(element.y)})</span></p>
                                                        <p className="text-gray-700 dark:text-gray-300">Ukuran: <span className="font-mono font-bold text-emerald-600">{Math.round(element.width)} x {Math.round(element.height)}</span></p>
                                                    </div>

                                                    <div>
                                                        <Label className="text-xs font-semibold">Label Elemen</Label>
                                                        <Input
                                                            type="text"
                                                            value={element.label}
                                                            onChange={(e) =>
                                                                handleElementChange(selectedElement, {
                                                                    label: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Nama elemen"
                                                            className="mt-1 text-xs h-8"
                                                        />
                                                    </div>

                                                    {(element.id === 'customMessage' || element.id.startsWith('customMessage_')) && element.type === 'text' && (
                                                        <div>
                                                            <Label className="text-xs font-semibold">Isi Pesan Custom</Label>
                                                            <Textarea
                                                                value={element.value || ''}
                                                                onChange={(e) =>
                                                                    handleElementChange(selectedElement, {
                                                                        value: e.target.value,
                                                                    })
                                                                }
                                                                placeholder="Contoh: Dengan hormat diberikan kepada..."
                                                                className="mt-1 text-xs min-h-22"
                                                            />
                                                            <p className="text-[11px] text-gray-500 mt-1">
                                                                Isi ini akan tampil di sertifikat user.
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                                                        <Label className="text-xs font-semibold block mb-2">Posisi (X, Y)</Label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <Label className="text-xs text-gray-600">X (Dari Kiri)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={Math.round(element.x)}
                                                                    onChange={(e) =>
                                                                        handleElementChange(selectedElement, {
                                                                            x: parseInt(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    min="0"
                                                                    className="mt-1 text-xs h-8"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-gray-600">Y (Dari Atas)</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={Math.round(element.y)}
                                                                    onChange={(e) =>
                                                                        handleElementChange(selectedElement, {
                                                                            y: parseInt(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    min="0"
                                                                    className="mt-1 text-xs h-8"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                                                        <Label className="text-xs font-semibold block mb-2">Ukuran (Lebar x Tinggi)</Label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <Label className="text-xs text-gray-600">Lebar</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={Math.round(element.width)}
                                                                    onChange={(e) =>
                                                                        handleElementChange(selectedElement, {
                                                                            width: parseInt(e.target.value) || 100,
                                                                        })
                                                                    }
                                                                    min="50"
                                                                    className="mt-1 text-xs h-8"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-gray-600">Tinggi</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={Math.round(element.height)}
                                                                    onChange={(e) =>
                                                                        handleElementChange(selectedElement, {
                                                                            height: parseInt(e.target.value) || 50,
                                                                        })
                                                                    }
                                                                    min="30"
                                                                    className="mt-1 text-xs h-8"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {element.type === 'text' && (
                                                        <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                                                            <Label className="text-xs font-semibold">Ukuran Font</Label>
                                                            <Input
                                                                type="number"
                                                                value={element.fontSize}
                                                                onChange={(e) =>
                                                                    handleElementChange(selectedElement, {
                                                                        fontSize: parseInt(e.target.value) || 16,
                                                                    })
                                                                }
                                                                min="8"
                                                                max="72"
                                                                className="mt-1 text-xs h-8"
                                                            />
                                                        </div>
                                                    )}

                                                    {element.type === 'text' && (
                                                        <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                                                            <Label className="text-xs font-semibold">Warna Teks</Label>
                                                            <div className="flex items-center mt-2 gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={element.color}
                                                                    onChange={(e) =>
                                                                        handleElementChange(selectedElement, {
                                                                            color: e.target.value,
                                                                        })
                                                                    }
                                                                    className="h-10 w-10 cursor-pointer rounded border-2 border-gray-300"
                                                                />
                                                                <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-300">{element.color}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.get(certificateTemplates.index.url())}
                            disabled={processing}
                            className="sm:w-32"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="bg-sky-600 text-white hover:bg-sky-700 sm:w-44"
                            disabled={processing}
                        >
                            {processing ? 'Menyimpan...' : template ? 'Perbarui Sertifikat' : 'Tambah Sertifikat'}
                        </Button>
                    </div>
                </form>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogTitle>Hapus Elemen</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus elemen ini dari tata letak sertifikat?
                    </AlertDialogDescription>
                    <div className="flex justify-end gap-3">
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteElement}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Hapus
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

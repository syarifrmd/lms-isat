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
    type: 'text' | 'qrcode';
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
    { id: 'qrCode', label: 'QR Code', type: 'qrcode', x: 450, y: 300, width: 100, height: 100 },
];

export default function Form({ template }: { template?: CertificateTemplate }) {
    const { errors } = usePage().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        template?.background_image_path ? `/storage/${template.background_image_path}` : null
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

    const { data, setData, post, put, processing } = useForm({
        name: template?.name || '',
        background_image: null as File | null,
        layout_data: JSON.stringify({ elements, canvasWidth, canvasHeight }),
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setData('layout_data', JSON.stringify({ elements, canvasWidth, canvasHeight }));
        }, 300);
        return () => clearTimeout(timer);
    }, [elements, canvasWidth, canvasHeight]);

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
                <div className="max-w-4xl mx-auto space-y-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.get(certificateTemplates.index.url())}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali
                    </Button>

                    <Card>
                        <CardHeader>
                            <CardTitle>{template ? 'Edit Desain Sertifikat' : 'Buat Desain Sertifikat'}</CardTitle>
                            <CardDescription>
                                Unggah gambar background sertifikat untuk memulai
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Nama Desain</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: Desain Sertifikat 2026"
                                        className="mt-2"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <Label>Background Sertifikat</Label>
                                    <div
                                        className="mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
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
            <div className="max-w-7xl mx-auto space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => router.get(certificateTemplates.index.url())}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali
                </Button>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{template ? 'Edit Desain Sertifikat' : 'Buat Desain Sertifikat'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Nama Desain</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Contoh: Desain Sertifikat 2026"
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <Label>Ganti Background (Opsional)</Label>
                                    <div
                                        className="mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
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
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Canvas Area */}
                        <div className="lg:col-span-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Editor Tata Letak</CardTitle>
                                    <CardDescription>
                                        Drag elemen atau ubah nilai di panel kanan untuk preview real-time
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div
                                        className="border-2 border-gray-300 rounded-lg mx-auto relative bg-gray-100"
                                        style={{
                                            width: '100%',
                                            maxHeight: '600px',
                                            overflow: 'auto',
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'relative',
                                                width: `${canvasWidth}px`,
                                                height: `${canvasHeight}px`,
                                                margin: '0 auto',
                                                backgroundImage: `url('${imagePreview}')`,
                                                backgroundSize: 'contain',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            {elements.map((element) => (
                                                <Rnd
                                                    key={element.id}
                                                    position={{
                                                        x: element.x,
                                                        y: element.y,
                                                    }}
                                                    size={{
                                                        width: element.width,
                                                        height: element.height,
                                                    }}
                                                    onDragStop={(e, d) => {
                                                        handleElementChange(element.id, {
                                                            x: Math.round(d.x),
                                                            y: Math.round(d.y),
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
                                                                ? 'border-blue-500 bg-blue-400 bg-opacity-80 text-white'
                                                                : 'border-gray-400 bg-gray-600 bg-opacity-50 text-white hover:bg-opacity-70'
                                                        }`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            fontSize: `${Math.max(9, Math.min((element.fontSize || 16) / 3, 14))}px`,
                                                        }}
                                                    >
                                                        <span className="px-1 text-center whitespace-pre-wrap break-words leading-tight">
                                                            {element.type === 'qrcode'
                                                                ? '📱 QR'
                                                                : element.id === 'customMessage' || element.id.startsWith('customMessage_')
                                                                  ? (element.value || 'Pesan Custom').substring(0, 60)
                                                                  : element.label.substring(0, 20)}
                                                        </span>
                                                    </div>
                                                </Rnd>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Properties Panel */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Elemen</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                                    {elements.map((element) => (
                                        <div
                                            key={element.id}
                                            onClick={() => setSelectedElement(element.id)}
                                            className={`p-3 rounded-lg cursor-pointer border-2 transition ${
                                                selectedElement === element.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 truncate">
                                                    <p className="font-medium text-sm truncate">{element.label}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {element.type === 'text' ? 'Teks' : 'QR Code'}
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
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full mt-2 text-xs"
                                        onClick={handleAddElement}
                                    >
                                        <Plus className="h-3 w-3 mr-2" />
                                        Tambah
                                    </Button>
                                </CardContent>
                            </Card>

                            {selectedElement && (
                                <Card className="bg-blue-50 border-blue-200">
                                    <CardHeader>
                                        <CardTitle className="text-base">📍 Properti</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {(() => {
                                            const element = elements.find((el) => el.id === selectedElement);
                                            if (!element) return null;

                                            return (
                                                <>
                                                    <div className="bg-white p-2 rounded border border-blue-200 text-xs">
                                                        <p className="font-semibold text-blue-700">{element.label}</p>
                                                        <p className="text-gray-500">{element.type === 'text' ? '📝 Elemen Teks' : '📱 QR Code'}</p>
                                                    </div>

                                                    <div className="bg-white p-2 rounded border border-blue-200 text-xs space-y-1">
                                                        <p className="text-gray-700">📍 Pos: <span className="font-mono font-bold text-blue-600">({Math.round(element.x)}, {Math.round(element.y)})</span></p>
                                                        <p className="text-gray-700">📦 Ukr: <span className="font-mono font-bold text-green-600">{Math.round(element.width)}×{Math.round(element.height)}</span></p>
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
                                                                className="mt-1 text-xs min-h-[88px]"
                                                            />
                                                            <p className="text-[11px] text-gray-500 mt-1">
                                                                Isi ini akan tampil di sertifikat user.
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="border-t border-blue-200 pt-2">
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
                                                                    className="mt-1 text-xs h-8 border-blue-300 focus:ring-blue-400"
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
                                                                    className="mt-1 text-xs h-8 border-blue-300 focus:ring-blue-400"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-blue-200 pt-2">
                                                        <Label className="text-xs font-semibold block mb-2">Ukuran (Lebar × Tinggi)</Label>
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
                                                                    className="mt-1 text-xs h-8 border-green-300 focus:ring-green-400"
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
                                                                    className="mt-1 text-xs h-8 border-green-300 focus:ring-green-400"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {element.fontSize && (
                                                        <div className="border-t border-blue-200 pt-2">
                                                            <Label className="text-xs font-semibold">🔤 Ukuran Font</Label>
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
                                                                className="mt-1 text-xs h-8 border-purple-300 focus:ring-purple-400"
                                                            />
                                                        </div>
                                                    )}

                                                    {element.color && (
                                                        <div className="border-t border-blue-200 pt-2">
                                                            <Label className="text-xs font-semibold">🎨 Warna Teks</Label>
                                                            <div className="flex items-center mt-2 gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={element.color}
                                                                    onChange={(e) =>
                                                                        handleElementChange(selectedElement, {
                                                                            color: e.target.value,
                                                                        })
                                                                    }
                                                                    className="w-10 h-10 rounded cursor-pointer border-2 border-gray-300"
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

                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.get(certificateTemplates.index.url())}
                            disabled={processing}
                            size="sm"
                        >
                            Batal
                        </Button>
                        <Button disabled={processing || !data.name} size="sm">
                            {processing ? 'Menyimpan...' : template ? 'Perbarui' : 'Buat'}
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

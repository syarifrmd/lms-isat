import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Upload,
    FileSpreadsheet,
    ArrowRight,
    ArrowLeft,
    Download,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Loader2,
    X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'mapping' | 'preview' | 'result';

interface SystemField {
    key: 'nik' | 'name' | 'email' | 'role' | 'region';
    label: string;
    required: boolean;
    hint?: string;
}

interface Mapping {
    nik: string;
    name: string;
    email: string;
    role: string;
    region: string;
}

interface ImportError {
    row: number;
    nik: string;
    message: string;
}

interface ImportResult {
    success: number;
    failed: number;
    errors: ImportError[];
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYSTEM_FIELDS: SystemField[] = [
    { key: 'nik',    label: 'NIK',    required: true,  hint: 'ID unik pegawai' },
    { key: 'name',   label: 'Nama',   required: true },
    { key: 'email',  label: 'Email',  required: false },
    { key: 'role',   label: 'Role',   required: false, hint: 'admin / trainer / user (default: user)' },
    { key: 'region', label: 'Region', required: false },
];

/** Common header synonyms for auto-matching */
const SYNONYMS: Record<string, string[]> = {
    nik:    ['nik', 'id', 'nip', 'no', 'nomor', 'employee_id', 'employeeid', 'kode'],
    name:   ['name', 'nama', 'fullname', 'full_name', 'namalengkap', 'nama_lengkap'],
    email:  ['email', 'e-mail', 'surel', 'mail'],
    role:   ['role', 'peran', 'jabatan', 'tipe', 'type'],
    region: ['region', 'wilayah', 'area', 'kota', 'daerah', 'lokasi'],
};

const NONE = '__none__';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function autoMatch(headers: string[]): Mapping {
    const mapping: Mapping = { nik: NONE, name: NONE, email: NONE, role: NONE, region: NONE };
    const lowerHeaders = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));

    (Object.keys(SYNONYMS) as Array<keyof typeof SYNONYMS>).forEach(field => {
        const synonyms = SYNONYMS[field];
        for (let i = 0; i < lowerHeaders.length; i++) {
            if (synonyms.includes(lowerHeaders[i])) {
                mapping[field as keyof Mapping] = headers[i];
                break;
            }
        }
    });

    return mapping;
}

function parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const wb = XLSX.read(data, { type: 'binary', raw: false, cellDates: true });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, {
                    raw: false,
                    defval: '',
                });
                if (json.length === 0) {
                    reject(new Error('File kosong atau tidak memiliki data.'));
                    return;
                }
                const headers = Object.keys(json[0]);
                resolve({ headers, rows: json });
            } catch {
                reject(new Error('File tidak dapat dibaca. Pastikan format file valid.'));
            }
        };
        reader.onerror = () => reject(new Error('Gagal membaca file.'));
        reader.readAsBinaryString(file);
    });
}

function applyMapping(rows: Record<string, string>[], mapping: Mapping) {
    return rows.map(row => ({
        nik:    mapping.nik    !== NONE ? String(row[mapping.nik]    ?? '').trim() : '',
        name:   mapping.name   !== NONE ? String(row[mapping.name]   ?? '').trim() : '',
        email:  mapping.email  !== NONE ? String(row[mapping.email]  ?? '').trim() : '',
        role:   mapping.role   !== NONE ? String(row[mapping.role]   ?? '').trim().toLowerCase() : 'user',
        region: mapping.region !== NONE ? String(row[mapping.region] ?? '').trim() : '',
    }));
}

// ─── Step indicators ──────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
    { id: 'upload',  label: 'Upload File' },
    { id: 'mapping', label: 'Mapping Kolom' },
    { id: 'preview', label: 'Preview Data' },
    { id: 'result',  label: 'Hasil Import' },
];

function StepIndicator({ current }: { current: Step }) {
    const currentIndex = STEPS.findIndex(s => s.id === current);
    return (
        <div className="flex items-center gap-2 mb-6">
            {STEPS.map((step, i) => (
                <React.Fragment key={step.id}>
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                            i < currentIndex  ? 'bg-green-500 border-green-500 text-white' :
                            i === currentIndex ? 'bg-primary border-primary text-primary-foreground' :
                                                 'border-muted-foreground/30 text-muted-foreground'
                        }`}>
                            {i < currentIndex ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-sm hidden sm:block ${i === currentIndex ? 'font-semibold' : 'text-muted-foreground'}`}>
                            {step.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 ${i < currentIndex ? 'bg-green-500' : 'bg-muted'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ImportUserModal({ open, onOpenChange, onSuccess }: Props) {
    const [step, setStep]           = useState<Step>('upload');
    const [file, setFile]           = useState<File | null>(null);
    const [headers, setHeaders]     = useState<string[]>([]);
    const [rawRows, setRawRows]     = useState<Record<string, string>[]>([]);
    const [mapping, setMapping]     = useState<Mapping>({ nik: NONE, name: NONE, email: NONE, role: NONE, region: NONE });
    const [isDragging, setIsDragging] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isParsing, setIsParsing]   = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult]         = useState<ImportResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Reset on close ────────────────────────────────────────────────────────

    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setStep('upload');
            setFile(null);
            setHeaders([]);
            setRawRows([]);
            setMapping({ nik: NONE, name: NONE, email: NONE, role: NONE, region: NONE });
            setParseError(null);
            setResult(null);
        }
        onOpenChange(val);
    };

    // ── File handling ─────────────────────────────────────────────────────────

    const handleFile = useCallback(async (f: File) => {
        const allowed = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'application/csv',
        ];
        const extAllowed = /\.(xlsx|xls|csv)$/i.test(f.name);
        if (!allowed.includes(f.type) && !extAllowed) {
            setParseError('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv');
            return;
        }
        setIsParsing(true);
        setParseError(null);
        try {
            const { headers: h, rows } = await parseFile(f);
            setFile(f);
            setHeaders(h);
            setRawRows(rows);
            setMapping(autoMatch(h));
            setStep('mapping');
        } catch (err: unknown) {
            setParseError(err instanceof Error ? err.message : 'Gagal membaca file.');
        } finally {
            setIsParsing(false);
        }
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
        // Reset input so the same file can be re-uploaded
        e.target.value = '';
    };

    // ── Mapping validation ────────────────────────────────────────────────────

    const mappingValid = mapping.nik !== NONE && mapping.name !== NONE;

    // ── Mapped preview rows (first 10) ────────────────────────────────────────

    const mappedRows = applyMapping(rawRows, mapping);
    const previewRows = mappedRows.slice(0, 10);

    // ── Import submit ─────────────────────────────────────────────────────────

    const handleImport = async () => {
        setIsImporting(true);
        try {
            const { data } = await axios.post<ImportResult>('/admin/users/import', {
                rows: mappedRows,
            });
            setResult(data);
            setStep('result');
            if (data.success > 0 && onSuccess) onSuccess();
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err)
                ? (err.response?.data?.message ?? 'Terjadi kesalahan saat import.')
                : 'Terjadi kesalahan saat import.';
            setParseError(msg);
        } finally {
            setIsImporting(false);
        }
    };

    // ── Template download via anchor ─────────────────────────────────────────

    const handleDownloadTemplate = () => {
        window.location.href = '/admin/users/import/template';
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5" />
                        Import Data User
                    </DialogTitle>
                    <DialogDescription>
                        Upload file Excel atau CSV, cocokkan kolom, lalu import data.
                    </DialogDescription>
                </DialogHeader>

                <StepIndicator current={step} />

                {/* ── Step 1: Upload ─────────────────────────────────────── */}
                {step === 'upload' && (
                    <div className="space-y-4">
                        {/* Drop zone */}
                        <div
                            onClick={() => inputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
                            }`}
                        >
                            {isParsing ? (
                                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                            ) : (
                                <Upload className="w-10 h-10 text-muted-foreground" />
                            )}
                            <div className="text-center">
                                <p className="font-semibold">
                                    {isParsing ? 'Membaca file...' : 'Klik atau drag & drop file di sini'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Format yang didukung: .xlsx, .xls, .csv
                                </p>
                            </div>
                        </div>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={onInputChange}
                        />

                        {parseError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {parseError}
                            </div>
                        )}

                        {/* Download template */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                            <div>
                                <p className="text-sm font-medium">Butuh template?</p>
                                <p className="text-xs text-muted-foreground">Download template CSV sebagai panduan format file</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Template
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Mapping ────────────────────────────────────── */}
                {step === 'mapping' && (
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    File: <span className="font-medium text-foreground">{file?.name}</span>
                                    {' · '}{rawRows.length} baris
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="w-4 h-4 mr-2" />
                                Template
                            </Button>
                        </div>

                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-1/3">Kolom Sistem</TableHead>
                                        <TableHead className="w-2/3">Kolom di File</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {SYSTEM_FIELDS.map((field) => (
                                        <TableRow key={field.key}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{field.label}</span>
                                                    {field.required && (
                                                        <Badge variant="destructive" className="text-xs px-1 py-0">wajib</Badge>
                                                    )}
                                                </div>
                                                {field.hint && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">{field.hint}</p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={mapping[field.key]}
                                                    onValueChange={(val) =>
                                                        setMapping(prev => ({ ...prev, [field.key]: val }))
                                                    }
                                                >
                                                    <SelectTrigger className={`w-full ${
                                                        field.required && mapping[field.key] === NONE
                                                            ? 'border-destructive ring-destructive'
                                                            : ''
                                                    }`}>
                                                        <SelectValue placeholder="— Pilih kolom —" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={NONE}>— Tidak digunakan —</SelectItem>
                                                        {headers.map(h => (
                                                            <SelectItem key={h} value={h}>
                                                                {h}
                                                                {mapping[field.key] === h && ' ✓'}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {!mappingValid && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm border border-amber-200 dark:border-amber-800">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                Kolom <strong>NIK</strong> dan <strong>Nama</strong> wajib dimapping sebelum melanjutkan.
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep('upload')}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali
                            </Button>
                            <Button disabled={!mappingValid} onClick={() => setStep('preview')}>
                                Lihat Preview
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Preview ────────────────────────────────────── */}
                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Total <span className="font-semibold text-foreground">{rawRows.length}</span> baris akan diimport.
                                {rawRows.length > 10 && ` (menampilkan 10 baris pertama)`}
                            </p>
                        </div>

                        <div className="rounded-lg border overflow-hidden overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">#</TableHead>
                                        <TableHead>NIK</TableHead>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Region</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewRows.map((row, i) => (
                                        <TableRow key={i} className={!row.nik || !row.name ? 'bg-destructive/5' : ''}>
                                            <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {row.nik || <span className="text-destructive italic">kosong</span>}
                                            </TableCell>
                                            <TableCell>
                                                {row.name || <span className="text-destructive italic">kosong</span>}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {row.email || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {row.role ? (
                                                    <Badge variant="secondary">{row.role}</Badge>
                                                ) : (
                                                    <Badge variant="outline">user</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {row.region || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {parseError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {parseError}
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep('mapping')}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali
                            </Button>
                            <Button onClick={handleImport} disabled={isImporting}>
                                {isImporting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mengimport...</>
                                ) : (
                                    <>Import {rawRows.length} Data<ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step 4: Result ─────────────────────────────────────── */}
                {step === 'result' && result && (
                    <div className="space-y-4">
                        {/* Summary cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-semibold">Berhasil</span>
                                </div>
                                <div className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
                                    {result.success}
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-500">data berhasil diimport</p>
                            </div>
                            <div className={`rounded-lg border p-4 ${
                                result.failed > 0
                                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                                    : 'bg-muted/30'
                            }`}>
                                <div className={`flex items-center gap-2 ${result.failed > 0 ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground'}`}>
                                    <XCircle className="w-5 h-5" />
                                    <span className="font-semibold">Gagal</span>
                                </div>
                                <div className={`text-3xl font-bold mt-1 ${result.failed > 0 ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground'}`}>
                                    {result.failed}
                                </div>
                                <p className={`text-xs ${result.failed > 0 ? 'text-red-600 dark:text-red-500' : 'text-muted-foreground'}`}>
                                    data gagal diimport
                                </p>
                            </div>
                        </div>

                        {/* Error details */}
                        {result.errors.length > 0 && (
                            <div className="rounded-lg border">
                                <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                    <span className="text-sm font-semibold">Detail Error ({result.errors.length} baris)</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-16">Baris</TableHead>
                                                <TableHead>NIK</TableHead>
                                                <TableHead>Keterangan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.errors.map((err, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="text-sm text-muted-foreground">{err.row}</TableCell>
                                                    <TableCell className="font-mono text-sm">{err.nik || '-'}</TableCell>
                                                    <TableCell className="text-sm text-destructive">{err.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => {
                                setStep('upload');
                                setFile(null);
                                setHeaders([]);
                                setRawRows([]);
                                setMapping({ nik: NONE, name: NONE, email: NONE, role: NONE, region: NONE });
                                setParseError(null);
                                setResult(null);
                            }}>
                                Import Lagi
                            </Button>
                            <Button onClick={() => handleOpenChange(false)}>
                                <X className="w-4 h-4 mr-2" />
                                Tutup
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

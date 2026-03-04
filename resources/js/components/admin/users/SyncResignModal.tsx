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
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    UserMinus,
    ShieldAlert,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'mapping' | 'preview' | 'result';

interface MappedRow {
    nik: string;
    status: string;
}

interface SyncResult {
    deleted: number;
    skipped: number;
    not_found: number;
    protected: number;
    deleted_users: { nik: string; name: string }[];
    errors: { row: number; nik: string; message: string }[];
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NONE = '__none__';
const NIK_SYNONYMS    = ['nik', 'id', 'nip', 'no', 'nomor', 'employee_id', 'employeeid', 'kode'];
const STATUS_SYNONYMS = ['status', 'kondisi', 'state', 'keterangan'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function autoMatch(headers: string[]): { nik: string; status: string } {
    const lower = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
    const find  = (synonyms: string[]) => {
        const i = lower.findIndex(h => synonyms.includes(h));
        return i >= 0 ? headers[i] : NONE;
    };
    return { nik: find(NIK_SYNONYMS), status: find(STATUS_SYNONYMS) };
}

function parseFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb   = XLSX.read(e.target?.result, { type: 'binary', raw: false });
                const ws   = wb.Sheets[wb.SheetNames[0]];
                const json: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
                if (!json.length) { reject(new Error('File kosong atau tidak memiliki data.')); return; }
                resolve({ headers: Object.keys(json[0]), rows: json });
            } catch {
                reject(new Error('File tidak dapat dibaca. Pastikan format file valid.'));
            }
        };
        reader.onerror = () => reject(new Error('Gagal membaca file.'));
        reader.readAsBinaryString(file);
    });
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string }[] = [
    { id: 'upload',  label: 'Upload File' },
    { id: 'mapping', label: 'Mapping Kolom' },
    { id: 'preview', label: 'Konfirmasi' },
    { id: 'result',  label: 'Hasil' },
];

function StepIndicator({ current }: { current: Step }) {
    const ci = STEPS.findIndex(s => s.id === current);
    return (
        <div className="flex items-center gap-2 mb-6">
            {STEPS.map((step, i) => (
                <React.Fragment key={step.id}>
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                            i < ci   ? 'bg-green-500 border-green-500 text-white' :
                            i === ci ? 'bg-primary border-primary text-primary-foreground' :
                                       'border-muted-foreground/30 text-muted-foreground'
                        }`}>
                            {i < ci ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-sm hidden sm:block ${i === ci ? 'font-semibold' : 'text-muted-foreground'}`}>
                            {step.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 ${i < ci ? 'bg-green-500' : 'bg-muted'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SyncResignModal({ open, onOpenChange, onSuccess }: Props) {
    const [step, setStep]             = useState<Step>('upload');
    const [file, setFile]             = useState<File | null>(null);
    const [headers, setHeaders]       = useState<string[]>([]);
    const [rawRows, setRawRows]       = useState<Record<string, string>[]>([]);
    const [mapping, setMapping]       = useState({ nik: NONE, status: NONE });
    const [isDragging, setIsDragging] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isParsing, setIsParsing]   = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult]         = useState<SyncResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Reset ─────────────────────────────────────────────────────────────────

    const reset = () => {
        setStep('upload');
        setFile(null);
        setHeaders([]);
        setRawRows([]);
        setMapping({ nik: NONE, status: NONE });
        setParseError(null);
        setResult(null);
    };

    const handleOpenChange = (val: boolean) => {
        if (!val) reset();
        onOpenChange(val);
    };

    // ── Derived: mapped rows ──────────────────────────────────────────────────

    const mappedRows: MappedRow[] = rawRows.map(row => ({
        nik:    mapping.nik    !== NONE ? String(row[mapping.nik]    ?? '').trim() : '',
        status: mapping.status !== NONE ? String(row[mapping.status] ?? '').trim().toLowerCase() : '',
    }));

    const toDelete  = mappedRows.filter(r => r.nik && r.status === 'off');
    const toKeep    = mappedRows.filter(r => r.nik && r.status !== 'off' && r.status !== '');
    const blankRows = mappedRows.filter(r => !r.nik);

    // ── File handling ─────────────────────────────────────────────────────────

    const handleFile = useCallback(async (f: File) => {
        if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
            setParseError('Format tidak didukung. Gunakan .xlsx, .xls, atau .csv');
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

    // ── Submit ────────────────────────────────────────────────────────────────

    const mappingValid = mapping.nik !== NONE && mapping.status !== NONE;

    const handleSync = async () => {
        setIsProcessing(true);
        setParseError(null);
        try {
            const { data } = await axios.post<SyncResult>('/admin/users/sync-resign', {
                rows: mappedRows,
            });
            setResult(data);
            setStep('result');
            if (data.deleted > 0 && onSuccess) onSuccess();
        } catch (err: unknown) {
            const msg = axios.isAxiosError(err)
                ? (err.response?.data?.message ?? 'Terjadi kesalahan.')
                : 'Terjadi kesalahan.';
            setParseError(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserMinus className="w-5 h-5 text-destructive" />
                        Sinkronisasi Data Resign
                    </DialogTitle>
                    <DialogDescription>
                        Upload file dataset dengan kolom NIK dan Status.
                        User yang ber-status <strong>off</strong> akan dihapus otomatis dari sistem.
                    </DialogDescription>
                </DialogHeader>

                <StepIndicator current={step} />

                {/* ── Step 1: Upload ──────────────────────────────────────── */}
                {step === 'upload' && (
                    <div className="space-y-4">
                        {/* Drop zone */}
                        <div
                            onClick={() => inputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                                isDragging
                                    ? 'border-destructive bg-destructive/5'
                                    : 'border-muted-foreground/30 hover:border-destructive/50 hover:bg-muted/30'
                            }`}
                        >
                            {isParsing
                                ? <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                : <Upload className="w-10 h-10 text-muted-foreground" />
                            }
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
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFile(f);
                                e.target.value = '';
                            }}
                        />

                        {parseError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {parseError}
                            </div>
                        )}

                        {/* Info box */}
                        <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-2">
                                <ShieldAlert className="w-4 h-4" />
                                Panduan Format File
                            </div>
                            <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                                <li>File harus memiliki kolom <strong>NIK</strong> dan kolom <strong>Status</strong></li>
                                <li>
                                    Nilai status:{' '}
                                    <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">active</code>
                                    {' '}= dipertahankan,{' '}
                                    <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded text-red-700 dark:text-red-400">off</code>
                                    {' '}= dihapus
                                </li>
                                <li>Aksi penghapusan bersifat <strong>permanen</strong> dan tidak dapat dibatalkan</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* ── Step 2: Mapping ─────────────────────────────────────── */}
                {step === 'mapping' && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            File: <span className="font-medium text-foreground">{file?.name}</span>
                            {' · '}{rawRows.length} baris
                        </p>

                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-1/3">Kolom Sistem</TableHead>
                                        <TableHead className="w-2/3">Kolom di File</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {([
                                        { key: 'nik'    as const, label: 'NIK',    hint: 'ID unik pegawai' },
                                        { key: 'status' as const, label: 'Status', hint: 'Nilai: active / off' },
                                    ] as const).map(field => (
                                        <TableRow key={field.key}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{field.label}</span>
                                                    <Badge variant="destructive" className="text-xs px-1 py-0">wajib</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">{field.hint}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={mapping[field.key]}
                                                    onValueChange={val =>
                                                        setMapping(prev => ({ ...prev, [field.key]: val }))
                                                    }
                                                >
                                                    <SelectTrigger className={`w-full ${
                                                        mapping[field.key] === NONE ? 'border-destructive' : ''
                                                    }`}>
                                                        <SelectValue placeholder="— Pilih kolom —" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={NONE}>— Pilih kolom —</SelectItem>
                                                        {headers.map(h => (
                                                            <SelectItem key={h} value={h}>{h}</SelectItem>
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
                                Kedua kolom harus dimapping sebelum melanjutkan.
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep('upload')}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Kembali
                            </Button>
                            <Button disabled={!mappingValid} onClick={() => setStep('preview')}>
                                Lihat Konfirmasi
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step 3: Preview / Konfirmasi ────────────────────────── */}
                {step === 'preview' && (
                    <div className="space-y-4">
                        {/* Summary chips */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-center">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    {toDelete.length}
                                </div>
                                <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                    Akan Dihapus <Badge variant="destructive" className="ml-1 text-xs px-1 py-0">off</Badge>
                                </div>
                            </div>
                            <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {toKeep.length}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                                    Dipertahankan <Badge className="ml-1 text-xs px-1 py-0 bg-green-500">active</Badge>
                                </div>
                            </div>
                            <div className="rounded-lg border p-3 text-center">
                                <div className="text-2xl font-bold text-muted-foreground">
                                    {blankRows.length}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">NIK Kosong (dilewati)</div>
                            </div>
                        </div>

                        {/* Users to be deleted */}
                        {toDelete.length > 0 ? (
                            <div className="rounded-lg border overflow-hidden">
                                <div className="flex items-center gap-2 p-3 border-b bg-red-50 dark:bg-red-950/30">
                                    <UserMinus className="w-4 h-4 text-destructive" />
                                    <span className="text-sm font-semibold text-destructive">
                                        {toDelete.length} user akan dihapus
                                    </span>
                                </div>
                                <div className="max-h-52 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-10">#</TableHead>
                                                <TableHead>NIK</TableHead>
                                                <TableHead>Status di File</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {toDelete.map((row, i) => (
                                                <TableRow key={i} className="bg-red-50/50 dark:bg-red-950/10">
                                                    <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                                                    <TableCell className="font-mono text-sm">{row.nik}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="destructive">off</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 rounded-lg border text-center text-muted-foreground">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                <p className="font-medium">Tidak ada user dengan status <strong>off</strong></p>
                                <p className="text-sm mt-1">Tidak ada data yang akan dihapus.</p>
                            </div>
                        )}

                        {/* Danger warning */}
                        {toDelete.length > 0 && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                Penghapusan bersifat <strong className="ml-1">permanen</strong>.
                                Pastikan data sudah benar sebelum melanjutkan.
                            </div>
                        )}

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
                            {toDelete.length > 0 ? (
                                <Button
                                    variant="destructive"
                                    onClick={handleSync}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</>
                                    ) : (
                                        <><UserMinus className="w-4 h-4 mr-2" />Hapus {toDelete.length} User</>
                                    )}
                                </Button>
                            ) : (
                                <Button onClick={() => handleOpenChange(false)}>Selesai</Button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Step 4: Result ──────────────────────────────────────── */}
                {step === 'result' && result && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-lg border p-4 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                    <UserMinus className="w-5 h-5" />
                                    <span className="font-semibold">Dihapus</span>
                                </div>
                                <div className="text-3xl font-bold text-red-700 dark:text-red-400 mt-1">
                                    {result.deleted}
                                </div>
                                <p className="text-xs text-red-600 dark:text-red-500">user berhasil dihapus</p>
                            </div>
                            <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-semibold">Dipertahankan</span>
                                </div>
                                <div className="text-3xl font-bold text-green-700 dark:text-green-400 mt-1">
                                    {result.skipped}
                                </div>
                                <p className="text-xs text-green-600 dark:text-green-500">user tetap aktif</p>
                            </div>
                        </div>

                        {/* Deleted users list */}
                        {result.deleted_users.length > 0 && (
                            <div className="rounded-lg border overflow-hidden">
                                <div className="p-3 border-b bg-muted/30 text-sm font-semibold">
                                    User yang dihapus ({result.deleted_users.length})
                                </div>
                                <div className="max-h-44 overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>NIK</TableHead>
                                                <TableHead>Nama</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {result.deleted_users.map((u, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="font-mono text-sm">{u.nik}</TableCell>
                                                    <TableCell>{u.name}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* Errors / not found */}
                        {result.errors.length > 0 && (
                            <div className="rounded-lg border overflow-hidden">
                                <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                    <span className="text-sm font-semibold">
                                        Catatan ({result.errors.length})
                                    </span>
                                </div>
                                <div className="max-h-44 overflow-y-auto">
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
                                                    <TableCell className="font-mono text-sm">{err.nik}</TableCell>
                                                    <TableCell className="text-sm text-destructive">{err.message}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={reset}>
                                Sync Lagi
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

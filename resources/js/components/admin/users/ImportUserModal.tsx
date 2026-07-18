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
    key: 'nik' | 'name' | 'username' | 'email' |'password' | 'role' | 'brand' | 'micro_cluster' | 'branch' | 'area' | 'region' | 'circle' | 'status' | 'division';
    label: string;
    required: boolean;
    hint?: string;
}

interface Mapping {
    nik: string;
    name: string;
    username: string;
    email: string;
    password: string;
    role: string;
    division: string;      
    brand: string;         
    micro_cluster: string; 
    branch: string;        
    area: string;
    region: string;
    circle: string;
    status: string;
}

interface ImportError {
    row: number;
    nik: string;
    message: string;
}

interface ImportResult {
    success: number;
    skipped: number;
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
    { key: 'nik',    label: 'NIK',    required: false, hint: 'ID unik pegawai. Kosongkan agar dibuat otomatis.' },
    { key: 'name',   label: 'Nama',   required: false },
    { key: 'username', label: 'Username', required: false, hint: 'Jika kosong, akan memakai NIK' },
    { key: 'email',  label: 'Email',  required: false },
    { key: 'password', label: 'Password', required: false, hint: 'Jika kosong, sistem tidak mengisi password default' },
    { key: 'role',   label: 'Role',   required: false, hint: 'admin / trainer / user' },
    { key: 'division', label: 'Division', required: false },
    { key: 'brand',         label: 'Brand',         required: false },
    { key: 'micro_cluster', label: 'Micro Cluster', required: false },
    { key: 'branch',        label: 'Branch',        required: false },
    { key: 'area',          label: 'Area',          required: false },
    { key: 'region', label: 'Region', required: false },
    { key: 'circle', label: 'Circle', required: false },
    { key: 'status', label: 'Status', required: false, hint: 'active = import, off = lewati (tidak diimport)' },
];

const SYNONYMS: Record<string, string[]> = {
    nik:    ['nik', 'id', 'nip', 'no', 'nomor', 'employee_id', 'employeeid', 'kode'],
    name:   ['name', 'nama', 'fullname', 'full_name', 'namalengkap', 'nama_lengkap'],
    username: ['username', 'user_name', 'login', 'akun'],
    email:  ['email', 'e-mail', 'surel', 'mail'],
    password: ['password', 'pass', 'kata_sandi', 'katasandi', 'sandi'],
    role:   ['role', 'peran', 'jabatan', 'tipe', 'type'],
    division: ['division', 'divisi', 'departemen', 'department'],
    brand:         ['brand', 'merek', 'merk'],
    micro_cluster: ['micro_cluster', 'micro', 'cluster', 'microcluster'],
    branch:        ['branch', 'cabang'],
    area:          ['area', 'zona', 'zone'],
    region: ['region', 'wilayah', 'kota', 'daerah', 'lokasi'],
    circle: ['circle', 'lingkaran'],
    status: ['status', 'kondisi', 'state', 'keterangan'],
};

const NONE = '__none__';

// Sending 3000-4000 rows in a single request is what was causing the server
// to error out and only save part of the data (the request would time out or
// hit body-size limits partway through, after some rows were already
// committed). Splitting into smaller batches keeps each request small and
// fast, and failures in one batch don't lose progress from the others.
const IMPORT_CHUNK_SIZE = 250;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function autoMatch(headers: string[]): Mapping {
    const mapping: Mapping = { nik: NONE, name: NONE, username: NONE, email: NONE, password: NONE, role: NONE, division: NONE, brand: NONE, micro_cluster: NONE, branch: NONE, area: NONE, region: NONE, circle: NONE, status: NONE };
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
        username: mapping.username !== NONE ? String(row[mapping.username] ?? '').trim() : '',
        email:  mapping.email  !== NONE ? String(row[mapping.email]  ?? '').trim() : '',
        password: mapping.password !== NONE ? String(row[mapping.password] ?? '').trim() : '',
        role:   mapping.role   !== NONE ? String(row[mapping.role]   ?? '').trim().toLowerCase() : '',
        division: mapping.division !== NONE ? String(row[mapping.division] ?? '').trim() : '',
        brand:         mapping.brand         !== NONE ? String(row[mapping.brand]         ?? '').trim() : '',
        micro_cluster: mapping.micro_cluster !== NONE ? String(row[mapping.micro_cluster] ?? '').trim() : '',
        branch:        mapping.branch        !== NONE ? String(row[mapping.branch]        ?? '').trim() : '',
        area:          mapping.area          !== NONE ? String(row[mapping.area]          ?? '').trim() : '',
        region: mapping.region !== NONE ? String(row[mapping.region] ?? '').trim() : '',
        circle: mapping.circle !== NONE ? String(row[mapping.circle] ?? '').trim() : '',
        status: mapping.status !== NONE ? String(row[mapping.status] ?? '').trim().toLowerCase() : '',
    }));
}

const STEPS: { id: Step; label: string }[] = [
    { id: 'upload',  label: 'Upload File' },
    { id: 'mapping', label: 'Mapping Kolom' },
    { id: 'preview', label: 'Preview Data' },
    { id: 'result',  label: 'Hasil Import' },
];

function StepIndicator({ current }: { current: Step }) {
    const currentIndex = STEPS.findIndex(s => s.id === current);
    return (
        <div className="flex items-center gap-2 mb-6 w-full select-none">
            {STEPS.map((step, i) => (
                <React.Fragment key={step.id}>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200 ${
                            i < currentIndex  ? 'bg-green-500 border-green-500 text-white' :
                            i === currentIndex ? 'bg-primary border-primary text-primary-foreground' :
                                                 'border-muted-foreground/30 text-muted-foreground'
                        }`}>
                            {i < currentIndex ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : i + 1}
                        </div>
                        <span className={`text-sm hidden md:block transition-colors ${i === currentIndex ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                            {step.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 min-w-[1.5rem] transition-colors duration-300 ${i < currentIndex ? 'bg-green-500' : 'bg-muted'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

export default function ImportUserModal({ open, onOpenChange, onSuccess }: Props) {
    const [step, setStep]           = useState<Step>('upload');
    const [file, setFile]           = useState<File | null>(null);
    const [headers, setHeaders]     = useState<string[]>([]);
    const [rawRows, setRawRows]     = useState<Record<string, string>[]>([]);
    const [mapping, setMapping]     = useState<Mapping>({ nik: NONE, name: NONE, username: NONE, email: NONE, password: NONE, role: NONE, division: NONE, brand: NONE, micro_cluster: NONE, branch: NONE, area: NONE, region: NONE, circle: NONE, status: NONE });
    const [isDragging, setIsDragging] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isParsing, setIsParsing]   = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
    const [result, setResult]         = useState<ImportResult | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setStep('upload');
            setFile(null);
            setHeaders([]);
            setRawRows([]);
            setMapping({ nik: NONE, name: NONE, username: NONE, email: NONE, password: NONE, role: NONE, division: NONE, brand: NONE, micro_cluster: NONE, branch: NONE, area: NONE, region: NONE, circle: NONE, status: NONE });
            setParseError(null);
            setResult(null);
            setImportProgress({ done: 0, total: 0 });
        }
        onOpenChange(val);
    };

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
        e.target.value = '';
    };

    const mappingValid = true;
    const mappedRows = applyMapping(rawRows, mapping);
    const importableRows = mappedRows.filter(r => r.status !== 'off');
    const skippedOffCount = mappedRows.filter(r => r.status === 'off').length;
    const previewRows = mappedRows.slice(0, 10);

    const handleImport = async () => {
        setIsImporting(true);
        setParseError(null);

        const payloadData = mappedRows.filter(r => r.status !== 'off');

        // Split into batches of IMPORT_CHUNK_SIZE rows and send them one at a
        // time. This keeps each request well within server timeouts/body-size
        // limits, and lets us show real progress for big files instead of one
        // long silent spinner.
        const chunks: typeof payloadData[] = [];
        for (let i = 0; i < payloadData.length; i += IMPORT_CHUNK_SIZE) {
            chunks.push(payloadData.slice(i, i + IMPORT_CHUNK_SIZE));
        }

        setImportProgress({ done: 0, total: payloadData.length });

        const aggregate: ImportResult = { success: 0, skipped: 0, failed: 0, errors: [] };
        let rowOffset = 0;

        try {
            for (const chunk of chunks) {
                const { data } = await axios.post<ImportResult>('/admin/users/import', { rows: chunk });

                aggregate.success += data.success;
                aggregate.skipped += data.skipped;
                aggregate.failed += data.failed;
                // Row numbers from each batch are relative to that batch, so
                // offset them back to their position in the original file.
                aggregate.errors.push(
                    ...data.errors.map(e => ({ ...e, row: e.row + rowOffset }))
                );

                rowOffset += chunk.length;
                setImportProgress(prev => ({ ...prev, done: Math.min(prev.done + chunk.length, payloadData.length) }));
            }

            setResult(aggregate);
            setStep('result');
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            // A batch failed partway through. Show whatever succeeded so far
            // instead of throwing it away, along with an error explaining
            // the interruption.
            const remaining = payloadData.length - rowOffset;
            let message: string;

            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 422) {
                    const validationErrors = err.response.data.errors;
                    if (validationErrors && typeof validationErrors === 'object') {
                        const errorMessages = Object.entries(validationErrors)
                            .map(([key, messages]) => `${key}: ${(messages as string[]).join(', ')}`)
                            .join(' | ');
                        message = `Gagal Validasi Backend: ${errorMessages}`;
                    } else {
                        message = err.response.data.message || 'Data yang dikirim tidak lolos validasi sistem.';
                    }
                } else {
                    message = err.response.data.message || 'Terjadi kesalahan internal server.';
                }
            } else {
                message = 'Terjadi kesalahan jaringan atau koneksi terputus.';
            }

            if (aggregate.success > 0 || aggregate.failed > 0) {
                aggregate.errors.push({
                    row: rowOffset + 1,
                    nik: '-',
                    message: `Proses import terhenti (${message}). ${aggregate.success} data sebelumnya sudah berhasil tersimpan, ${remaining} baris belum diproses — silakan ulangi import untuk sisa data.`,
                });
                setResult(aggregate);
                setStep('result');
            } else {
                setParseError(message);
            }
        } finally {
            setIsImporting(false);
        }
    };

    const handleDownloadTemplate = () => {
        window.location.href = '/admin/users/import/template';
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
                <DialogHeader className="space-y-1 shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <FileSpreadsheet className="w-5 h-5 text-primary" />
                        Import Data User
                    </DialogTitle>
                    <DialogDescription>
                        Upload file Excel atau CSV, cocokkan kolom, lalu import data ke sistem.
                    </DialogDescription>
                </DialogHeader>

                <div className="my-4 shrink-0">
                    <StepIndicator current={step} />
                </div>

                <div className="flex-1 overflow-y-auto pr-1 -mr-1 py-1 space-y-4 min-h-0">
                    {/* ── Step 1: Upload ─────────────────────────────────────── */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            <div
                                onClick={() => inputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={onDrop}
                                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                                    isDragging ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40'
                                }`}
                            >
                                {isParsing ? (
                                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                ) : (
                                    <Upload className="w-10 h-10 text-muted-foreground" />
                                )}
                                <div className="text-center space-y-1">
                                    <p className="font-semibold text-base">
                                        {isParsing ? 'Membaca file...' : 'Klik atau drag & drop file di sini'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
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
                                <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{parseError}</span>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-muted/70">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-semibold">Belum memiliki berkas contoh?</p>
                                    <p className="text-xs text-muted-foreground">Download template CSV sebagai panduan struktur susunan kolom data</p>
                                </div>
                                <Button variant="outline" size="sm" className="shrink-0 w-full sm:w-auto" onClick={handleDownloadTemplate}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Template
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Mapping ────────────────────────────────────── */}
                    {step === 'mapping' && (
                        <div className="space-y-4">
                            <div className="flex bg-muted/30 p-3 rounded-lg border border-muted/60">
                                <p className="text-sm text-muted-foreground">
                                    File terpilih: <span className="font-semibold text-foreground break-all">{file?.name}</span>
                                    <span className="mx-1.5">·</span>
                                    <strong className="text-foreground">{rawRows.length}</strong> baris ditemukan
                                </p>
                            </div>

                            <div className="rounded-xl border shadow-sm overflow-hidden bg-background">
                                <Table>
                                    <TableHeader className="bg-muted/40">
                                        <TableRow>
                                            <TableHead className="w-1/2 font-semibold">Kolom Sistem</TableHead>
                                            <TableHead className="w-1/2 font-semibold">Kolom di File Anda</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {SYSTEM_FIELDS.map((field) => (
                                            <TableRow key={field.key} className="hover:bg-muted/20 transition-colors">
                                                <TableCell className="align-middle py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm text-foreground">{field.label}</span>
                                                        {field.required && (
                                                            <Badge variant="destructive" className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded">wajib</Badge>
                                                        )}
                                                    </div>
                                                    {field.hint && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{field.hint}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="align-middle py-3">
                                                    <Select
                                                        value={mapping[field.key]}
                                                        onValueChange={(val) =>
                                                            setMapping(prev => ({ ...prev, [field.key]: val }))
                                                        }
                                                    >
                                                        <SelectTrigger className={`w-full h-9 text-sm transition-all ${
                                                            field.required && mapping[field.key] === NONE ? 'border-destructive/60 bg-destructive/5 text-destructive' : ''
                                                        }`}>
                                                            <SelectValue placeholder="— Pilih kolom —" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value={NONE} className="text-muted-foreground italic">
                                                                — Tidak digunakan —
                                                            </SelectItem>
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
                        </div>
                    )}

                    {/* ── Step 3: Preview ────────────────────────────────────── */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2.5 text-sm">
                                <span className="text-muted-foreground">
                                    Total Berkas: <strong className="text-foreground">{rawRows.length}</strong> baris
                                </span>
                                <div className="flex items-center gap-2 ml-auto">
                                    {skippedOffCount > 0 && (
                                        <Badge variant="outline" className="border-amber-300 bg-amber-50/50 text-amber-700 px-2.5 py-0.5">
                                            {skippedOffCount} dilewati (off)
                                        </Badge>
                                    )}
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 px-2.5 py-0.5 font-medium">
                                        {importableRows.length} akan diimport
                                    </Badge>
                                </div>
                            </div>

                            {isImporting && importProgress.total > 0 && (
                                <div className="space-y-1.5 p-3.5 rounded-lg bg-sky-50/60 border border-sky-100">
                                    <div className="flex items-center justify-between text-xs font-medium text-sky-700">
                                        <span>Mengimport data secara bertahap agar tidak timeout...</span>
                                        <span>{importProgress.done} / {importProgress.total}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-sky-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-sky-600 transition-all duration-300"
                                            style={{ width: `${Math.min(100, (importProgress.done / importProgress.total) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="rounded-xl border shadow-sm bg-background overflow-hidden">
                                <div className="overflow-x-auto max-w-full">
                                    <Table>
                                        <TableHeader className="bg-muted/40 whitespace-nowrap">
                                            <TableRow>
                                                <TableHead className="w-12 text-center font-semibold">#</TableHead>
                                                <TableHead className="font-semibold">NIK</TableHead>
                                                <TableHead className="font-semibold">Nama</TableHead>
                                                <TableHead className="font-semibold">Username</TableHead>
                                                <TableHead className="font-semibold">Email</TableHead>
                                                <TableHead className="font-semibold">Role</TableHead>
                                                <TableHead className="font-semibold">Region</TableHead>
                                                <TableHead className="font-semibold">Circle</TableHead>
                                                {mapping.status !== NONE && <TableHead className="font-semibold">Status</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="whitespace-nowrap">
                                            {previewRows.map((row, i) => {
                                                const isOff = row.status === 'off';
                                                return (
                                                    <TableRow key={i} className={`transition-colors ${isOff ? 'opacity-40 bg-muted/20' : 'hover:bg-muted/20'}`}>
                                                        <TableCell className="text-muted-foreground text-xs text-center font-medium">{i + 1}</TableCell>
                                                        <TableCell className="font-mono text-xs font-semibold">{row.nik || 'auto'}</TableCell>
                                                        <TableCell className="text-sm font-medium">{row.name || '-'}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">{row.username || '-'}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">{row.email || '-'}</TableCell>
                                                        <TableCell><Badge variant="secondary" className="text-xs font-normal capitalize">{row.role || '-'}</Badge></TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">{row.region || '-'}</TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">{row.circle || '-'}</TableCell>
                                                        {mapping.status !== NONE && (
                                                            <TableCell>
                                                                {isOff ? <Badge variant="outline">off</Badge> : <Badge className="bg-green-500 text-white">active</Badge>}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {parseError && (
                                <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{parseError}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Step 4: Result (TABEL LOG TERSTRUKTUR & RAPI) ────────── */}
                    {step === 'result' && result && (
                        <div className="space-y-5 animate-in fade-in-50 duration-200">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="rounded-xl border p-4 bg-green-50/50 border-green-200 shadow-sm">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                        <span className="text-sm font-semibold">Berhasil</span>
                                    </div>
                                    <div className="text-3xl font-extrabold text-green-700 mt-2">{result.success}</div>
                                    <p className="text-xs text-green-600 mt-1">Data pengguna diimport</p>
                                </div>

                                <div className="rounded-xl border p-4 bg-muted/40 border-muted/80 shadow-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                                        <span className="text-sm font-semibold">Dilewati</span>
                                    </div>
                                    <div className="text-3xl font-extrabold mt-2 text-muted-foreground">{result.skipped}</div>
                                    <p className="text-xs mt-1 text-muted-foreground/70">Baris status off / diabaikan</p>
                                </div>

                                <div className={`rounded-xl border p-4 shadow-sm ${result.failed > 0 ? 'bg-red-50/50 border-red-200' : 'bg-muted/40 border-muted/80'}`}>
                                    <div className={`flex items-center gap-2 ${result.failed > 0 ? 'text-red-700' : 'text-muted-foreground'}`}>
                                        <XCircle className="w-4 h-4 stroke-[2.5]" />
                                        <span className="text-sm font-semibold">Gagal</span>
                                    </div>
                                    <div className={`text-3xl font-extrabold mt-2 ${result.failed > 0 ? 'text-red-700' : 'text-muted-foreground'}`}>{result.failed}</div>
                                    <p className="text-xs mt-1 text-muted-foreground/70">Baris gagal validasi</p>
                                </div>
                            </div>

                            {/* Tabel Log Masalah / Error */}
                            {result.errors && result.errors.length > 0 && (
                                <div className="rounded-xl border shadow-sm bg-background overflow-hidden">
                                    <div className="flex items-center gap-2 p-3 border-b bg-muted/40">
                                        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                                        <span className="text-sm font-semibold text-foreground">Detail Kendala Validasi ({result.errors.length} baris)</span>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        <Table>
                                            <TableHeader className="bg-muted/30 sticky top-0 backdrop-blur z-10">
                                                <TableRow>
                                                    <TableHead className="w-20 text-center font-semibold">Baris</TableHead>
                                                    <TableHead className="w-44 font-semibold">NIK</TableHead>
                                                    <TableHead className="font-semibold">Keterangan Kendala / Error</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {result.errors.map((err, i) => (
                                                    <TableRow key={i} className="hover:bg-muted/10 transition-colors">
                                                        <TableCell className="text-sm text-muted-foreground text-center font-medium py-2.5">{err.row}</TableCell>
                                                        <TableCell className="font-mono text-xs font-semibold text-foreground py-2.5">{err.nik || '-'}</TableCell>
                                                        <TableCell className="text-sm text-destructive font-medium py-2.5 leading-relaxed">{err.message}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Actions Footer ────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-t pt-4 mt-2 shrink-0 bg-background">
                    {step === 'upload' && (
                        <div className="ml-auto">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => handleOpenChange(false)}>
                                Batal
                            </Button>
                        </div>
                    )}

                    {step === 'mapping' && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                                <ArrowLeft className="w-4 h-4 mr-1.5" />
                                Kembali
                            </Button>
                            <Button size="sm" disabled={!mappingValid} onClick={() => setStep('preview')}>
                                Lihat Preview
                                <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Button>
                        </>
                    )}

                    {step === 'preview' && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setStep('mapping')}>
                                <ArrowLeft className="w-4 h-4 mr-1.5" />
                                Sesuaikan Kolom
                            </Button>
                            <Button size="sm" onClick={handleImport} disabled={isImporting}>
                                {isImporting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses {importProgress.done}/{importProgress.total}...</>
                                ) : (
                                    <>Import {importableRows.length} Data<ArrowRight className="w-4 h-4 ml-1.5" /></>
                                )}
                            </Button>
                        </>
                    )}

                    {step === 'result' && result && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => {
                                setStep('upload');
                                setFile(null);
                                setHeaders([]);
                                setRawRows([]);
                                setMapping({ nik: NONE, name: NONE, username: NONE, email: NONE, password: NONE, role: NONE, division: NONE, brand: NONE, micro_cluster: NONE, branch: NONE, area: NONE, region: NONE, circle: NONE, status: NONE });
                                setParseError(null);
                                setResult(null);
                                setImportProgress({ done: 0, total: 0 });
                            }}>
                                Upload File Baru
                            </Button>
                            <Button size="sm" onClick={() => handleOpenChange(false)}>
                                <X className="w-4 h-4 mr-1.5" />
                                Selesai & Tutup
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
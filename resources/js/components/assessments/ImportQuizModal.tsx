import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
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
    Download,
    AlertCircle,
    Loader2,
    X,
    CheckCircle2,
} from 'lucide-react';

interface Answer {
    answer_text: string;
    is_correct: boolean;
}

interface Question {
    question_text: string;
    explanation: string;
    point: number;
    answers: Answer[];
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (questions: Question[]) => void;
}

interface ParsedRow {
    no: string;
    question: string;
    optA: string;
    optB: string;
    optC: string;
    optD: string;
    answerKey: string;
    explanation: string;
    isValid: boolean;
    errors: string[];
}

export default function ImportQuizModal({ open, onOpenChange, onImport }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [isParsing, setIsParsing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleOpenChange = (val: boolean) => {
        if (!val) {
            setFile(null);
            setParsedData([]);
            setParseError(null);
        }
        onOpenChange(val);
    };

    const parseFile = async (f: File) => {
        setIsParsing(true);
        setParseError(null);

        try {
            const buffer = await f.arrayBuffer();
            const wb = XLSX.read(buffer, { type: 'array' });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            
            // Read as array of arrays
            const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
            
            if (rows.length <= 1) {
                throw new Error('File kosong atau hanya berisi header.');
            }

            const parsed: ParsedRow[] = [];
            
            // Skip header row (index 0)
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                // Skip completely empty rows
                if (!row || row.length === 0 || row.every((cell: any) => cell === undefined || cell === null || String(cell).trim() === '')) {
                    continue;
                }

                const no = String(row[0] || '').trim();
                const question = String(row[1] || '').trim();
                const optA = String(row[2] || '').trim();
                const optB = String(row[3] || '').trim();
                const optC = String(row[4] || '').trim();
                const optD = String(row[5] || '').trim();
                const answerKey = String(row[6] || '').trim().toUpperCase();
                const explanation = String(row[7] || '').trim();

                const errors: string[] = [];

                if (!question) errors.push('Pertanyaan kosong');
                if (!optA) errors.push('Pilihan A kosong');
                if (!optB) errors.push('Pilihan B kosong');
                if (!optC) errors.push('Pilihan C kosong');
                if (!optD) errors.push('Pilihan D kosong');
                
                if (!['A', 'B', 'C', 'D'].includes(answerKey)) {
                    errors.push('Kunci Jawaban tidak valid (harus A/B/C/D)');
                }

                parsed.push({
                    no,
                    question,
                    optA,
                    optB,
                    optC,
                    optD,
                    answerKey,
                    explanation,
                    isValid: errors.length === 0,
                    errors
                });
            }

            if (parsed.length === 0) {
                throw new Error('Tidak ada data pertanyaan yang ditemukan.');
            }

            setParsedData(parsed);
            setFile(f);
        } catch (error: any) {
            setParseError(error.message || 'Gagal membaca file. Pastikan format file sesuai dengan template.');
        } finally {
            setIsParsing(false);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) parseFile(f);
    }, []);

    const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) parseFile(f);
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['No', 'Pertanyaan Kuis', 'Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D', 'Kunci Jawaban (A/B/C/D)', 'Pembahasan (Opsional)'],
            [1, 'Apa ibukota negara Indonesia?', 'Bandung', 'Jakarta', 'Surabaya', 'Medan', 'B', 'Jakarta ditetapkan sebagai ibukota negara Indonesia.'],
            [2, 'Berapa hasil dari 5 + 5?', '10', '15', '20', '5', 'A', 'Penjumlahan 5 + 5 menghasilkan 10.']
        ]);
        
        // Auto-size columns slightly
        const wscols = [
            {wch: 5},
            {wch: 40},
            {wch: 15},
            {wch: 15},
            {wch: 15},
            {wch: 15},
            {wch: 25},
            {wch: 40},
        ];
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Kuis");
        XLSX.writeFile(wb, "Template_Import_Kuis.xlsx");
    };

    const handleConfirmImport = () => {
        const validRows = parsedData.filter(r => r.isValid);
        
        const questions: Question[] = validRows.map(row => {
            const answers: Answer[] = [
                { answer_text: row.optA, is_correct: row.answerKey === 'A' },
                { answer_text: row.optB, is_correct: row.answerKey === 'B' },
                { answer_text: row.optC, is_correct: row.answerKey === 'C' },
                { answer_text: row.optD, is_correct: row.answerKey === 'D' },
            ];

            return {
                question_text: row.question,
                explanation: row.explanation,
                point: 10, // Default poin
                answers
            };
        });

        onImport(questions);
        handleOpenChange(false);
    };

    const validCount = parsedData.filter(r => r.isValid).length;
    const invalidCount = parsedData.length - validCount;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5" />
                        Import Pertanyaan dari Excel / CSV
                    </DialogTitle>
                    <DialogDescription>
                        Tambahkan banyak pertanyaan sekaligus menggunakan file template.
                    </DialogDescription>
                </DialogHeader>

                {!file ? (
                    <div className="space-y-4 py-4">
                        <div
                            onClick={() => inputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={onDrop}
                            className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                                isDragging ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/20' : 'border-muted-foreground/30 hover:border-sky-500/50 hover:bg-muted/30'
                            }`}
                        >
                            {isParsing ? (
                                <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
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
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {parseError}
                            </div>
                        )}

                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                            <div>
                                <p className="text-sm font-medium">Download Template</p>
                                <p className="text-xs text-muted-foreground">Gunakan template ini untuk memastikan format data benar</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="w-4 h-4 mr-2" />
                                Template.xlsx
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col min-h-0 overflow-hidden space-y-4 pt-4">
                        <div className="flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="font-medium">Hasil Pembacaan:</span>
                                <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200">
                                    {parsedData.length} baris total
                                </Badge>
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">
                                    {validCount} valid
                                </Badge>
                                {invalidCount > 0 && (
                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200">
                                        {invalidCount} error
                                    </Badge>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                                <Upload className="w-4 h-4 mr-2" />
                                Pilih File Lain
                            </Button>
                        </div>

                        <div className="rounded-lg border overflow-y-auto flex-1 max-h-[50vh]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur-sm z-10">
                                    <TableRow>
                                        <TableHead className="w-12">No</TableHead>
                                        <TableHead className="w-[30%]">Pertanyaan</TableHead>
                                        <TableHead>Pilihan</TableHead>
                                        <TableHead className="w-20 text-center">Jawaban</TableHead>
                                        <TableHead className="w-[20%]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.map((row, i) => (
                                        <TableRow key={i} className={!row.isValid ? 'bg-red-50/50 dark:bg-red-950/20' : ''}>
                                            <TableCell className="text-muted-foreground">{row.no || (i+1)}</TableCell>
                                            <TableCell>
                                                <div className="line-clamp-2 text-sm" title={row.question}>
                                                    {row.question || <span className="text-red-500 italic">Kosong</span>}
                                                </div>
                                                {row.explanation && (
                                                    <div className="mt-1 text-xs text-muted-foreground line-clamp-1" title={row.explanation}>
                                                        <span className="font-medium">Penjelasan:</span> {row.explanation}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                                    <div className="truncate"><span className="font-medium mr-1 text-muted-foreground">A</span>{row.optA}</div>
                                                    <div className="truncate"><span className="font-medium mr-1 text-muted-foreground">B</span>{row.optB}</div>
                                                    <div className="truncate"><span className="font-medium mr-1 text-muted-foreground">C</span>{row.optC}</div>
                                                    <div className="truncate"><span className="font-medium mr-1 text-muted-foreground">D</span>{row.optD}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold">
                                                {row.answerKey}
                                            </TableCell>
                                            <TableCell>
                                                {row.isValid ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Valid</Badge>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 w-fit">Error</Badge>
                                                        <span className="text-xs text-red-600 leading-tight">
                                                            {row.errors.join(', ')}
                                                        </span>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {invalidCount > 0 && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">Terdapat {invalidCount} baris bermasalah.</p>
                                    <p className="text-red-500 text-xs mt-0.5">Baris yang bermasalah tidak akan di-import. Anda bisa memperbaiki file Excel dan mengupload ulang, atau lanjutkan import hanya untuk {validCount} baris yang valid.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between pt-2 shrink-0">
                            <Button variant="outline" onClick={() => handleOpenChange(false)}>
                                <X className="w-4 h-4 mr-2" /> Batal
                            </Button>
                            <Button onClick={handleConfirmImport} disabled={validCount === 0} className="bg-sky-600 hover:bg-sky-700 text-white">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> 
                                Import {validCount} Pertanyaan
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

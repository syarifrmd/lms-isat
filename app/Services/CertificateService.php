<?php

namespace App\Services;

use Fpdf\Fpdf; // Pastikan Anda menggunakan wrapper atau FPDF native
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\ImagickImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http; // Tambahkan ini
use Illuminate\Support\Str;

class CertificateService
{
    protected $pdf;

    public function __construct()
    {
        // Inisialisasi FPDF (Landscape, mm, A4)
        $this->pdf = new \FPDF('L', 'mm', 'A4');
    }

    public function generate($user, $course, $verificationUrl)
    {
        $this->pdf->AddPage();

        // 1. Ambil Template
        // Pastikan Anda menaruh file gambar template di folder public
        $templatePath = public_path('assets/certificate-template.jpg');
        
        if (file_exists($templatePath)) {
            // x=0, y=0, w=297, h=210 (Ukuran A4 Landscape full)
            $this->pdf->Image($templatePath, 0, 0, 297, 210);
        }

        // 2. Generate QR Code (Berisi Nama, Course, & Digital Signature)
        // Digital Signature sederhana menggunakan Hashing (untuk validasi keaslian)
        $signature = hash_hmac('sha256', $user->id . '-' . $course->id . '-' . $user->email, config('app.key'));
        
        $qrContent = "Nama: " . $user->name . "\n" .
                     "Course: " . $course->title . "\n" .
                     "Digital Signature: " . substr($signature, 0, 16) . "\n" . // Ambil 16 karakter awal saja agar QR tidak terlalu padat
                     "Verifikasi: " . $verificationUrl;

        $qrTempFile = $this->generateQrImage($qrContent);

        // 3. Tempel Teks & QR
        
        // --- Konfigurasi Font ---
        // Warna Custom #025464 (R:2, G:84, B:100)
        $this->pdf->SetTextColor(2, 84, 100); 

        // Nama Peserta
        $this->pdf->SetFont('Arial', 'B', 32);
        $this->pdf->SetXY(67, 105); // Atur posisi Y sesuai template
        $this->pdf->Cell(297, 10, strtoupper($user->name), 0, 1, 'L');

        // Nama Course
        $this->pdf->SetFont('Arial', 'B', 22);
        $this->pdf->SetXY(67, 140);
        $this->pdf->Cell(297, 10, $course->title, 0, 1, 'L');

        // Tanggal Selesai
        $this->pdf->SetFont('Arial', 'I', 12);
        $this->pdf->SetXY(67, 150);
        $this->pdf->Cell(297, 10, 'Diselesaikan pada: ' . date('d F Y'), 0, 1, 'L');

        // --- Tempel QR Code ---
        // Posisi QR (misal di pojok kanan bawah)
        // Image(file, x, y, w, h)
        if ($qrTempFile) {
            $this->pdf->Image($qrTempFile, 77, 160, 23, 23);
            unlink($qrTempFile); // Hapus file temp setelah ditempel
        }

        // 4. Output PDF (Stream ke browser)
        return $this->pdf->Output('S', 'Sertifikat-'.Str::slug($course->title).'.pdf'); 
        // 'S' mengembalikan string content file, 'D' untuk download langsung, 'I' untuk preview browser
    }
            
    private function generateQrImage($content)
    {
        try {
            // Setup Renderer Bacon (400px size)
            $renderer = new ImageRenderer(
                new RendererStyle(400),
                new ImagickImageBackEnd()
            );
            $writer = new Writer($renderer);

            // Tulis QR ke file temporary
            $tempFile = sys_get_temp_dir() . '/qr_' . uniqid() . '.png';
            $writer->writeFile($content, $tempFile);

            return $tempFile;
        } catch (\Exception $e) {
            // Fallback: Jika Imagick error/tidak ada, gunakan API Online untuk generate QR
            try {
                $tempFile = sys_get_temp_dir() . '/qr_online_' . uniqid() . '.png';
                // Menggunakan layanan qrserver.com
                $response = Http::get('https://api.qrserver.com/v1/create-qr-code/', [
                    'size' => '400x400',
                    'data' => $content
                ]);
                
                if ($response->successful()) {
                    file_put_contents($tempFile, $response->body());
                    return $tempFile;
                }
            } catch (\Exception $ex) {
                // Silent fail
            }
            return null;
        }
    }
}
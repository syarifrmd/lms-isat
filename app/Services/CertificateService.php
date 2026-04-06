<?php

namespace App\Services;

use Fpdf\Fpdf; // Pastikan Anda menggunakan wrapper atau FPDF native
use BaconQrCode\Renderer\GDLibRenderer;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Http; // Tambahkan ini
use Illuminate\Support\Str;
use App\Models\CertificateTemplate;

class CertificateService
{
    protected $pdf;

    public function __construct()
    {
        // Inisialisasi FPDF (Landscape, mm, A4)
        $this->pdf = new \FPDF('L', 'mm', 'A4');
        // Sertifikat harus selalu single page dan full-bleed.
        $this->pdf->SetAutoPageBreak(false);
        $this->pdf->SetMargins(0, 0, 0);
    }

    public function generate($user, $course, $verificationUrl)
    {
        $this->pdf->AddPage();

        // 1. Ambil Active Template
        $template = CertificateTemplate::where('is_active', true)->first();
        
        if (!$template) {
            throw new \Exception('Tidak ada desain sertifikat yang aktif. Admin harus mengatur terlebih dahulu.');
        }

        // Gunakan background image dari template
        $templatePath = storage_path('app/public/' . $template->background_image_path);
        
        if (file_exists($templatePath)) {
            // x=0, y=0, w=297, h=210 (Ukuran A4 Landscape full)
            $this->pdf->Image($templatePath, 0, 0, 297, 210);
        }

        // 2. Generate QR Code
        $signature = hash_hmac('sha256', $user->id . '-' . $course->id . '-' . $user->email, config('app.key'));
        
        $qrContent = "Nama: " . $user->name . "\n" .
                     "Course: " . $course->title . "\n" .
                     "Digital Signature: " . substr($signature, 0, 16) . "\n" .
                     "Verifikasi: " . $verificationUrl;

        $qrTempFile = $this->generateQrImage($qrContent);

        // 3. Parse Layout Data dari Template
        $layoutData = $template->layout_data ?? ['elements' => []];
        $elements = $layoutData['elements'] ?? [];
        
        // 4. Ambil canvas dimensions dari template.
        // Fallback untuk template lama: hitung dari rasio gambar seperti di editor (width tetap 800px).
        $canvasWidth = 800;
        if (isset($layoutData['canvasWidth']) && (int) $layoutData['canvasWidth'] > 0) {
            $canvasWidth = (int) $layoutData['canvasWidth'];
        }

        $canvasHeight = 566;
        if (isset($layoutData['canvasHeight']) && (int) $layoutData['canvasHeight'] > 0) {
            $canvasHeight = (int) $layoutData['canvasHeight'];
        } elseif (file_exists($templatePath)) {
            $imageSize = @getimagesize($templatePath);
            if ($imageSize && isset($imageSize[0], $imageSize[1]) && (int) $imageSize[0] > 0) {
                $aspectRatio = $imageSize[0] / $imageSize[1];
                if ($aspectRatio > 0) {
                    $canvasHeight = (int) round($canvasWidth / $aspectRatio);
                }
            }
        }

        $pdfWidth = 297;      // mm (A4 Landscape)
        $pdfHeight = 210;     // mm (A4 Landscape)
        
        // Hitung scaling factor berdasarkan canvas dimensions yang tersimpan
        $scaleX = $pdfWidth / $canvasWidth;
        $scaleY = $pdfHeight / $canvasHeight;
        
        // 5. Render setiap elemen berdasarkan konfigurasi layout
        // 5. Render setiap elemen berdasarkan konfigurasi layout
        foreach ($elements as $element) {
            // Konversi pixel canvas ke mm PDF dengan scaling yang benar
            $x = $element['x'] * $scaleX;
            $y = $element['y'] * $scaleY;
            $width = ($element['width'] ?? 50) * $scaleX;
            $height = ($element['height'] ?? 20) * $scaleY;

            if ($element['type'] === 'text') {
                // Tentukan nilai text berdasarkan ID elemen
                $textValue = $this->getElementValue($element, $user, $course);
                
                // Set warna teks
                $color = $element['color'] ?? '#000000';
                $rgb = $this->hexToRgb($color);
                $this->pdf->SetTextColor($rgb['r'], $rgb['g'], $rgb['b']);

                // Set font size dalam point agar konsisten dengan ukuran visual editor.
                $baseFontSizePx = isset($element['fontSize']) ? (float) $element['fontSize'] : 16.0;
                $fontSizePt = $baseFontSizePx * $scaleY * (72 / 25.4);
                $this->setTextFont(max(6, $fontSizePt));
                
                // Render 1 baris teks di tengah box agar sama dengan preview editor.
                $lineHeightMm = max(3, (max(6, $fontSizePt) * 0.352778) * 1.2);
                $textY = $y + max(0, (($height - $lineHeightMm) / 2));
                $this->pdf->SetXY($x, $textY);
                $this->pdf->Cell($width, $lineHeightMm, $textValue, 0, 0, 'C');

            } elseif ($element['type'] === 'qrcode' && $qrTempFile) {
                // Render QR Code dengan scaling yang benar
                $this->pdf->Image($qrTempFile, $x, $y, $width, $height);
            }
        }

        // Bersihkan file temporary QR
        if ($qrTempFile && file_exists($qrTempFile)) {
            unlink($qrTempFile);
        }

        // 6. Output PDF
        return $this->pdf->Output('S', 'Sertifikat-'.Str::slug($course->title).'.pdf'); 
    }

    /**
     * Dapatkan nilai text untuk setiap elemen berdasarkan ID
     */
    private function getElementValue(array $element, $user, $course)
    {
        $elementId = $element['id'] ?? '';
        $customValue = trim((string) ($element['value'] ?? ''));

        return match($elementId) {
            'userName' => strtoupper($user->name),
            'courseTitle' => $course->title,
            'completionDate' => 'Diselesaikan pada: ' . date('d F Y'),
            'customMessage' => $customValue !== '' ? $customValue : 'Dengan hormat diberikan kepada',
            default => $customValue,
        };
    }

    /**
     * Set font to Roboto Serif when available, fallback to Times.
     */
    private function setTextFont(float $fontSizePt): void
    {
        // Gunakan font default serif bawaan FPDF.
        $this->pdf->SetFont('Times', '', $fontSizePt);
    }

    /**
     * Convert HEX color ke RGB array
     */
    private function hexToRgb($hex)
    {
        $hex = str_replace('#', '', $hex);
        
        if (strlen($hex) === 6) {
            return [
                'r' => hexdec(substr($hex, 0, 2)),
                'g' => hexdec(substr($hex, 2, 2)),
                'b' => hexdec(substr($hex, 4, 2)),
            ];
        }
        
        return ['r' => 0, 'g' => 0, 'b' => 0];
    }
            
    private function generateQrImage($content)
    {
        try {
            // Generate PNG 8-bit via GD backend so it is compatible with FPDF image handling.
            $writer = new Writer(new GDLibRenderer(300));
            $qrPng = $writer->writeString($content);

            $tempFile = storage_path('app/public/qr_' . Str::random(10) . '.png');
            file_put_contents($tempFile, $qrPng);

            // Ubah area putih QR menjadi transparan agar blend dengan background sertifikat.
            $this->makePngBackgroundTransparent($tempFile);

            return $tempFile;
        } catch (\Exception $e) {
            // Fallback: Jika Imagick error/tidak ada, gunakan API Online untuk generate QR
            try {
                $tempFile = storage_path('app/public/qr_online_' . Str::random(10) . '.png');
                // Menggunakan layanan qrserver.com
                $response = Http::get('https://api.qrserver.com/v1/create-qr-code/', [
                    'size' => '400x400',
                    'data' => $content
                ]);
                
                if ($response->successful()) {
                    file_put_contents($tempFile, $response->body());
                    $this->makePngBackgroundTransparent($tempFile);
                    return $tempFile;
                }
            } catch (\Exception $ex) {
                // Silent fail
            }
            return null;
        }
    }

    /**
     * Make near-white pixels transparent in a PNG file.
     */
    private function makePngBackgroundTransparent(string $filePath): void
    {
        if (!extension_loaded('gd') || !file_exists($filePath)) {
            return;
        }

        $img = @imagecreatefrompng($filePath);
        if (!$img) {
            return;
        }

        imagealphablending($img, false);
        imagesavealpha($img, true);

        $width = imagesx($img);
        $height = imagesy($img);

        // Transparent color for white-ish background.
        $transparent = imagecolorallocatealpha($img, 255, 255, 255, 127);

        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                $index = imagecolorat($img, $x, $y);
                $rgba = imagecolorsforindex($img, $index);

                if ($rgba['red'] >= 245 && $rgba['green'] >= 245 && $rgba['blue'] >= 245) {
                    imagesetpixel($img, $x, $y, $transparent);
                }
            }
        }

        imagepng($img, $filePath);
        imagedestroy($img);
    }
}
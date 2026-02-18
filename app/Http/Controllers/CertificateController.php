<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Services\CertificateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CertificateController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        $completedCourses = Enrollment::where('user_id', $user->id)
            ->whereNotNull('completed_at') // Atau where('status', 'completed')
            ->with('course')
            ->get()
            ->map(function ($enrollment) {
                return $enrollment->course;
            });

        return Inertia::render('certificates/certificates', [
            'courses' => $completedCourses
        ]);
    }

    public function download(Request $request, $courseId, CertificateService $certificateService)
    {
        $user = Auth::user();
        
        // Logika untuk mengambil data Course (Sesuaikan dengan model Anda)
        $course = Course::findOrFail($courseId);

        // TODO: Tambahkan validasi apakah user sudah menyelesaikan course ini
        // if (!$user->hasCompleted($course)) { abort(403); }

        // URL yang akan muncul saat QR discan (misalnya halaman verifikasi keaslian)
        $verificationUrl = route('dashboard', ['cert_id' => $courseId . '-' . $user->id]); 

        // Generate PDF Content
        $pdfContent = $certificateService->generate($user, $course, $verificationUrl);

        // Return response stream agar browser mendeteksi ini file PDF
        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="Sertifikat-'.$user->name.'.pdf"',
        ]);
    }
}
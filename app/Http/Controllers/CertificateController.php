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

    public function show(Request $request, $courseId, CertificateService $certificateService)
    {
        $user = Auth::user();
        $course = Course::findOrFail($courseId);

        $verificationUrl = route('dashboard', ['cert_id' => $courseId . '-' . $user->id]);
        $pdfContent = $certificateService->generate($user, $course, $verificationUrl);

        // Inline: tampilkan di browser (iframe/tab baru)
        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="Sertifikat-' . $user->name . '.pdf"',
        ]);
    }

    public function download(Request $request, $courseId, CertificateService $certificateService)
    {
        $user = Auth::user();
        
        $course = Course::findOrFail($courseId);

        $verificationUrl = route('dashboard', ['cert_id' => $courseId . '-' . $user->id]); 

        $pdfContent = $certificateService->generate($user, $course, $verificationUrl);

        // Attachment: force download
        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="Sertifikat-' . $user->name . '.pdf"',
        ]);
    }
}
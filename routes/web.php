<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\AssessmentsController;
use App\Http\Controllers\QuizController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\ModuleProgressController;
use App\Http\Controllers\SocialLoginController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\CourseRatingController;
use App\Http\Controllers\LeaderboardController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// --- GOOGLE LOGIN & REGISTER FLOW (BARU) ---
Route::controller(SocialLoginController::class)->group(function () {
    // 1. Tombol Login Google
    Route::get('/login/google', 'redirectToGoogle')->name('login.google');
    
    // 2. Callback dari Google
    Route::get('/login/google/callback', 'handleGoogleCallback')->name('login.google.callback');

     // 3. (BARU) Route untuk Link dari Email
    Route::get('/register/verify-email-entry', 'verifyEmailLink')->name('register.verify-email-entry');

    // 3a. Halaman Check Inbox (Dedicated Route)
    Route::get('/register/check-inbox', 'showCheckInbox')->name('register.check-inbox');

    // 3b. Kirim Ulang Link Verifikasi
    Route::post('/register/resend-verification', 'resendVerificationLink')->name('register.resend-verification');

    // 4. Form Input NIK
    Route::get('/register/verify-nik', 'showVerifyNikForm')->name('register.verify-nik');
    
    // 5. Submit NIK
    Route::post('/register/verify-nik', 'verifyNik')->name('register.verify-nik.submit');
});


// Trainer Only Routes - Course Create (Must be before /courses/{id})
Route::middleware(['auth', 'verified', 'role:trainer'])->group(function () {
    Route::get('/courses/create', [CourseController::class, 'create'])->name('courses.create');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::get('/courses/{course}/edit', [CourseController::class, 'edit'])->name('courses.edit');
    Route::put('/courses/{course}', [CourseController::class, 'update'])->name('courses.update');
    Route::post('/courses/{course}/reorder-modules', [CourseController::class, 'reorderModules'])->name('courses.reorder-modules');
    Route::delete('/courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Leaderboard
    Route::get('/leaderboard', [LeaderboardController::class, 'index'])->name('leaderboard.index');
    
    // Courses (All authenticated users can view)
    Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('/courses/{id}', [CourseController::class, 'show'])->name('courses.show');
    
    // Enrollment (Users can enroll/unenroll from courses)
    Route::post('/courses/{id}/enroll', [EnrollmentController::class, 'store'])->name('courses.enroll');
    Route::delete('/courses/{id}/unenroll', [EnrollmentController::class, 'destroy'])->name('courses.unenroll');
    
    // Google Auth
    Route::get('/auth/google', [GoogleAuthController::class, 'redirectToGoogle'])->name('auth.google');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback']);
    Route::post('/auth/google/disconnect', [GoogleAuthController::class, 'disconnect'])->name('auth.google.disconnect');

    // Quiz (User can take quiz and view results)
    Route::get('/quiz/{quiz}', [QuizController::class, 'show'])->name('quiz.show');
    Route::post('/quiz/{quiz}/submit', [QuizController::class, 'submit'])->name('quiz.submit');
    Route::get('/quiz-result/{attempt}', [QuizController::class, 'result'])->name('quiz.result');

    // Module Progress
    Route::post('/modules/{module}/progress/text', [ModuleProgressController::class, 'markTextRead'])->name('modules.progress.text');
    Route::post('/modules/{module}/progress/video', [ModuleProgressController::class, 'markVideoWatched'])->name('modules.progress.video');

    // Certificates
    Route::get('/certificates', [CertificateController::class, 'index'])->name('certificates.index');
    Route::get('/certificate/{courseId}', [CertificateController::class, 'download'])->name('certificate.download');

    // Course Ratings
    Route::post('/courses/{course}/ratings', [CourseRatingController::class, 'store'])->name('courses.ratings.store');
    Route::delete('/courses/{course}/ratings', [CourseRatingController::class, 'destroy'])->name('courses.ratings.destroy');
});

// Trainer Only Routes - Modules & Assessments
Route::middleware(['auth', 'verified', 'role:trainer'])->group(function () {
    // Module Management
    Route::get('/courses/{course}/modules/create', [ModuleController::class, 'create'])->name('modules.create');
    Route::post('/courses/{course}/modules', [ModuleController::class, 'store'])->name('modules.store');
    Route::get('/courses/{course}/modules/{module}/edit', [ModuleController::class, 'edit'])->name('modules.edit');
    Route::put('/courses/{course}/modules/{module}', [ModuleController::class, 'update'])->name('modules.update');

    // Assessments Management
    Route::prefix('/assessments')->name('assessments.')->group(function () {
        Route::get('/', [AssessmentsController::class, 'index'])->name('index');
        
        // Specific routes first
        Route::whereNumber('course')->group(function () {
            Route::get('/{course}/quizzes/create', [AssessmentsController::class, 'create'])->name('create');
            Route::post('/{course}/quizzes', [AssessmentsController::class, 'store'])->name('store');
            Route::get('/{course}/quizzes', [AssessmentsController::class, 'quizzes'])->name('quizzes');
        });
            
        Route::get('/quiz/{quiz}/edit', [AssessmentsController::class, 'edit'])->name('edit');
        Route::put('/quiz/{quiz}', [AssessmentsController::class, 'update'])->name('update');
        Route::delete('/quiz/{quiz}', [AssessmentsController::class, 'destroy'])->name('destroy');
        Route::post('/upload-image', [AssessmentsController::class, 'uploadImage'])->name('upload-image');
    });
});

// Admin Only Routes - User Management
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
    Route::post('/users', [UserManagementController::class, 'store'])->name('users.store');
    Route::put('/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{user}/verify', [UserManagementController::class, 'verify'])->name('users.verify');
    Route::post('/users/{user}/toggle-status', [UserManagementController::class, 'toggleStatus'])->name('users.toggle-status');
});

require __DIR__.'/settings.php';

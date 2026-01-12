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

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Trainer Only Routes - Course Create (Must be before /courses/{id})
Route::middleware(['auth', 'verified', 'role:trainer'])->group(function () {
    Route::get('/courses/create', [CourseController::class, 'create'])->name('courses.create');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::delete('/courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Courses (All authenticated users can view)
    Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
    Route::get('/courses/{id}', [CourseController::class, 'show'])->name('courses.show');
    
    // Enrollment (Users can enroll/unenroll from courses)
    Route::post('/courses/{id}/enroll', [EnrollmentController::class, 'store'])->name('courses.enroll');
    Route::delete('/courses/{id}/unenroll', [EnrollmentController::class, 'destroy'])->name('courses.unenroll');
    
    // Google Auth
    Route::get('/auth/google', [GoogleAuthController::class, 'redirectToGoogle'])->name('auth.google');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback']);

    // Quiz (User can take quiz and view results)
    Route::get('/quiz/{quiz}', [QuizController::class, 'show'])->name('quiz.show');
    Route::post('/quiz/{quiz}/submit', [QuizController::class, 'submit'])->name('quiz.submit');
    Route::get('/quiz-result/{attempt}', [QuizController::class, 'result'])->name('quiz.result');

    // Module Progress
    Route::post('/modules/{module}/progress/text', [ModuleProgressController::class, 'markTextRead'])->name('modules.progress.text');
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
    });
});

require __DIR__.'/settings.php';

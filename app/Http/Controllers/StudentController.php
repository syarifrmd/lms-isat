<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\JourneyDivision;
use App\Models\Module;
use App\Models\ModuleProgress;
use App\Models\User;
use App\Models\UserQuizAttempt;
use App\Services\ModuleProgressService;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function __construct(private readonly ModuleProgressService $progressService)
    {
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        // Divisi DSE tidak diperbolehkan mengakses halaman My Progress / Summary ini.
        $this->denyIfRestrictedDivision($user);

        $scopeField = $this->groupFieldForDivision($user->division ?? '');
        $scopeLabel = $this->scopeLabelForDivision($user->division ?? '');
        $scopeValue = $user->{$scopeField} ?? '-';

        // ---- My Team (1 card per course yang punya journey, breakdown per divisi ke bawah) ----
        $myTeam = $this->buildMyTeam($user);

        // ---- My Activity (own mandatory journey progress) ----
        $myActivity = $this->buildMyActivity($user);

        $visibleDivisions = $user->role === 'admin'
            ? ['HOC', 'HOR', 'HOS', 'BSM', 'CSE', 'RSE', 'DSE']
            : $this->visibleDivisionsFor($user->division ?? '');

        return Inertia::render('students/index', [
            'scope_label'    => $scopeLabel,
            'scope_value'    => $scopeValue,
            'status_date'    => now()->translatedFormat('d F Y'),
            'division_count' => count($visibleDivisions),
            'course_count'   => count($myTeam['courses']),
            'my_team'        => $myTeam,
            'my_activity'    => $myActivity,
        ]);
    }

    /**
     * JSON: detail modul untuk 1 course di My Activity milik user yang login.
     */
    public function myActivityDetail($courseId)
    {
        $user = Auth::user();
        $course = Course::findOrFail($courseId);

        $modules = Module::where('course_id', $courseId)
            ->with('quizzes')
            ->orderBy('order_sequence', 'asc')
            ->get();

        $enrollment = Enrollment::where('user_id', $user->id)
            ->where('course_id', $courseId)
            ->first();

        return response()->json([
            'course'              => $course->only('id', 'title'),
            'status'              => $enrollment?->status,
            'progress_percentage' => (float) ($enrollment?->progress_percentage ?? 0),
            'modules_progress'    => $this->buildModulesProgress($modules, $enrollment),
        ]);
    }

    /**
     * JSON: profil ringkas + detail modul untuk 1 enrollment (dipakai tombol "Lihat Profil").
     */
    public function profile($enrollmentId)
    {
        $enrollment = Enrollment::with('user', 'course')->findOrFail($enrollmentId);
        $user = Auth::user();

        if ($user->role !== 'admin') {
            $peerUsersQuery = User::query();
            $this->applyPeerScope($peerUsersQuery, $user);
            $allowed = (clone $peerUsersQuery)->where('id', $enrollment->user_id)->exists();

            if (!$allowed) {
                abort(403, 'Unauthorized access to this profile.');
            }
        }

        $modules = Module::where('course_id', $enrollment->course_id)
            ->with('quizzes')
            ->orderBy('order_sequence', 'asc')
            ->get();

        $allAttempts = UserQuizAttempt::withTrashed()
            ->where('user_id', $enrollment->user_id)
            ->where('course_id', $enrollment->course_id)
            ->get();

        return response()->json([
            'user' => [
                'name'          => $enrollment->user?->name ?? '-',
                'email'         => $enrollment->user?->email ?? '-',
                'employee_id'   => $enrollment->user_id,
                'division'      => $enrollment->user?->division ?? '-',
                'branch'        => $enrollment->user?->branch ?? '-',
                'micro_cluster' => $enrollment->user?->micro_cluster ?? '-',
            ],
            'course'              => $enrollment->course?->only('id', 'title'),
            'progress_percentage' => (float) ($enrollment->progress_percentage ?? 0),
            'status'              => $enrollment->status,
            'score_failed_count'  => $allAttempts->where('is_passed', false)->where('is_time_up', false)->count(),
            'time_failed_count'   => $allAttempts->where('is_time_up', true)->count(),
            'modules_progress'    => $this->buildModulesProgress($modules, $enrollment),
        ]);
    }

    public function show($courseId, Request $request)
    {
        $course = Course::findOrFail($courseId);
        $user = Auth::user();

        // Divisi DSE tidak diperbolehkan mengakses detail peserta (bagian dari My Progress).
        $this->denyIfRestrictedDivision($user);

        $visibleDivisions = $this->visibleDivisionsFor($user->division ?? '');

        if ($user->role !== 'admin') {
            $hasAccess = Course::leftJoin('course_division', 'courses.id', '=', 'course_division.course_id')
                ->where('courses.id', $courseId)
                ->where(function ($q) use ($user, $visibleDivisions) {
                    $q->where('courses.created_by', $user->id)
                      ->orWhere(function ($q2) use ($user, $visibleDivisions) {
                          if ($user->role === 'trainer') {
                              $q2->where('courses.status', 'published')
                                 ->where(function ($q3) use ($visibleDivisions) {
                                     $q3->whereIn('course_division.target_division', $visibleDivisions)
                                        ->orWhereNull('course_division.target_division');
                                 });
                          } else {
                              $q2->where('courses.status', 'published')
                                 ->whereIn('course_division.target_division', $visibleDivisions);
                          }
                      });
                })
                ->exists();

            if (!$hasAccess) {
                abort(403, 'Unauthorized access to this course\'s students.');
            }
        }

        // Load modules with quizzes for this course
        $modules = Module::where('course_id', $courseId)
            ->with('quizzes')
            ->orderBy('order_sequence', 'asc')
            ->get();

        $enrollmentsQuery = Enrollment::where('course_id', $courseId)
            ->with('user:id,name,username,email,avatar,division,region,area,branch,micro_cluster,circle,brand')
            ->orderBy('enrollment_at', 'desc');

        // Peserta yang tampil di sini mengikuti scope circle/region/area/branch/micro_cluster + brand
        // sesuai level division viewer (lihat applyPeerScope()), bukan lagi hierarki division saja.
        if ($user->role !== 'admin') {
            $enrollmentsQuery->whereHas('user', function ($q) use ($user) {
                $this->applyPeerScope($q, $user);
            });
        }

        // Filter opsional per-divisi (dari klik tile divisi tertentu di card My Team, mis. ?division=BSM),
        // supaya klik tile BSM cuma nampilin peserta BSM, bukan campur dengan divisi lain di bawahnya.
        $divisionFilter = strtoupper(trim((string) $request->query('division', '')));
        if ($divisionFilter !== '') {
            $enrollmentsQuery->whereHas('user', function ($q) use ($divisionFilter) {
                $q->whereRaw('UPPER(TRIM(division)) = ?', [$divisionFilter]);
            });
        }

        $enrollments = $enrollmentsQuery->get();

        $students = $enrollments->map(function ($enrollment) use ($modules) {
            $allAttempts = UserQuizAttempt::withTrashed()
                ->where('user_id', $enrollment->user_id)
                ->where('course_id', $enrollment->course_id)
                ->get();

            $scoreFailed = $allAttempts->where('is_passed', false)->where('is_time_up', false)->count();
            $timeFailed = $allAttempts->where('is_time_up', true)->count();

            return [
                'enrollment_id'       => $enrollment->id,
                'user_id'             => $enrollment->user_id,
                'name'                => $enrollment->user?->name ?? '-',
                'username'            => $enrollment->user?->username ?? $enrollment->user?->email ?? '-',
                'email'               => $enrollment->user?->email ?? '-',
                'avatar'              => $this->resolveAvatarUrl($enrollment->user?->avatar),
                'employee_id'         => $enrollment->user_id,
                'division'            => $enrollment->user?->division ?? '-',
                'location'            => $enrollment->user?->micro_cluster
                    ?? $enrollment->user?->branch
                    ?? $enrollment->user?->area
                    ?? $enrollment->user?->region
                    ?? $enrollment->user?->circle
                    ?? '-',
                'status'              => $enrollment->status,
                'progress_percentage' => (float) ($enrollment->progress_percentage ?? 0),
                'enrollment_at'       => $enrollment->enrollment_at?->format('d M Y'),
                'completed_at'        => $enrollment->completed_at?->format('d M Y'),
                'modules_progress'    => $this->buildModulesProgress($modules, $enrollment),
                'score_failed_count'  => $scoreFailed,
                'time_failed_count'   => $timeFailed,
            ];
        })->values();

        $totalEnrollments = $students->count();
        $totalCompleted = $students->filter(fn($s) => !is_null($s['completed_at']))->count();

        return Inertia::render('students/show', [
            'course'             => $course->only('id', 'title', 'description', 'category', 'status'),
            'students'           => $students,
            'total_enrollments'  => $totalEnrollments,
            'total_completed'    => $totalCompleted,
            'scope_label'        => $this->scopeLabelForDivision($user->division ?? ''),
            'scope_value'        => $user->{$this->groupFieldForDivision($user->division ?? '')} ?? '-',
            'division_filter'    => $divisionFilter !== '' ? $divisionFilter : null,
        ]);
    }

    /**
     * Bangun array modules_progress untuk 1 course terhadap 1 enrollment (nullable).
     * Dipakai bersama oleh show(), profile(), dan myActivityDetail() supaya tidak duplikat logic.
     */
    private function buildModulesProgress($modules, ?Enrollment $enrollment): array
    {
        if (!$enrollment) {
            return $modules->map(function ($module) {
                return [
                    'module_id'        => $module->id,
                    'module_title'     => $module->title,
                    'order_sequence'   => $module->order_sequence,
                    'has_video'        => !empty($module->video_url),
                    'has_text'         => !empty(trim(strip_tags($module->content_text ?? ''))),
                    'has_document'     => !empty($module->doc_url),
                    'is_video_watched' => false,
                    'is_text_read'     => false,
                    'is_document_read' => false,
                    'is_completed'     => false,
                    'quizzes'          => $module->quizzes->map(fn($quiz) => [
                        'quiz_id'            => $quiz->id,
                        'quiz_title'         => $quiz->title,
                        'passing_score'      => (float) ($quiz->passing_score ?? $quiz->min_score ?? 0),
                        'attempts_count'     => 0,
                        'is_passed'          => false,
                        'highest_score'      => null,
                        'last_attempt_at'    => null,
                        'failed_score_count' => 0,
                        'failed_time_count'  => 0,
                    ])->values()->toArray(),
                ];
            })->values()->toArray();
        }

        $allAttempts = UserQuizAttempt::withTrashed()
            ->where('user_id', $enrollment->user_id)
            ->where('course_id', $enrollment->course_id)
            ->get();

        return $modules->map(function ($module) use ($enrollment, $allAttempts) {
            $progresses = ModuleProgress::where('enrollment_id', $enrollment->id)
                ->where('module_id', $module->id)
                ->get();

            $moduleState = $this->progressService->evaluateModule($module, $progresses);

            $quizResults = $module->quizzes->map(function ($quiz) use ($allAttempts) {
                $quizAttempts = $allAttempts->where('quiz_id', $quiz->id);

                $activeAttempts = $quizAttempts->whereNull('deleted_at');
                $highestScore = $activeAttempts->max('score');
                $isPassed = $activeAttempts->contains('is_passed', true);
                $lastAttempt = $activeAttempts->sortByDesc('submitted_at')->first();

                $failedScore = $quizAttempts->where('is_passed', false)->where('is_time_up', false)->count();
                $failedTime = $quizAttempts->where('is_time_up', true)->count();

                return [
                    'quiz_id'            => $quiz->id,
                    'quiz_title'         => $quiz->title,
                    'passing_score'      => (float) ($quiz->passing_score ?? $quiz->min_score ?? 0),
                    'attempts_count'     => $activeAttempts->count(),
                    'is_passed'          => $isPassed,
                    'highest_score'      => $highestScore !== null ? (float) $highestScore : null,
                    'last_attempt_at'    => $lastAttempt?->submitted_at?->format('d M Y H:i'),
                    'failed_score_count' => $failedScore,
                    'failed_time_count'  => $failedTime,
                ];
            })->values()->toArray();

            return [
                'module_id'        => $module->id,
                'module_title'     => $module->title,
                'order_sequence'   => $module->order_sequence,
                'has_video'        => !empty($module->video_url),
                'has_text'         => !empty(trim(strip_tags($module->content_text ?? ''))),
                'has_document'     => !empty($module->doc_url),
                'is_video_watched' => $moduleState['is_video_watched'],
                'is_text_read'     => $moduleState['is_text_read'],
                'is_document_read' => $moduleState['is_document_read'],
                'is_completed'     => $moduleState['is_completed'],
                'quizzes'          => $quizResults,
            ];
        })->values()->toArray();
    }

    /**
     * My Team: 1 card per course (yang punya journey), berisi total user selesai
     * dipecah per divisi mulai dari level viewer ke bawah (HOC->HOR->HOS->BSM->CSE/RSE->DSE).
     * Populasi user yang dihitung mengikuti applyPeerScope() (geo field + brand sama).
     */
    private function buildMyTeam($user): array
    {
        $allDivisions = ['HOC', 'HOR', 'HOS', 'BSM', 'CSE', 'RSE', 'DSE'];

        $visibleDivisions = $user->role === 'admin'
            ? $allDivisions
            : $this->visibleDivisionsFor($user->division ?? '');

        if (empty($visibleDivisions)) {
            return ['courses' => []];
        }

        // Course yang ditargetkan ke salah satu divisi yang bisa dilihat viewer, dan punya journey
        $courseIds = DB::table('course_division')
            ->whereIn('target_division', $visibleDivisions)
            ->pluck('course_id')
            ->unique();

        $courses = Course::whereNotNull('journey_id')
            ->whereIn('id', $courseIds)
            ->orderBy('title')
            ->get();

        if ($courses->isEmpty()) {
            return ['courses' => []];
        }

        // Populasi peer user (geo + brand sama), dibatasi ke divisi yang boleh dilihat viewer.
        // Pakai UPPER(TRIM()) supaya tidak meleset karena beda kapitalisasi/spasi pada kolom division.
        $peerUsersQuery = User::query();
        $this->applyPeerScope($peerUsersQuery, $user);
        $peerUsersQuery->whereIn(DB::raw('UPPER(TRIM(division))'), $visibleDivisions);
        $peerUsers = $peerUsersQuery->get(['id', 'division']);
        $peerUserIds = $peerUsers->pluck('id');
        $divisionByUserId = $peerUsers->keyBy('id');

        // Urutan divisi yang ditampilkan: mulai dari level viewer sendiri ke bawah, tanpa duplikat.
        // Divisi viewer sendiri TIDAK ditampilkan sebagai tile (misal login HOC, tile HOC tidak
        // perlu muncul di card-nya sendiri) — hanya divisi di bawahnya yang relevan untuk dipantau.
        $ownDivision = strtoupper(trim($user->division ?? ''));
        $divisionOrder = collect($visibleDivisions)->unique()->reject(fn($div) => $div === $ownDivision)->values();

        $allEnrollments = Enrollment::whereIn('course_id', $courses->pluck('id'))
            ->whereIn('user_id', $peerUserIds)
            ->get(['id', 'course_id', 'user_id', 'completed_at']);

        // "User active": pakai Cache (bukan tabel `sessions`/kolom DB baru). Middleware
        // UpdateLastSeen menaruh flag "online-user-{id}" ke cache dengan TTL 5 menit di
        // setiap request user yang login. Tidak butuh migration/kolom tambahan, dan tidak
        // bergantung SESSION_DRIVER (yang seringkali bukan 'database' sehingga tabel
        // `sessions` tidak pernah terisi).
        // PENTING: dihitung dari SELURUH populasi peer per divisi (bukan hanya yang enrolled
        // di course tertentu), supaya user yang aktif tapi belum enroll course itu tetap kehitung.
        $onlineCountByDivision = $divisionOrder->mapWithKeys(function ($div) use ($peerUsers) {
            $count = $peerUsers
                ->filter(fn($u) => strtoupper(trim($u->division ?? '')) === $div)
                ->filter(fn($u) => Cache::has('online-user-' . $u->id))
                ->count();

            return [$div => $count];
        });

        $courseCards = $courses->map(function ($course) use ($allEnrollments, $divisionByUserId, $divisionOrder, $onlineCountByDivision) {
            $courseEnrollments = $allEnrollments->where('course_id', $course->id);

            $byDivision = $divisionOrder->map(function ($div) use ($courseEnrollments, $divisionByUserId, $onlineCountByDivision) {
                $inDiv = $courseEnrollments->filter(
                    fn($e) => strtoupper($divisionByUserId->get($e->user_id)?->division ?? '') === $div
                );

                return [
                    'division'  => $div,
                    'total'     => $inDiv->count(),
                    'completed' => $inDiv->whereNotNull('completed_at')->count(),
                    'online'    => $onlineCountByDivision->get($div, 0),
                ];
            });

            return [
                'course_id'       => $course->id,
                'title'           => $course->title,
                'total_users'     => $courseEnrollments->count(),
                'total_completed' => $courseEnrollments->whereNotNull('completed_at')->count(),
                'by_division'     => $byDivision,
            ];
        })->values();

        return ['courses' => $courseCards];
    }

    /**
     * Mandatory journeys milik division user (via journey_divisions.is_mandatory)
     * lalu diambil course-course di dalam journey tersebut, plus status pengerjaan user sendiri.
     */
    private function buildMyActivity($user): array
    {
        $mandatoryJourneyIds = JourneyDivision::where('target_division', $user->division ?? '')
            ->where('is_mandatory', true)
            ->pluck('journey_id');

        $courses = Course::whereIn('journey_id', $mandatoryJourneyIds)
            ->orderBy('title')
            ->get();

        $enrollments = Enrollment::where('user_id', $user->id)
            ->whereIn('course_id', $courses->pluck('id'))
            ->get()
            ->keyBy('course_id');

        $courseList = $courses->map(function ($course) use ($enrollments) {
            /** @var Enrollment|null $enrollment */
            $enrollment = $enrollments->get($course->id);

            $status = 'not_started';
            $progress = 0;

            if ($enrollment) {
                $progress = (float) ($enrollment->progress_percentage ?? 0);
                $status = $enrollment->completed_at ? 'completed' : 'in_progress';
            }

            return [
                'course_id'           => $course->id,
                'title'               => $course->title,
                'status'              => $status,
                'progress_percentage' => $progress,
            ];
        })->values();

        return ['courses' => $courseList];
    }

    /**
     * Divisi DSE tidak boleh mengakses halaman My Progress (index & detail course-nya).
     * Admin & role lain tidak terpengaruh.
     */
    private function denyIfRestrictedDivision($user): void
    {
        if ($user->role === 'admin') {
            return;
        }

        if (strtoupper(trim($user->division ?? '')) === 'DSE') {
            abort(403, 'My Progress tidak tersedia untuk divisi DSE.');
        }
    }

    /**
     * Kolom `users.avatar` di DB cuma nyimpen path relatif (mis. "avatars/xxx.jpg"), hasil
     * dari Storage::disk('public')->put(...). Path mentah itu tidak bisa langsung dipakai
     * sebagai <img src>, jadi perlu diubah dulu jadi URL yang bisa diakses browser.
     *
     * Sengaja pakai Storage::disk('public')->url() (hasilnya URL RELATIF, mis. "/storage/avatars/xxx.jpg")
     * dan BUKAN asset('storage/...'), karena asset() membangun URL absolut memakai host/port dari
     * APP_URL di .env — kalau APP_URL tidak persis sama dengan port yang lagi dipakai browser
     * (mis. Laragon jalan di :8080 tapi APP_URL masih default tanpa port / port lain), hasilnya
     * request ke port yang salah dan gambar jadi broken walau file & symlink-nya sudah benar.
     * URL relatif otomatis ikut origin halaman yang sedang dibuka, jadi aman dari masalah ini.
     */
    private function resolveAvatarUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        // Kalau sudah berupa URL lengkap (http/https), pakai apa adanya.
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url(ltrim($path, '/'));
    }

    /**
     * Field kolom user yang jadi acuan "sama" sesuai level division viewer.
     */
    private function groupFieldForDivision(string $division): string
    {
        return match (strtoupper(trim($division))) {
            'HOC' => 'circle',
            'HOR' => 'region',
            'HOS' => 'area',
            'BSM' => 'branch',
            'CSE', 'RSE', 'DSE' => 'micro_cluster',
            default => 'micro_cluster',
        };
    }

    private function scopeLabelForDivision(string $division): string
    {
        return match (strtoupper(trim($division))) {
            'HOC' => 'Circle',
            'HOR' => 'Region',
            'HOS' => 'Area',
            'BSM' => 'Branch',
            'CSE', 'RSE', 'DSE' => 'Micro Cluster',
            default => 'Micro Cluster',
        };
    }

    /**
     * Terapkan filter "sama geo-field + sama brand" ke query builder atas tabel users.
     * Admin bebas lihat semua. Brand IOH bebas lihat semua brand.
     * Perbandingan dibuat case-insensitive & trim supaya tidak meleset karena beda kapitalisasi/spasi.
     */
    private function applyPeerScope($query, $user): void
    {
        if ($user->role === 'admin') {
            return;
        }

        $field = $this->groupFieldForDivision($user->division ?? '');
        $value = trim((string) ($user->{$field} ?? ''));

        if ($value !== '') {
            $query->whereRaw('LOWER(TRIM(' . $field . ')) = ?', [strtolower($value)]);
        } else {
            // Belum ada data geo -> hanya lihat diri sendiri
            $query->where('id', $user->id);
        }

        $brandValue = trim((string) ($user->brand ?? ''));
        $brandUpper = strtoupper($brandValue);
        if ($brandValue !== '' && $brandUpper !== 'IOH') {
            $query->whereRaw('LOWER(TRIM(brand)) = ?', [strtolower($brandValue)]);
        }
    }

    private function divisionHierarchy(): array
    {
        return [
            ['HOC'],
            ['HOR'],
            ['HOS'],
            ['BSM'],
            ['CSE'],
            ['DSE'],
        ];
    }

    private function visibleDivisionsFor(?string $division): array
    {
        $division = strtoupper(trim((string) $division));
        $hierarchy = $this->divisionHierarchy();

        foreach ($hierarchy as $index => $levelDivisions) {
            if (in_array($division, $levelDivisions, true)) {
                return array_merge(...array_slice($hierarchy, $index));
            }
        }

        return $division !== '' ? [$division] : [];
    }
}
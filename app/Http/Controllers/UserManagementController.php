<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    /**
     * Display a listing of users with filters
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->filled('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        // Registration status filter
        if ($request->filled('status')) {
            if ($request->status === 'registered') {
                $query->where('is_registered', true);
            } elseif ($request->status === 'pending') {
                $query->where('is_registered', false);
            }
        }

        // Region filter
        if ($request->filled('region') && $request->region !== 'all') {
            $query->where('region', $request->region);

            }

            if ($request->filled('division') && $request->division !== 'all') {
        $query->where('division', $request->division);
    }

    if ($request->filled('brand') && $request->brand !== 'all') {
            $query->where('brand', $request->brand);
        }
        if ($request->filled('micro_cluster') && $request->micro_cluster !== 'all') {
            $query->where('micro_cluster', $request->micro_cluster);
        }
        if ($request->filled('branch') && $request->branch !== 'all') {
            $query->where('branch', $request->branch);
        }
        if ($request->filled('area') && $request->area !== 'all') {
            $query->where('area', $request->area);
        }
        if ($request->filled('region') && $request->region !== 'all') {
            $query->where('region', $request->region);
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $users = $query->paginate(10)->withQueryString();

        // Get unique regions for filter dropdown
        $regions = User::distinct()->pluck('region')->filter()->sort()->values();

        $divisions = User::distinct()->pluck('division')->filter()->sort()->values();
        $brands = User::distinct()->pluck('brand')->filter()->sort()->values();
        $micro_clusters = User::distinct()->pluck('micro_cluster')->filter()->sort()->values();
        $branches = User::distinct()->pluck('branch')->filter()->sort()->values();
        $areas = User::distinct()->pluck('area')->filter()->sort()->values();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'regions' => $regions,
            'divisions' => $divisions,
            'brands' => $brands,
            'micro_clusters' => $micro_clusters,
            'branches' => $branches,
            'areas' => $areas,
            'filters' => $request->only(['search', 'role', 'status', 'region', 'division', 'brand', 'micro_cluster', 'branch', 'area', 'sort', 'direction'])
        ]);
    }

    /**
     * Store a newly created user
     */
   public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'nullable|string|unique:users,id',
            'name' => 'nullable|string|max:255',
            'username' => 'nullable|string|max:255|unique:users,username',
            'email' => 'nullable|email|unique:users,email',
            'password' => 'nullable|string|min:5',
            'role' => 'nullable|in:admin,trainer,user',
            'region' => 'nullable|string|max:255',
            'circle' => 'nullable|string|max:255',
            'division' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:255',
            'micro_cluster' => 'nullable|string|max:255',
            'branch' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'id' => $validated['id'] ?: 'USR-' . strtoupper(\Illuminate\Support\Str::random(8)),
            'name' => $validated['name'] ?? null,
            'username' => $validated['username'] ?? null,
            'email' => $validated['email'] ?? null,
            'password' => $validated['password'] ? Hash::make($validated['password']) : null,
            'role' => $validated['role'] ?? null,
            'region' => $validated['region'] ?? null,
            'circle' => $validated['circle'] ?? null,
            'division' => $validated['division'] ?? null,
            'brand' => $validated['brand'] ?? null,
            'micro_cluster' => $validated['micro_cluster'] ?? null,
            'branch' => $validated['branch'] ?? null,
            'area' => $validated['area'] ?? null,
            'is_registered' => false,
            'email_verified_at' => now(),
        ]);

        return redirect()->back()->with('success', 'User berhasil ditambahkan.');
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users')->ignore($user->id)],
            'email' => ['nullable', 'email', Rule::unique('users')->ignore($user->id)],
            'role' => 'nullable|in:admin,trainer,user',
            'division' => 'nullable|string|max:255',
            'brand' => 'nullable|string|max:255',
            'micro_cluster' => 'nullable|string|max:255',
            'branch' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'circle' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:5',
        ]);

        $updateData = [
            'name' => $validated['name'] ?? null,
            'username' => $validated['username'] ?? null,
            'email' => $validated['email'] ?? null,
            'role' => $validated['role'] ?? null,
            'division' => $validated['division'] ?? null,
            'brand' => $validated['brand'] ?? null,
            'micro_cluster' => $validated['micro_cluster'] ?? null,
            'branch' => $validated['branch'] ?? null,
            'area' => $validated['area'] ?? null,
            'region' => $validated['region'] ?? null,
            'circle' => $validated['circle'] ?? null,
        ];

        // Only update password if provided
        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return redirect()->back()->with('success', 'User berhasil diperbarui.');
    }

        
    /**
     * Remove the specified user
     */
    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors(['error' => 'Anda tidak dapat menghapus akun Anda sendiri.']);
        }

        $user->delete();

        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }

    /**
     * Verify user (set is_registered to true)
     */
    public function verify(User $user)
    {
        $user->update([
            'is_registered' => true,
            'email_verified_at' => now(),
        ]);

        return redirect()->back()->with('success', 'User berhasil diverifikasi.');
    }

    /**
     * Toggle user status
     */
    public function toggleStatus(User $user)
    {
        $user->update([
            'is_registered' => !$user->is_registered,
        ]);

        $status = $user->is_registered ? 'diaktifkan' : 'dinonaktifkan';
        return redirect()->back()->with('success', "User berhasil {$status}.");
    }

    /**
     * Bulk import users from mapped JSON rows (parsed on the frontend)
     */
    public function import(Request $request)
    {
        $request->validate([
            'rows'             => 'required|array|min:1',
            'rows.*.nik'       => 'nullable|string',
            'rows.*.name'      => 'nullable|string|max:255',
            'rows.*.username'  => 'nullable|string|max:255',
            'rows.*.email'     => 'nullable|email',
            'rows.*.password'      => 'nullable|string',
            'rows.*.role'      => 'nullable|in:admin,trainer,user',
            'rows.*.region'    => 'nullable|string|max:255',
            'rows.*.circle'    => 'nullable|string',
            'rows.*.division'  => 'nullable|string',
            'rows.*.brand'         => 'nullable|string',
            'rows.*.micro_cluster' => 'nullable|string',
            'rows.*.branch'        => 'nullable|string',
            'rows.*.area'          => 'nullable|string',
            'rows.*.status'    => 'nullable|string',
        ]);

        // Bulk import can legitimately take a while for large batches (thousands of rows).
        // The default PHP/Laravel execution time limit (often 30-60s) is what was killing
        // the previous request halfway through. Give this endpoint more room to work.
        // (For very large files the frontend also now splits the upload into smaller
        // batches, so this is a safety net rather than the primary fix.)
        if (function_exists('set_time_limit')) {
            @set_time_limit(300);
        }

        $rows    = $request->input('rows');
        $success = 0;
        $failed  = 0;
        $skipped = 0;
        $errors  = [];

        // Step 1: normalize rows and drop "off" status rows up front.
        $candidates = [];
        foreach ($rows as $index => $row) {
            $rowNumber = $index + 1;
            $status    = strtolower(trim($row['status'] ?? ''));

            if ($status === 'off') {
                $skipped++;
                continue;
            }

            $nik      = !empty($row['nik']) ? trim($row['nik']) : 'USR-' . strtoupper(\Illuminate\Support\Str::random(8));
            $username = !empty($row['username']) ? trim($row['username']) : $nik;
            $email    = !empty($row['email']) ? trim($row['email']) : null;

            $candidates[] = [
                'row_number' => $rowNumber,
                'nik'        => $nik,
                'username'   => $username,
                'email'      => $email,
                'raw'        => $row,
            ];
        }

        if (empty($candidates)) {
            return response()->json([
                'success' => 0,
                'skipped' => $skipped,
                'failed'  => 0,
                'errors'  => [],
            ]);
        }

        // Step 2: instead of running 3 SELECT queries PER ROW (which is what made
        // ~3000 rows turn into 9000-12000+ queries and blow past the time limit),
        // fetch every NIK/username/email that already exists in ONE query each,
        // scoped only to the values present in this batch.
        $niks      = array_column($candidates, 'nik');
        $usernames = array_column($candidates, 'username');
        $emails    = array_values(array_filter(array_column($candidates, 'email')));

        $existingNiks      = User::whereIn('id', $niks)->pluck('id')->flip();
        $existingUsernames = User::whereIn('username', $usernames)->pluck('username')->flip();
        $existingEmails    = $emails ? User::whereIn('email', $emails)->pluck('email')->flip() : collect();

        // Step 3: build the rows to insert, also guarding against duplicate
        // NIK/username/email appearing more than once inside the same file.
        $seenNiks      = [];
        $seenUsernames = [];
        $seenEmails    = [];
        $insertRows    = [];
        $now           = now();

        foreach ($candidates as $c) {
            $rowNumber = $c['row_number'];
            $nik       = $c['nik'];
            $username  = $c['username'];
            $email     = $c['email'];
            $row       = $c['raw'];

            if (isset($existingNiks[$nik]) || isset($seenNiks[$nik])) {
                $failed++;
                $errors[] = ['row' => $rowNumber, 'nik' => $nik, 'message' => 'NIK sudah terdaftar di sistem.'];
                continue;
            }

            if (isset($existingUsernames[$username]) || isset($seenUsernames[$username])) {
                $failed++;
                $errors[] = ['row' => $rowNumber, 'nik' => $nik, 'message' => 'Username sudah terdaftar di sistem.'];
                continue;
            }

            if ($email && (isset($existingEmails[$email]) || isset($seenEmails[$email]))) {
                $failed++;
                $errors[] = ['row' => $rowNumber, 'nik' => $nik, 'message' => 'Email sudah terdaftar di sistem.'];
                continue;
            }

            $seenNiks[$nik]         = true;
            $seenUsernames[$username] = true;
            if ($email) {
                $seenEmails[$email] = true;
            }

            $plainPassword = !empty($row['password']) ? trim($row['password']) : $nik;

            $insertRows[] = [
                'id'                => $nik,
                'name'              => !empty($row['name']) ? trim($row['name']) : null,
                'username'          => $username,
                'email'             => $email,
                'password'          => Hash::make($plainPassword),
                'role'              => !empty($row['role']) ? $row['role'] : null,
                'division'          => !empty($row['division']) ? trim($row['division']) : null,
                'brand'             => !empty($row['brand']) ? trim($row['brand']) : null,
                'micro_cluster'     => !empty($row['micro_cluster']) ? trim($row['micro_cluster']) : null,
                'branch'            => !empty($row['branch']) ? trim($row['branch']) : null,
                'area'              => !empty($row['area']) ? trim($row['area']) : null,
                'is_registered'     => true,
                'region'            => !empty($row['region']) ? trim($row['region']) : null,
                'circle'            => !empty($row['circle']) ? trim($row['circle']) : null,
                'email_verified_at' => $now,
                'created_at'        => $now,
                'updated_at'        => $now,
            ];
            $success++;
        }

        // Step 4: insert in chunks of 500 inside a transaction. A single bulk
        // INSERT per chunk is dramatically faster than one INSERT per row.
        if (!empty($insertRows)) {
            DB::transaction(function () use ($insertRows) {
                foreach (array_chunk($insertRows, 500) as $chunk) {
                    DB::table('users')->insert($chunk);
                }
            });
        }

        return response()->json([
            'success' => $success,
            'skipped' => $skipped,
            'failed'  => $failed,
            'errors'  => $errors,
        ]);
    }
    /**
     * Download CSV template for bulk import
     */
    public function downloadTemplate()
    {
        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="template_import_user.csv"',
        ];

      $rows = [
            ['nik', 'nama', 'username', 'email', 'password', 'role', 'division', 'brand', 'micro_cluster', 'branch', 'area', 'region', 'circle', 'status'],
            ['1234567890', 'Budi Santoso', 'budi.santoso', 'budi@example.com', 'BudiSandi123', 'user', 'DSE', 'Samsung', 'Micro A', 'Branch Jkt', 'Area 1', 'Jakarta', 'Circle 1', 'active'],
            ['0987654321', 'Siti Rahayu', 'siti.rahayu', '', 'SitiPass99', 'user', 'BSM', 'Oppo', 'Micro B', 'Branch Sby', 'Area 2', 'Surabaya', 'Circle 2', 'active'],
            ['1122334455', 'Joko Widodo', 'joko.widodo', '', 'JokoRahasia', 'user', 'HOS', 'Vivo', 'Micro C', 'Branch Bdg', 'Area 3', 'Bandung', 'Circle 3', 'off'],
        ];

        $callback = function () use ($rows) {
            $fp = fopen('php://output', 'w');
            foreach ($rows as $row) {
                fputcsv($fp, $row);
            }
            fclose($fp);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Sync resign: delete users whose NIK appears with status "off" in the uploaded dataset.
     * Rows with status "active" (or anything other than "off") are left untouched.
     */
    public function syncResign(Request $request)
    {
        $request->validate([
            'rows'          => 'required|array|min:1',
            'rows.*.nik'    => 'required|string',
            'rows.*.status' => 'required|string',
        ]);

        $rows      = $request->input('rows');
        $deleted   = 0;
        $skipped   = 0;
        $notFound  = 0;
        $protected = 0;
        $errors    = [];
        $deletedUsers = [];

        $currentUserId = auth()->id();

        foreach ($rows as $index => $row) {
            $nik    = trim($row['nik']);
            $status = strtolower(trim($row['status']));

            if ($status !== 'off') {
                $skipped++;
                continue;
            }

            $user = User::find($nik);

            if (!$user) {
                $notFound++;
                $errors[] = [
                    'row'     => $index + 1,
                    'nik'     => $nik,
                    'message' => 'NIK tidak ditemukan di sistem.',
                ];
                continue;
            }

            if ($user->id === $currentUserId) {
                $protected++;
                $errors[] = [
                    'row'     => $index + 1,
                    'nik'     => $nik,
                    'message' => 'Tidak dapat menghapus akun Anda sendiri.',
                ];
                continue;
            }

            $deletedUsers[] = ['nik' => $user->id, 'name' => $user->name];
            $user->delete();
            $deleted++;
        }

        return response()->json([
            'deleted'       => $deleted,
            'skipped'       => $skipped,
            'not_found'     => $notFound,
            'protected'     => $protected,
            'deleted_users' => $deletedUsers,
            'errors'        => $errors,
        ]);
    }

public function deleteDivision(Request $request)
{
    $request->validate([
        'division' => 'required|string',
    ]);

    // Mengubah semua user yang memiliki nama divisi tersebut menjadi null
    User::where('division', $request->division)->update([
        'division' => null
    ]);

    // Kembalikan respons sukses ke Inertia untuk me-refresh data komponen
    return redirect()->back();
}
}
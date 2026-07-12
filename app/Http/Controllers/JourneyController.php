<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class JourneyController extends Controller
{
    public function index(Request $request)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        
        $search = $request->input('search');
        $courseType = $request->input('course_type', 'mandatory');
        $divisionFilter = $request->input('division'); 

        $query = \App\Models\Journey::with('creator')
            ->leftJoin('journey_divisions', 'journeys.id', '=', 'journey_divisions.journey_id')
            ->select(
                'journeys.*', 
                \Illuminate\Support\Facades\DB::raw("GROUP_CONCAT(DISTINCT journey_divisions.target_division SEPARATOR ', ') as target_division"), 
                \Illuminate\Support\Facades\DB::raw("MAX(journey_divisions.position) as position"),
                \Illuminate\Support\Facades\DB::raw("MAX(journey_divisions.is_mandatory) as is_mandatory"),
                \Illuminate\Support\Facades\DB::raw("MAX(journey_divisions.is_locked) as is_locked")
            )
            ->groupBy(
                'journeys.id',
                'journeys.title',
                'journeys.description',
                'journeys.cover_url',
                'journeys.status',
                'journeys.created_by',
                'journeys.created_at',
                'journeys.updated_at'
            );
                
        if ($user && $user->role === 'admin') {
            if ($divisionFilter && $divisionFilter !== 'all') {
                $query->where('journey_divisions.target_division', $divisionFilter);
            }
        } elseif ($user && $user->role === 'trainer') {
            $query->where(function ($q) use ($user) {
                $q->where('journey_divisions.target_division', $user->division)
                  ->orWhereNull('journey_divisions.target_division');
            })
            ->where(function ($q) use ($user) {
                $q->where('journeys.status', 'published')
                  ->orWhere('journeys.created_by', $user->id);
            });
        } else {
            $query->where('journeys.status', 'published')
                  ->where('journey_divisions.target_division', $user->division);
        }
        
        // Filter Mandatory/Non-Mandatory removed as requested
       
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('journeys.title', 'like', '%' . $search . '%')
                  ->orWhere('journeys.description', 'like', '%' . $search . '%');
            });
        }

        $journeys = $query->orderByRaw('CASE WHEN MAX(journey_divisions.position) IS NULL THEN 1 ELSE 0 END, MAX(journey_divisions.position) asc')
                          ->orderBy('journeys.created_at', 'desc')
                          ->paginate(9)
                          ->withQueryString();
        
        $divisions = \Illuminate\Support\Facades\DB::table('journey_divisions')->distinct()
            ->whereNotNull('target_division')
            ->where('target_division', '!=', '')
            ->pluck('target_division');
            
        return \Inertia\Inertia::render('Journeys/Index', [
            'journeys' => $journeys,
            'filters' => [
                'search' => $search,
                'division' => $divisionFilter, 
            ],
            'divisions' => $divisions 
        ]);
    }

    public function create()
    {
        $user = \Illuminate\Support\Facades\Auth::user();

        if ($user && !in_array($user->role, ['trainer', 'admin'])) {
            abort(403, 'Anda tidak memiliki akses untuk membuat journey.');
        }

        return \Inertia\Inertia::render('Journeys/Create', [
            'auth' => [
                'user' => [
                    'role'     => $user->role,
                    'division' => $user->division,
                ]
            ]
        ]);
    }

    public function store(Request $request)
    {
        $user = \Illuminate\Support\Facades\Auth::user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'target_division' => $user->role === 'admin' ? 'required|array' : 'nullable|array', 
            'is_mandatory' => 'nullable|array', // Now an array mapping division to boolean
            'is_locked' => 'nullable|array', 
            'position' => 'nullable|array',
        ]);

        $targetDivisions = $user->role === 'admin' ? $request->input('target_division', []) : [$user->division];

        $coverPath = null;
        if ($request->hasFile('cover_image')) {
            $coverPath = $request->file('cover_image')->store('covers', 'public');
        }

        $journey = \App\Models\Journey::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'created_by' => $user->id, 
            'status' => $request->input('status', 'draft'), 
            'cover_url' => $coverPath ? \Illuminate\Support\Facades\Storage::url($coverPath) : null,
        ]);

        foreach ($targetDivisions as $division) {
            $mandatoryMap = $request->input('is_mandatory', []);
            $isMandatory = isset($mandatoryMap[$division]) ? filter_var($mandatoryMap[$division], FILTER_VALIDATE_BOOLEAN) : false;

            $lockedMap = $request->input('is_locked', []);
            $isLocked = isset($lockedMap[$division]) ? filter_var($lockedMap[$division], FILTER_VALIDATE_BOOLEAN) : false;

            $positionsMap = $request->input('position', []);
            $position = isset($positionsMap[$division]) ? (int)$positionsMap[$division] : 1;

            if ($isMandatory) {
                $existingJourney = \Illuminate\Support\Facades\DB::table('journey_divisions')
                    ->where('target_division', $division)
                    ->where('position', $position)
                    ->exists();

                if ($existingJourney) {
                    \Illuminate\Support\Facades\DB::table('journey_divisions')
                        ->where('target_division', $division)
                        ->where('position', '>=', $position)
                        ->increment('position');
                }
            }

            \Illuminate\Support\Facades\DB::table('journey_divisions')->insert([
                'journey_id' => $journey->id,
                'target_division' => $division,
                'is_mandatory' => $isMandatory,
                'is_locked' => $isLocked,
                'position' => $position,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return redirect()->route('journeys.index')->with('success', 'Journey berhasil dibuat!');
    }

    public function show($id)
    {
        $userId = \Illuminate\Support\Facades\Auth::id();
        
        $journey = \App\Models\Journey::with(['creator', 'courses' => function($query) use ($userId) {
            $query->withExists(['enrollments as is_enrolled' => function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->whereIn('status', ['enrolled', 'in_progress']);
            }])
            ->withExists(['enrollments as is_completed' => function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->where(function ($q2) {
                        $q2->where('status', 'completed')
                            ->orWhereNotNull('completed_at');
                    });
            }]);
        }])->findOrFail($id);
        
        return \Inertia\Inertia::render('Journeys/Show', [
            'journey' => $journey,
        ]);
    }

    public function edit(\App\Models\Journey $journey)
    {
        $user = \Illuminate\Support\Facades\Auth::user();

        if ($user->role === 'trainer' && $journey->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $pivotRecords = \Illuminate\Support\Facades\DB::table('journey_divisions')->where('journey_id', $journey->id)->get();
        
        $targetDivisions = $pivotRecords->pluck('target_division')->toArray();
        $positionsMap = [];
        $mandatoryMap = [];
        $lockedMap = [];
        foreach ($pivotRecords as $rec) {
            $positionsMap[$rec->target_division] = $rec->position;
            $mandatoryMap[$rec->target_division] = (bool)$rec->is_mandatory;
            $lockedMap[$rec->target_division] = (bool)($rec->is_locked ?? false);
        }

        $journey->target_division = $targetDivisions;
        $journey->position = $positionsMap;
        $journey->is_mandatory = $mandatoryMap;
        $journey->is_locked = $lockedMap;

        return \Inertia\Inertia::render('Journeys/Edit', [
            'journey' => $journey,
        ]);
    }

    public function update(Request $request, \App\Models\Journey $journey)
    {
        $user = \Illuminate\Support\Facades\Auth::user();

        if ($user->role === 'trainer' && $journey->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'status'           => 'required|in:draft,published,archived',
            'cover_image'      => 'nullable|image|max:2048',
            'target_division'  => 'nullable|array',
            'is_mandatory'     => 'nullable|array',
            'is_locked'        => 'nullable|array',
            'position'         => 'nullable|array',
        ]);

        $targetDivisions = $user->role === 'admin' ? $request->input('target_division', []) : [$user->division];

        $updateData = [
            'title'                  => $request->title,
            'description'            => $request->description,
            'status'                 => $request->status,
        ];

        if ($request->hasFile('cover_image')) {
            if ($journey->cover_url) {
                $oldPath = str_replace('/storage/', '', $journey->cover_url);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('cover_image')->store('covers', 'public');
            $updateData['cover_url'] = \Illuminate\Support\Facades\Storage::url($path);
        }

        $journey->update($updateData);

        \Illuminate\Support\Facades\DB::table('journey_divisions')->where('journey_id', $journey->id)->delete();

        foreach ($targetDivisions as $division) {
            $mandatoryMap = $request->input('is_mandatory', []);
            $isMandatory = isset($mandatoryMap[$division]) ? filter_var($mandatoryMap[$division], FILTER_VALIDATE_BOOLEAN) : false;

            $lockedMap = $request->input('is_locked', []);
            $isLocked = isset($lockedMap[$division]) ? filter_var($lockedMap[$division], FILTER_VALIDATE_BOOLEAN) : false;

            $positionsMap = $request->input('position', []);
            $position = isset($positionsMap[$division]) ? (int)$positionsMap[$division] : 1;

            if ($isMandatory) {
                $existingJourney = \Illuminate\Support\Facades\DB::table('journey_divisions')
                    ->where('target_division', $division)
                    ->where('position', $position)
                    ->where('journey_id', '!=', $journey->id) 
                    ->exists();

                if ($existingJourney) {
                    \Illuminate\Support\Facades\DB::table('journey_divisions')
                        ->where('target_division', $division)
                        ->where('position', '>=', $position)
                        ->where('journey_id', '!=', $journey->id)
                        ->increment('position');
                }
            }

            \Illuminate\Support\Facades\DB::table('journey_divisions')->insert([
                'journey_id' => $journey->id,
                'target_division' => $division,
                'is_mandatory' => $isMandatory,
                'is_locked' => $isLocked,
                'position' => $position,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        return redirect()->route('journeys.edit', $journey->id)
            ->with('success', 'Journey updated successfully.');
    }

    public function destroy(\App\Models\Journey $journey)
    {
        $user = \Illuminate\Support\Facades\Auth::user();

        if ($user->role !== 'admin' && $journey->created_by !== $user->id) {
            abort(403, 'Unauthorized action.');
        }

        $journey->delete(); 

        return redirect()->route('journeys.index')->with('success', 'Journey deleted successfully.');
    }
}
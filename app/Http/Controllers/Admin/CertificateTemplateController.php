<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CertificateTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB; // Ditambahkan untuk query tabel pivot
use Inertia\Inertia;

class CertificateTemplateController extends Controller
{
    public function index()
    {
        $templates = CertificateTemplate::all();
        return Inertia::render('admin/certificate-designs/index', [
            'templates' => $templates,
        ]);
    }

    public function create()
    {
        
        $divisions = DB::table('course_division')
            ->distinct()
            ->whereNotNull('target_division')
            ->where('target_division', '!=', '')
            ->pluck('target_division');

        return Inertia::render('admin/certificate-designs/Form', [
            'template' => null,
            'divisions' => $divisions, 
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'division' => 'nullable|string|max:255', 
            'background_image' => 'required|image|mimes:jpeg,png,jpg|max:10240',
            'signature_image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'layout_data' => 'required|json',
        ]);

        try {
            $imagePath = $request->file('background_image')->store('certificates', 'public');
            $signatureImagePath = null;

            if ($request->hasFile('signature_image')) {
                $signatureImagePath = $request->file('signature_image')->store('certificates/signatures', 'public');
            }

            CertificateTemplate::create([
                'name' => $validated['name'],
                'division' => $validated['division'] ?? null, 
                'background_image_path' => $imagePath,
                'signature_image_path' => $signatureImagePath,
                'layout_data' => json_decode($validated['layout_data'], true),
            ]);

            return redirect()->route('admin.certificate-templates.index')->with('success', 'Template sertifikat berhasil dibuat');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Gagal membuat template sertifikat: ' . $e->getMessage()]);
        }
    }

    public function edit(CertificateTemplate $certificateTemplate)
    {
    
        $divisions = DB::table('course_division')
            ->distinct()
            ->whereNotNull('target_division')
            ->where('target_division', '!=', '')
            ->pluck('target_division');

        return Inertia::render('admin/certificate-designs/Form', [
            'template' => $certificateTemplate,
            'divisions' => $divisions, 
        ]);
    }

    public function update(Request $request, CertificateTemplate $certificateTemplate)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'division' => 'nullable|string|max:255',
            'background_image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'signature_image' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
            'layout_data' => 'required|json',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'division' => $validated['division'] ?? null, // Update data divisi
            'layout_data' => json_decode($validated['layout_data'], true),
        ];

        // Handle background image upload
        if ($request->hasFile('background_image')) {
            try {
                if ($certificateTemplate->background_image_path && Storage::disk('public')->exists($certificateTemplate->background_image_path)) {
                    Storage::disk('public')->delete($certificateTemplate->background_image_path);
                }
                
                $imagePath = $request->file('background_image')->store('certificates', 'public');
                $updateData['background_image_path'] = $imagePath;
            } catch (\Exception $e) {
                return back()->withErrors(['background_image' => 'Gagal menyimpan gambar background: ' . $e->getMessage()]);
            }
        }

        // Handle signature image upload
        if ($request->hasFile('signature_image')) {
            try {
                if ($certificateTemplate->signature_image_path && Storage::disk('public')->exists($certificateTemplate->signature_image_path)) {
                    Storage::disk('public')->delete($certificateTemplate->signature_image_path);
                }

                $signaturePath = $request->file('signature_image')->store('certificates/signatures', 'public');
                $updateData['signature_image_path'] = $signaturePath;
            } catch (\Exception $e) {
                return back()->withErrors(['signature_image' => 'Gagal menyimpan gambar tanda tangan: ' . $e->getMessage()]);
            }
        }

        $certificateTemplate->update($updateData);

        return redirect()->route('admin.certificate-templates.index')->with('success', 'Template sertifikat berhasil diperbarui');
    }

    public function destroy(CertificateTemplate $certificateTemplate)
    {
        $certificateTemplate->delete();
        return redirect()->route('admin.certificate-templates.index')->with('success', 'Template sertifikat berhasil dihapus');
    }

    public function activate(CertificateTemplate $certificateTemplate)
    {
        
        CertificateTemplate::where('division', $certificateTemplate->division)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        
        $certificateTemplate->update(['is_active' => true]);

        return redirect()->route('admin.certificate-templates.index')->with('success', 'Template sertifikat berhasil diaktifkan untuk divisi tersebut');
    }
}
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CertificateTemplate;
use Illuminate\Http\Request;
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
        return Inertia::render('admin/certificate-designs/Form', [
            'template' => null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'background_image' => 'required|image|mimes:jpeg,png,jpg|max:10240',
            'layout_data' => 'required|json',
        ]);

        $imagePath = $request->file('background_image')->store('certificates', 'public');

        CertificateTemplate::create([
            'name' => $validated['name'],
            'background_image_path' => $imagePath,
            'layout_data' => json_decode($validated['layout_data'], true),
        ]);

        return redirect()->route('admin.certificate-templates.index')->with('success', 'Template sertifikat berhasil dibuat');
    }

    public function edit(CertificateTemplate $certificateTemplate)
    {
        return Inertia::render('admin/certificate-designs/Form', [
            'template' => $certificateTemplate,
        ]);
    }

    public function update(Request $request, CertificateTemplate $certificateTemplate)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'background_image' => 'nullable|image|mimes:jpeg,png,jpg|max:10240',
            'layout_data' => 'required|json',
        ]);

        if ($request->hasFile('background_image')) {
            $imagePath = $request->file('background_image')->store('certificates', 'public');
            $certificateTemplate->background_image_path = $imagePath;
        }

        $certificateTemplate->update([
            'name' => $validated['name'],
            'layout_data' => json_decode($validated['layout_data'], true),
        ]);

        return redirect()->route('admin.certificate-templates.index')->with('success', 'Template sertifikat berhasil diperbarui');
    }

    public function destroy(CertificateTemplate $certificateTemplate)
    {
        $certificateTemplate->delete();
        return redirect()->route('admin.certificate-templates.index')->with('success', 'Template sertifikat berhasil dihapus');
    }

    public function activate(CertificateTemplate $certificateTemplate)
    {
        CertificateTemplate::where('is_active', true)->update(['is_active' => false]);
        $certificateTemplate->update(['is_active' => true]);

        return redirect()->route('admin.certificate-templates.index')->with('success', 'Template sertifikat berhasil diaktifkan');
    }
}

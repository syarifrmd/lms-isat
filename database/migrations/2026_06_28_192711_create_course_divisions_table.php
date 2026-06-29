<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Membuat tabel pivot baru (Hanya jika belum ada di database)
        if (!Schema::hasTable('course_division')) {
            Schema::create('course_division', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
                $table->string('target_division');
                $table->integer('position')->default(1);
                $table->unsignedBigInteger('prerequisite_course_id')->nullable();
                $table->timestamps();

                // Tambahkan index agar pencarian jalur secepat kilat
                $table->index(['target_division', 'position']);
            });
        }

        // 2. Membersihkan kolom lama yang berbentuk string tunggal di tabel courses
        Schema::table('courses', function (Blueprint $table) {
            // Kita bungkus dengan pengecekan apakah kolom masih ada, mencegah error jika migrasi setengah jalan
            if (Schema::hasColumn('courses', 'prerequisite_course_id')) {
                $table->dropForeign('courses_prerequisite_course_id_foreign');
            }
            
            // Drop kolom-kolom lama yang sudah dipindah ke tabel pivot
            $columnsToDrop = [];
            if (Schema::hasColumn('courses', 'target_division')) $columnsToDrop[] = 'target_division';
            if (Schema::hasColumn('courses', 'position')) $columnsToDrop[] = 'position';
            if (Schema::hasColumn('courses', 'prerequisite_course_id')) $columnsToDrop[] = 'prerequisite_course_id';

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_division');
        
        Schema::table('courses', function (Blueprint $table) {
            if (!Schema::hasColumn('courses', 'target_division')) {
                $table->string('target_division')->nullable();
            }
            if (!Schema::hasColumn('courses', 'position')) {
                $table->integer('position')->default(1);
            }
            if (!Schema::hasColumn('courses', 'prerequisite_course_id')) {
                $table->unsignedBigInteger('prerequisite_course_id')->nullable();
                
                $table->foreign('prerequisite_course_id')
                      ->references('id')
                      ->on('courses')
                      ->onDelete('set null');
            }
        });
    }
};
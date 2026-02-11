<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('module_progress', function (Blueprint $table) {
            // Tambahkan foreign key ke checklist_item
            $table->foreignId('checklist_item_id')->nullable()->after('module_id')
                ->constrained('module_checklist_items')->onDelete('cascade');
            
            // Tambahkan kolom is_completed dan completed_at untuk tracking lebih baik
            $table->boolean('is_completed')->default(false)->after('highest_quiz_score');
            $table->timestamp('completed_at')->nullable()->after('is_completed');
            
            // Index untuk query performance
            $table->index(['enrollment_id', 'checklist_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('module_progress', function (Blueprint $table) {
            $table->dropForeign(['checklist_item_id']);
            $table->dropIndex(['enrollment_id', 'checklist_item_id']);
            $table->dropColumn(['checklist_item_id', 'is_completed', 'completed_at']);
        });
    }
};

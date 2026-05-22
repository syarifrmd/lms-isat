<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('module_progress', function (Blueprint $table) {
            if (!Schema::hasColumn('module_progress', 'is_document_read')) {
                $table->boolean('is_document_read')->nullable()->after('is_text_read');
            }

            if (!Schema::hasColumn('module_progress', 'video_last_position_seconds')) {
                $table->decimal('video_last_position_seconds', 10, 2)->nullable()->after('highest_quiz_score');
            }

            if (!Schema::hasColumn('module_progress', 'video_max_position_seconds')) {
                $table->decimal('video_max_position_seconds', 10, 2)->nullable()->after('video_last_position_seconds');
            }

            if (!Schema::hasColumn('module_progress', 'video_duration_seconds')) {
                $table->decimal('video_duration_seconds', 10, 2)->nullable()->after('video_max_position_seconds');
            }

            if (!Schema::hasColumn('module_progress', 'text_elapsed_seconds')) {
                $table->integer('text_elapsed_seconds')->nullable()->after('video_duration_seconds');
            }

            if (!Schema::hasColumn('module_progress', 'text_scroll_percentage')) {
                $table->decimal('text_scroll_percentage', 5, 2)->nullable()->after('text_elapsed_seconds');
            }

            if (!Schema::hasColumn('module_progress', 'doc_current_page')) {
                $table->integer('doc_current_page')->nullable()->after('text_scroll_percentage');
            }

            if (!Schema::hasColumn('module_progress', 'doc_total_pages')) {
                $table->integer('doc_total_pages')->nullable()->after('doc_current_page');
            }
        });
    }

    public function down(): void
    {
        Schema::table('module_progress', function (Blueprint $table) {
            foreach ([
                'is_document_read',
                'video_last_position_seconds',
                'video_max_position_seconds',
                'video_duration_seconds',
                'text_elapsed_seconds',
                'text_scroll_percentage',
                'doc_current_page',
                'doc_total_pages',
            ] as $column) {
                if (Schema::hasColumn('module_progress', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
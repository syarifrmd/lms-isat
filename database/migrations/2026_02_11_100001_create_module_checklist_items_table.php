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
        Schema::create('module_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('modules')->onDelete('cascade');
            $table->string('title'); // e.g., "Tonton Video Pengenalan", "Baca Materi", "Kerjakan Quiz"
            $table->string('type'); // video, text, quiz, task, exercise
            $table->text('description')->nullable();
            $table->integer('order_sequence')->unsigned();
            $table->bigInteger('xp_reward')->default(0);
            $table->timestamps();
            
            $table->index(['module_id', 'order_sequence']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('module_checklist_items');
    }
};

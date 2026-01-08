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
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained('courses')->onDelete('cascade');
            $table->string('title');
            $table->string('video_url')->nullable();
            $table->string('doc_url')->nullable();
            $table->text('content_text')->nullable();
            $table->integer('order_sequence')->unsigned();
            $table->decimal('duration_minutes', 10, 2)->nullable();
            $table->bigInteger('xp_amounts')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            // Check constraint is not supported in all databases via Blueprint but widely supported in raw SQL
            // MySQL 8.0.16+ supports CHECK constraints.
            // $table->check('order_sequence > 0'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modules');
    }
};

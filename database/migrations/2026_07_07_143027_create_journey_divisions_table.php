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
        Schema::create('journey_divisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journey_id')->constrained('journeys')->onDelete('cascade');
            $table->string('target_division');
            $table->boolean('is_mandatory')->default(false);
            $table->integer('position')->default(1);
            $table->timestamps();

            // Tambahkan index agar pencarian secepat kilat
            $table->index(['target_division', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journey_divisions');
    }
};

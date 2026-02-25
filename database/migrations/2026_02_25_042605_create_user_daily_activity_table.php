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
        Schema::create('user_daily_activity', function (Blueprint $table) {
            $table->id();
            $table->string('user_id'); // varchar — sesuai tipe id di tabel users
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('minutes')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'date']); // 1 baris per user per hari
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_daily_activity');
    }
};

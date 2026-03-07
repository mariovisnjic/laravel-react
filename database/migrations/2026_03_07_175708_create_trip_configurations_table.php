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
        Schema::create('trip_configurations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('duration')->default(3);
            $table->string('period')->nullable();
            $table->boolean('arrival_by_car')->default(false);
            $table->boolean('arrival_by_plane')->default(false);
            $table->unsignedTinyInteger('adults')->default(1);
            $table->unsignedTinyInteger('kids')->default(0);
            $table->string('budget')->nullable();
            $table->json('interests')->nullable();
            $table->unsignedTinyInteger('max_stops')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_configurations');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('region');
            $table->decimal('latitude', 8, 6);
            $table->decimal('longitude', 9, 6);

            // Interest scores (0-10)
            $table->unsignedTinyInteger('beach_score')->default(0);
            $table->unsignedTinyInteger('culture_score')->default(0);
            $table->unsignedTinyInteger('active_score')->default(0);
            $table->unsignedTinyInteger('gastronomy_score')->default(0);
            $table->unsignedTinyInteger('family_score')->default(0);

            // Logistics
            $table->unsignedTinyInteger('budget_tier')->default(2); // 1=low 2=medium 3=upper-mid 4=luxury
            $table->unsignedTinyInteger('min_stay_days')->default(1);
            $table->unsignedTinyInteger('max_stay_days')->default(3);
            $table->boolean('car_accessible')->default(true);
            $table->boolean('plane_accessible')->default(false);

            // Seasonality
            $table->json('peak_months');     // ["June","July","August"]
            $table->json('shoulder_months'); // ["May","September","October"]

            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};

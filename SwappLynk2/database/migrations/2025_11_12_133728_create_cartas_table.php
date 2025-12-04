<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cartas', function (Blueprint $table) {
            $table->string('id')->primary(); // Será el ID de TCGdex
            $table->timestamps();
            
            // No necesitas más campos porque la info viene de TCGdex
            // Esta tabla solo sirve como referencia para las foreign keys
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cartas');
    }
};

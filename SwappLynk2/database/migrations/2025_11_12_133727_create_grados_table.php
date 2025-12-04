<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grados', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->string('descripcion')->nullable();
            $table->timestamps();
        });

        // Insertar grados predeterminados
        DB::table('grados')->insert([
            ['nombre' => '1', 'descripcion' => 'Mala condición', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => '2', 'descripcion' => 'Buena condición', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => '3', 'descripcion' => 'Muy buena condición', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => '4', 'descripcion' => 'Muy buena a excelente condición', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => '5', 'descripcion' => 'Excelente condición', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => '6', 'descripcion' => 'Excelente a casi perfecta condición', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => '7', 'descripcion' => 'Casi perfecta condición', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => '8', 'descripcion' => 'Casi perfecta a perfecta condición', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => '9', 'descripcion' => 'Perfecta condición', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => '10', 'descripcion' => 'Joya en perfecta condición', 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Sin Gradear', 'descripcion' => 'Sin grado', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('grados');
    }
};

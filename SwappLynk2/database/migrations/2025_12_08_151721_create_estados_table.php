<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('estados', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->timestamps();
        });

        // Insertamos los estados iniciales
        DB::table('estados')->insert([
            ['id' => 1, 'nombre' => 'esperando recibir'],
            ['id' => 2, 'nombre' => 'recibido'],
            ['id' => 3, 'nombre' => 'enviado'],
            ['id' => 4, 'nombre' => 'cancelada'],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('estados');
    }
};

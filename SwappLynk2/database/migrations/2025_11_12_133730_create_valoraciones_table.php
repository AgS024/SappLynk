<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('valoraciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_valorado')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_valorador')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_venta')->nullable()->constrained('ventas')->onDelete('set null');
            $table->text('descripcion')->nullable();
            $table->integer('valor')->unsigned(); // 1-5 estrellas
            $table->timestamps();
            
            // Un usuario solo puede valorar a otro una vez por venta
            $table->unique(['id_valorado', 'id_valorador', 'id_venta']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('valoraciones');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('en_venta', function (Blueprint $table) {
        $table->id();
        $table->foreignId('id_usuario')->constrained('users')->onDelete('cascade');
        $table->string('id_carta');
        $table->foreignId('id_grado')->constrained('grados');
        $table->decimal('precio', 10, 2);
        $table->timestamp('fecha_publicacion')->useCurrent();
        $table->enum('estado', ['activa', 'vendida', 'cancelada'])->default('activa');
        $table->timestamps();
        
        $table->foreign('id_carta')->references('id')->on('cartas')->onDelete('cascade');
        $table->index(['id_carta', 'estado']);
        $table->index(['id_usuario', 'estado']);
    });
}


    public function down(): void
    {
        Schema::dropIfExists('en_venta');
    }
};

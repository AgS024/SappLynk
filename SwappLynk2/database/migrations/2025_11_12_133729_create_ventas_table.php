<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::create('ventas', function (Blueprint $table) {
        $table->id();
        $table->foreignId('id_en_venta')->constrained('en_venta')->onDelete('cascade');
        $table->foreignId('id_comprador')->constrained('users')->onDelete('cascade');
        $table->decimal('precio_total', 10, 2);
        $table->timestamp('fecha_venta')->useCurrent();
        $table->timestamps();
        
        $table->index('id_comprador');
        $table->index('fecha_venta');
    });
}

    public function down(): void
    {
        Schema::dropIfExists('ventas');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wishlist', function (Blueprint $table) {
            $table->foreignId('id_usuario')->constrained('users')->onDelete('cascade');
            $table->string('id_carta');
            $table->decimal('precio_aviso', 10, 2)->nullable();
            $table->timestamps();
            
            // Clave primaria compuesta
            $table->primary(['id_usuario', 'id_carta']);
            
            // Foreign key a cartas
            $table->foreign('id_carta')->references('id')->on('cartas')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wishlist');
    }
};

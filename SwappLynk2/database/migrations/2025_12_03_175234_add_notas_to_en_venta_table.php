<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('en_venta', function (Blueprint $table) {
            // Campo de notas para la publicación en venta
            $table->text('notas')->nullable()->after('precio');
        });
    }

    public function down(): void
    {
        Schema::table('en_venta', function (Blueprint $table) {
            $table->dropColumn('notas');
        });
    }
};

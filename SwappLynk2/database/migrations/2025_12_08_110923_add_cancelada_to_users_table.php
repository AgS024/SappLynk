<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Campo booleano para baneos / cuentas deshabilitadas
            $table->boolean('cancelada')
                  ->default(false)
                  ->after('admin'); // Lo colocamos justo después de "admin"
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('cancelada');
        });
    }
};

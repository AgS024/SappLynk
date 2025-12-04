<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('direccion')->nullable(false)->after('email');
            $table->string('provincia')->nullable(false)->after('direccion');
            $table->string('ciudad')->nullable(false)->after('provincia');
            $table->string('cp')->nullable(false)->after('ciudad');
            $table->decimal('suma_val', 10, 2)->default(0)->after('cp');
            $table->integer('cantidad_val')->default(0)->after('suma_val');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['direccion','provincia','ciudad','cp', 'suma_val', 'cantidad_val']);
        });
    }
};

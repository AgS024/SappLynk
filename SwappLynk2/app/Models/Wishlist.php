<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Wishlist extends Model
{
    protected $table = 'wishlist';

    protected $fillable = [
        'id_usuario',
        'id_carta',
        'precio_aviso',
    ];

    protected $casts = [
        'precio_aviso' => 'decimal:2',
    ];

    /**
     * IMPORTANTE:
     * Laravel NO soporta PK compuesta.
     * Desactivamos completamente el uso de primaryKey y save().
     */
    public $incrementing = false;
    protected $primaryKey = null;
    public $timestamps = true;

    /*
     |--------------------------------------------------------------------------
     | Relaciones
     |--------------------------------------------------------------------------
     */

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    public function carta()
    {
        return $this->belongsTo(Carta::class, 'id_carta');
    }
}

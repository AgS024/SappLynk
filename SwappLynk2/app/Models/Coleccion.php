<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coleccion extends Model
{
    protected $table = 'coleccion';
    
    protected $fillable = [
        'id_usuario',
        'id_carta',
        'id_grado',
        'cantidad',
        'notas',
        'fecha_adquisicion'
    ];

    protected $casts = [
        'fecha_adquisicion' => 'datetime',
    ];

    // No usar auto-incrementing ID
    public $incrementing = false;
    
    // Deshabilitar la clave primaria por defecto
    protected $primaryKey = null;

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    public function carta()
    {
        return $this->belongsTo(Carta::class, 'id_carta');
    }

    public function grado()
    {
        return $this->belongsTo(Grado::class, 'id_grado');
    }
}

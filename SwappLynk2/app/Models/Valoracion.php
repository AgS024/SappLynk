<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Valoracion extends Model
{
    protected $table = 'valoraciones';
    
    protected $fillable = [
        'id_valorado',
        'id_valorador',
        'id_venta',
        'descripcion',
        'valor'
    ];

    // Eventos de ciclo de vida
    protected static function booted()
    {
        // Cuando se crea una valoración
        static::created(function ($valoracion) {
            $valoracion->actualizarValoracionesUsuario();
        });

        // Cuando se actualiza una valoración
        static::updated(function ($valoracion) {
            $valoracion->actualizarValoracionesUsuario();
        });

        // Cuando se elimina una valoración
        static::deleted(function ($valoracion) {
            $valoracion->actualizarValoracionesUsuario();
        });
    }

    /**
     * Actualizar suma_val y cantidad_val del usuario valorado
     */
    private function actualizarValoracionesUsuario()
    {
        $usuario = $this->valorado;
        if ($usuario) {
            $usuario->cantidad_val = $usuario->valoracionesRecibidas()->count();
            $usuario->suma_val = $usuario->valoracionesRecibidas()->sum('valor');
            $usuario->save();
        }
    }

    public function valorado()
    {
        return $this->belongsTo(User::class, 'id_valorado');
    }

    public function valorador()
    {
        return $this->belongsTo(User::class, 'id_valorador');
    }

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }
}

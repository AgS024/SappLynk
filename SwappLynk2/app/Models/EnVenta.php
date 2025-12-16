<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Jobs\SendWishlistPriceAlert;

class EnVenta extends Model
{
    protected $table = 'en_venta';

    protected $fillable = [
        'id_usuario',
        'id_carta',
        'id_grado',
        'precio',
        'fecha_publicacion',
        'estado',
        'notas',
    ];

    protected $casts = [
        'precio' => 'decimal:2',
        'fecha_publicacion' => 'datetime',
    ];

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

    public function venta()
    {
        return $this->hasOne(Venta::class, 'id_en_venta');
    }

    // Scope para cartas activas
    public function scopeActivas($query)
    {
        return $query->where('estado', 'activa');
    }

    public function estaVendida()
    {
        return $this->estado === 'vendida';
    }

    public function estaActiva()
    {
        return $this->estado === 'activa';
    }

    /**
     * ✅ Disparar aviso cuando “aparece” una carta:
     * - al CREAR una publicación activa
     * - al ACTUALIZAR y cambiar estado a 'activa'
     */
    protected static function booted()
    {
        // Cuando se crea
        static::created(function (EnVenta $pub) {
            if ($pub->estado === 'activa') {
                SendWishlistPriceAlert::dispatch($pub->id);
            }
        });

        // Cuando se actualiza
        static::updated(function (EnVenta $pub) {
            // Si antes no estaba activa y ahora sí
            if ($pub->wasChanged('estado') && $pub->estado === 'activa') {
                SendWishlistPriceAlert::dispatch($pub->id);
            }

            // Si sigue activa pero cambió el precio (y bajó), también puede interesar
            if ($pub->wasChanged('precio') && $pub->estado === 'activa') {
                SendWishlistPriceAlert::dispatch($pub->id);
            }
        });
    }
}

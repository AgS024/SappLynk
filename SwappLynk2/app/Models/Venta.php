<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    protected $table = 'ventas';
    
    protected $fillable = [
        'id_en_venta',
        'id_comprador',
        'precio_total',
        'fecha_venta',
        'id_estado',      // 👈 FK al estado
    ];

    protected $casts = [
        'precio_total' => 'decimal:2',
        'fecha_venta'  => 'datetime',
    ];

    /**
     * Publicación original de la venta (tabla en_venta)
     */
    public function enVenta()
    {
        return $this->belongsTo(EnVenta::class, 'id_en_venta');
    }

    /**
     * Comprador (relación directa)
     */
    public function comprador()
    {
        return $this->belongsTo(User::class, 'id_comprador');
    }

    /**
     * Estado de la venta (esperando recibir, recibido, enviado, cancelada...)
     */
    public function estado()
    {
        return $this->belongsTo(Estado::class, 'id_estado');
    }

    /**
     * Valoraciones asociadas a esta venta
     */
    public function valoraciones()
    {
        return $this->hasMany(Valoracion::class, 'id_venta');
    }

    /**
     * 🛈 Helper opcional: obtener el vendedor a partir de en_venta
     * (NO es una relación para eager loading, solo un atajo en PHP)
     */
    public function getVendedorAttribute()
    {
        return $this->enVenta ? $this->enVenta->usuario : null;
    }

    /**
     * 🛈 Helper opcional: obtener la carta vendida
     */
    public function getCartaAttribute()
    {
        return $this->enVenta ? $this->enVenta->carta : null;
    }
}

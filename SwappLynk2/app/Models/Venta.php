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
        'fecha_venta'
    ];

    protected $casts = [
        'precio_total' => 'decimal:2',
        'fecha_venta' => 'datetime',
    ];

    public function enVenta()
    {
        return $this->belongsTo(EnVenta::class, 'id_en_venta');
    }

    public function comprador()
    {
        return $this->belongsTo(User::class, 'id_comprador');
    }

    public function valoraciones()
    {
        return $this->hasMany(Valoracion::class, 'id_venta');
    }

    // Obtener el vendedor a través de en_venta
    public function vendedor()
    {
        return $this->enVenta->usuario ?? null;
    }

    // Obtener la carta vendida
    public function carta()
    {
        return $this->enVenta->carta ?? null;
    }
}

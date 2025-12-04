<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'notas',          // ✅ añadimos notas
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

    // Verificar si está vendida
    public function estaVendida()
    {
        return $this->estado === 'vendida';
    }

    // Verificar si está activa
    public function estaActiva()
    {
        return $this->estado === 'activa';
    }
}

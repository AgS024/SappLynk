<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'direccion',
        'provincia',
        'ciudad',
        'cp',
        'suma_val',
        'cantidad_val',
        'admin',        
        'cancelada',    
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'suma_val'          => 'decimal:2',
        'admin'             => 'boolean',
        'cancelada'         => 'boolean',  
    ];

    // Relaciones
    public function coleccion()
    {
        return $this->hasMany(Coleccion::class, 'id_usuario');
    }

    public function wishlist()
    {
        return $this->hasMany(Wishlist::class, 'id_usuario');
    }

    public function ventas()
    {
        return $this->hasMany(EnVenta::class, 'id_usuario');
    }

    public function compras()
    {
        return $this->hasMany(Venta::class, 'id_comprador');
    }

    public function valoracionesRecibidas()
    {
        return $this->hasMany(Valoracion::class, 'id_valorado');
    }

    public function valoracionesHechas()
    {
        return $this->hasMany(Valoracion::class, 'id_valorador');
    }

    // Método para calcular la media de valoraciones
    public function valoracionMedia()
    {
        return $this->cantidad_val > 0
            ? round($this->suma_val / $this->cantidad_val, 2)
            : 0;
    }
}

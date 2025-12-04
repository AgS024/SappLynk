<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Carta extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = ['id'];

    public function coleccion()
    {
        return $this->hasMany(Coleccion::class, 'id_carta');
    }

    public function wishlist()
    {
        return $this->hasMany(Wishlist::class, 'id_carta');
    }

    public function enVenta()
    {
        return $this->hasMany(EnVenta::class, 'id_carta');
    }
}

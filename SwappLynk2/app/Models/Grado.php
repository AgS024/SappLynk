<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grado extends Model
{
    protected $fillable = ['nombre', 'descripcion'];

    public function coleccion()
    {
        return $this->hasMany(Coleccion::class, 'id_grado');
    }

    public function enVenta()
    {
        return $this->hasMany(EnVenta::class, 'id_grado');
    }
}

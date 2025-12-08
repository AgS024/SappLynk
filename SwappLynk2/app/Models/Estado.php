<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Estado extends Model
{
    protected $table = 'estados';

    protected $fillable = [
        'nombre'
    ];

    public function ventas()
    {
        return $this->hasMany(Venta::class, 'id_estado');
    }
}

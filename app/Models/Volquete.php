<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Volquete extends Model
{
    protected $table = 'volquetes';

    protected $fillable = [
        'nombre',
        'estado',
        'lat',
        'lng',
        'direccion',
        'cliente',
        'fecha_colocacion',
        'es_privado',
    ];

    protected $casts = [
        'lat' => 'float',
        'lng' => 'float',
        'fecha_colocacion' => 'date:Y-m-d',
        'es_privado' => 'boolean',
    ];

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class);
    }

    public function alquileres(): HasMany
    {
        return $this->hasMany(Alquiler::class);
    }

    public function alquilerActual(): HasOne
    {
        return $this->hasOne(Alquiler::class)->whereNull('fecha_retiro')->latestOfMany('fecha_colocacion');
    }
}
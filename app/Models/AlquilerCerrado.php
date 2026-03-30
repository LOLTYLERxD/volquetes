<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlquilerCerrado extends Model
{
    protected $table = 'alquileres_cerrados';

    protected $fillable = [
        'alquiler_id',
        'volquete_id',
        'fecha_colocacion',
        'fecha_retiro',
        'dias',
        'direccion',
        'cliente',
        'lat',
        'lng',
        'nota',
        'reemplazos_total',
        'dinero_total_ars',
    ];

    protected $casts = [
        'fecha_colocacion' => 'date',
        'fecha_retiro' => 'date',
        'dias' => 'integer',
        'reemplazos_total' => 'integer',
        'dinero_total_ars' => 'integer',
        'lat' => 'float',
        'lng' => 'float',
    ];
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Movimiento extends Model
{
    protected $table = 'movimientos';

    protected $fillable = [
        'volquete_id',
        'fecha',
        'tipo',
        'ubicacion_anterior',
        'ubicacion_nueva',
        'lat_anterior',
        'lng_anterior',
        'lat_nueva',
        'lng_nueva',
        'nota',
    ];

    protected $casts = [
        'fecha' => 'date:Y-m-d',
        'lat_anterior' => 'float',
        'lng_anterior' => 'float',
        'lat_nueva' => 'float',
        'lng_nueva' => 'float',
    ];

    public function volquete(): BelongsTo
    {
        return $this->belongsTo(Volquete::class);
    }
}
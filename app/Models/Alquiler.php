<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alquiler extends Model
{
    protected $table = 'alquileres';

    protected $fillable = [
        'volquete_id',
        'fecha_colocacion',
        'fecha_retiro',
        'direccion',
        'cliente',
        'lat',
        'lng',
        'nota',
    ];

    protected $casts = [
        'fecha_colocacion' => 'date:Y-m-d',
        'fecha_retiro' => 'date:Y-m-d',
        'lat' => 'float',
        'lng' => 'float',
    ];

    public function volquete(): BelongsTo
    {
        return $this->belongsTo(Volquete::class);
    }
}
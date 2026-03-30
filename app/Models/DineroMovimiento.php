<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DineroMovimiento extends Model
{
    protected $table = 'dinero_movimientos';

    protected $fillable = [
        'fecha',
        'concepto',
        'monto_ars',
        'nota',
        'volquete_id',
        'alquiler_id',
        'movimiento_id',
    ];

    protected $casts = [
        'fecha' => 'date',
        'monto_ars' => 'integer',
    ];

    public function volquete()
    {
        return $this->belongsTo(Volquete::class);
    }

    public function alquiler()
    {
        return $this->belongsTo(Alquiler::class);
    }

    public function movimiento()
    {
        return $this->belongsTo(Movimiento::class);
    }
}
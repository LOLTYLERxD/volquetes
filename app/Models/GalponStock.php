<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GalponStock extends Model
{
    protected $table = 'galpon_stock';

    protected $fillable = ['cantidad'];

    // Siempre trabaja con el único registro
    public static function getCantidad(): int
    {
        return (int) static::first()?->cantidad ?? 0;
    }

    public static function setCantidad(int $cantidad): void
    {
        static::updateOrCreate(['id' => 1], ['cantidad' => $cantidad]);
    }
}
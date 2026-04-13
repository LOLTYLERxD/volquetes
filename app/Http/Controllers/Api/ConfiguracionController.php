<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ConfiguracionController extends Controller
{
    public function getPrecioVolquete()
    {
        $valor = DB::table('tipos_volquete')
            ->where('nombre', 'estandar')
            ->value('precio_servicio_ars');

        return response()->json([
            'valor' => (int) ($valor ?? 52000),
        ]);
    }

    public function updatePrecioVolquete(Request $request)
    {
        $data = $request->validate([
            'valor' => ['required', 'numeric', 'min:0'],
        ]);

        DB::table('tipos_volquete')
            ->where('nombre', 'estandar')
            ->update([
                'precio_servicio_ars' => (int) $data['valor'],
                'updated_at' => now(),
            ]);

        return response()->json([
            'ok' => true,
            'valor' => (int) $data['valor'],
        ]);
    }
}
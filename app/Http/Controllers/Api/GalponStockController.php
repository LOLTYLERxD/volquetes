<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GalponStock;
use Illuminate\Http\Request;

class GalponStockController extends Controller
{
    public function show()
    {
        return response()->json([
            'cantidad' => GalponStock::getCantidad(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'cantidad' => ['required', 'integer', 'min:0', 'max:9999'],
        ]);

        GalponStock::setCantidad($data['cantidad']);

        return response()->json([
            'cantidad' => $data['cantidad'],
        ]);
    }
}
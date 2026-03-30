<?php

namespace App\Http\Controllers;

use App\Models\Volquete;
use App\Models\Movimiento;
use Illuminate\Http\Request;

class VolqueteController extends Controller
{
    public function index()
    {
        return Volquete::with('movimientos')
            ->orderBy('nombre')
            ->get()
            ->map(fn($v) => $this->toDto($v));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required','string','max:50'],
            'direccion' => ['required','string','max:255'],
            'cliente' => ['nullable','string','max:255'],
            'lat' => ['required','numeric'],
            'lng' => ['required','numeric'],
            'esPrivado' => ['nullable','boolean'],
        ]);

        $esPrivado = (bool) ($data['esPrivado'] ?? true);

        $volquete = Volquete::create([
            'nombre' => $data['nombre'],
            'estado' => $esPrivado ? 'ocupado' : 'disponible',
            'es_privado' => $esPrivado,
            'lat' => $data['lat'],
            'lng' => $data['lng'],
            'direccion' => $data['direccion'],
            'cliente' => $esPrivado ? ($data['cliente'] ?? null) : null,
            'fecha_colocacion' => $esPrivado ? now()->toDateString() : null,
        ]);

        Movimiento::create([
            'volquete_id' => $volquete->id,
            'fecha' => now()->toDateString(),
            'tipo' => 'colocacion',
            'ubicacion_nueva' => $volquete->direccion,
            'lat_nueva' => $volquete->lat,
            'lng_nueva' => $volquete->lng,
            'nota' => $esPrivado ? 'Colocación inicial' : 'Alta (no privado)',
        ]);

        $volquete->load('movimientos');
        return $this->toDto($volquete);
    }

    public function destroy(Volquete $volquete)
    {
        $volquete->delete();
        return response()->noContent();
    }

    public function updateStatus(Request $request, Volquete $volquete)
    {
        $data = $request->validate([
            'estado' => ['required','in:disponible,ocupado,en_transito,mantenimiento'],
        ]);

        $volquete->update(['estado' => $data['estado']]);
        $volquete->load('movimientos');
        return $this->toDto($volquete);
    }

    public function storeMovimiento(Request $request, Volquete $volquete)
    {
        $data = $request->validate([
            'tipo' => ['required','in:colocacion,retiro,traslado'],
            'direccion' => ['required','string','max:255'],
            'lat' => ['required','numeric'],
            'lng' => ['required','numeric'],
            'nota' => ['nullable','string','max:500'],
        ]);

        $nextEstado = match ($data['tipo']) {
            'retiro' => 'disponible',
            'traslado' => 'en_transito',
            default => 'ocupado',
        };

        Movimiento::create([
            'volquete_id' => $volquete->id,
            'fecha' => now()->toDateString(),
            'tipo' => $data['tipo'],
            'ubicacion_anterior' => $volquete->direccion,
            'ubicacion_nueva' => $data['direccion'],
            'lat_anterior' => $volquete->lat,
            'lng_anterior' => $volquete->lng,
            'lat_nueva' => $data['lat'],
            'lng_nueva' => $data['lng'],
            'nota' => $data['nota'] ?? null,
        ]);

        $volquete->update([
            'direccion' => $data['direccion'],
            'lat' => $data['lat'],
            'lng' => $data['lng'],
            'estado' => $nextEstado,
        ]);

        $volquete->load('movimientos');
        return $this->toDto($volquete);
    }

    private function toDto(Volquete $v): array
    {
        return [
            'id' => $v->id,
            'nombre' => $v->nombre,
            'estado' => $v->estado,
            'colocado' => $v->estado !== 'disponible',
            'lat' => $v->lat,
            'lng' => $v->lng,
            'direccion' => $v->direccion,
            'cliente' => $v->cliente,
            'fechaColocacion' => optional($v->fecha_colocacion)->format('Y-m-d'),
            'movimientos' => $v->movimientos->map(fn($m) => [
                'id' => $m->id,
                'fecha' => optional($m->fecha)->format('Y-m-d'),
                'tipo' => $m->tipo,
                'ubicacionAnterior' => $m->ubicacion_anterior,
                'ubicacionNueva' => $m->ubicacion_nueva,
                'latAnterior' => $m->lat_anterior,
                'lngAnterior' => $m->lng_anterior,
                'latNueva' => $m->lat_nueva,
                'lngNueva' => $m->lng_nueva,
                'nota' => $m->nota,
            ])->values(),
        ];
    }
}
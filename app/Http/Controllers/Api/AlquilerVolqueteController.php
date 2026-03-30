<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alquiler;
use App\Models\DineroMovimiento;
use App\Models\Movimiento;
use App\Models\Volquete;
use App\Models\AlquilerCerrado;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AlquilerVolqueteController extends Controller
{
    private const COSTO_SERVICIO_ARS = 52000;
    private int $umbralDias = 7;

    public function index()
    {
        $volquetes = Volquete::query()
            ->with(['alquilerActual'])
            ->orderBy('nombre')
            ->get();

        return $volquetes->map(fn (Volquete $v) => $this->dto($v))->values();
    }

    public function stats(Volquete $volquete)
    {
        $movimientosTotal = (int) $volquete->movimientos()->count();
        $trasladosTotal = (int) $volquete->movimientos()->where('tipo','traslado')->count();
        $colocacionesTotal = (int) $volquete->movimientos()->where('tipo','colocacion')->count();
        $retirosTotal = (int) $volquete->movimientos()->where('tipo','retiro')->count();
        $reemplazosTotal = (int) $volquete->movimientos()->where('nota', 'like', 'reemplazo%')->count();

        $alquileresTotal = (int) $volquete->alquileres()->count();
        $alquilerActivo = $volquete->alquileres()->whereNull('fecha_retiro')->exists();

        return response()->json([
            'id' => $volquete->id,
            'nombre' => $volquete->nombre,
            'esPrivado' => (bool) $volquete->es_privado,
            'movimientosTotal' => $movimientosTotal,
            'trasladosTotal' => $trasladosTotal,
            'colocacionesTotal' => $colocacionesTotal,
            'retirosTotal' => $retirosTotal,
            'reemplazosTotal' => $reemplazosTotal,
            'alquileresTotal' => $alquileresTotal,
            'alquilerActivo' => (bool) $alquilerActivo,
        ]);
    }

public function actualizarNota(Request $request, Volquete $volquete)
{
    $data = $request->validate([
        'nota' => ['nullable', 'string', 'max:500'],
    ]);
    $alquiler = $volquete->alquileres()->whereNull('fecha_retiro')->first();
    if ($alquiler) {
        $alquiler->update(['nota' => $data['nota'] ?? null]);
    }
    return response()->json($this->dto($volquete->fresh()->load('alquilerActual')));
}

    public function alquileres(Volquete $volquete)
    {
        if (!$volquete->es_privado) {
            return response()->json([]);
        }

        $items = $volquete->alquileres()
            ->orderBy('fecha_colocacion', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($a) {
                $inicio = $a->fecha_colocacion ? Carbon::parse($a->fecha_colocacion) : null;
                $fin = $a->fecha_retiro ? Carbon::parse($a->fecha_retiro) : null;
                $dias = null;
                if ($inicio) {
                    $dias = ($fin ?? now())->diffInDays($inicio);
                }
                return [
                    'id' => $a->id,
                    'fechaColocacion' => optional($a->fecha_colocacion)->format('Y-m-d'),
                    'fechaRetiro' => optional($a->fecha_retiro)->format('Y-m-d'),
                    'dias' => $dias,
                    'activo' => $a->fecha_retiro === null,
                    'direccion' => $a->direccion,
                    'cliente' => $a->cliente,
                    'lat' => (float) $a->lat,
                    'lng' => (float) $a->lng,
                    'nota' => $a->nota,
                ];
            })->values();

        return response()->json($items);
    }

    public function movimientos(Volquete $volquete)
    {
        $movs = $volquete->movimientos()
            ->orderBy('fecha', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($m) {
                return [
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
                ];
            })->values();

        return response()->json($movs);
    }

    public function colocar(Request $request, Volquete $volquete)
    {
        $data = $request->validate([
            'direccion' => ['required','string','max:255'],
            'cliente' => ['nullable','string','max:255'],
            'lat' => ['required','numeric'],
            'lng' => ['required','numeric'],
            'fecha' => ['nullable','date'],
            'motivo' => ['nullable','string','max:80'],
            'nota' => ['nullable','string','max:500'],
        ]);

        if (!$volquete->es_privado) {
            $prevDireccion = $volquete->direccion;
            $prevLat = $volquete->lat;
            $prevLng = $volquete->lng;

            Movimiento::create([
                'volquete_id' => $volquete->id,
                'fecha' => now()->toDateString(),
                'tipo' => 'traslado',
                'ubicacion_anterior' => $prevDireccion,
                'ubicacion_nueva' => $data['direccion'],
                'lat_anterior' => $prevLat,
                'lng_anterior' => $prevLng,
                'lat_nueva' => $data['lat'],
                'lng_nueva' => $data['lng'],
                'nota' => $data['nota'] ?? null,
            ]);

            $volquete->update([
                'direccion' => $data['direccion'],
                'lat' => $data['lat'],
                'lng' => $data['lng'],
            ]);

            return response()->json($this->dto($volquete->fresh()->load('alquilerActual')));
        }

        $abierto = $volquete->alquileres()->whereNull('fecha_retiro')->exists();
        if ($abierto) {
            return response()->json(['message' => 'Este volquete ya tiene un alquiler activo. Primero retíralo.'], 409);
        }

        $fechaColoc = isset($data['fecha'])
            ? Carbon::parse($data['fecha'])->toDateString()
            : now()->toDateString();

        $alquiler = Alquiler::create([
            'volquete_id' => $volquete->id,
            'fecha_colocacion' => $fechaColoc,
            'fecha_retiro' => null,
            'direccion' => $data['direccion'],
            'cliente' => $data['cliente'] ?? null,
            'lat' => $data['lat'],
            'lng' => $data['lng'],
            'nota' => isset($data['motivo'])
                ? trim(($data['motivo'] ?? '') . (isset($data['nota']) ? (': ' . $data['nota']) : ''))
                : ($data['nota'] ?? null),
        ]);

        $volquete->update([
            'direccion' => $alquiler->direccion,
            'cliente' => $alquiler->cliente,
            'lat' => $alquiler->lat,
            'lng' => $alquiler->lng,
            'fecha_colocacion' => $alquiler->fecha_colocacion,
        ]);

        $movColoc = Movimiento::create([
            'volquete_id' => $volquete->id,
            'fecha' => $alquiler->fecha_colocacion,
            'tipo' => 'colocacion',
            'ubicacion_anterior' => null,
            'ubicacion_nueva' => $alquiler->direccion,
            'lat_anterior' => null,
            'lng_anterior' => null,
            'lat_nueva' => $alquiler->lat,
            'lng_nueva' => $alquiler->lng,
            'nota' => $alquiler->nota,
        ]);

        $match = [
            'volquete_id' => $volquete->id,
            'alquiler_id' => $alquiler->id,
            'fecha' => $alquiler->fecha_colocacion,
            'concepto' => 'colocacion',
        ];

        $existente = DineroMovimiento::where($match)->first();
        if ($existente) {
            $existente->update([
                'monto_ars' => (int) $existente->monto_ars + self::COSTO_SERVICIO_ARS,
                'nota' => 'colocación (auto)',
                'movimiento_id' => $movColoc->id,
            ]);
        } else {
            DineroMovimiento::create([
                'monto_ars' => self::COSTO_SERVICIO_ARS,
                'nota' => 'colocación (auto)',
                'movimiento_id' => $movColoc->id,
                ...$match,
            ]);
        }

        return response()->json($this->dto($volquete->fresh()->load('alquilerActual')));
    }

    public function reemplazar(Request $request, Volquete $volquete)
    {
        $data = $request->validate([
            'direccion' => ['nullable','string','max:255'],
            'lat' => ['nullable','numeric'],
            'lng' => ['nullable','numeric'],
            'nota' => ['nullable','string','max:500'],
        ]);

        $direccion = $data['direccion'] ?? $volquete->direccion;
        $lat = array_key_exists('lat', $data) ? $data['lat'] : $volquete->lat;
        $lng = array_key_exists('lng', $data) ? $data['lng'] : $volquete->lng;

        $movReemp = Movimiento::create([
            'volquete_id' => $volquete->id,
            'fecha' => now()->toDateString(),
            'tipo' => 'traslado',
            'ubicacion_anterior' => $volquete->direccion,
            'ubicacion_nueva' => $direccion,
            'lat_anterior' => $volquete->lat,
            'lng_anterior' => $volquete->lng,
            'lat_nueva' => $lat,
            'lng_nueva' => $lng,
            'nota' => trim('reemplazo' . (isset($data['nota']) && $data['nota'] !== '' ? (': ' . $data['nota']) : '')),
        ]);

        if ($volquete->es_privado) {
            $alquilerActivo = $volquete->alquileres()->whereNull('fecha_retiro')->first();

            if ($alquilerActivo) {
                $match = [
                    'volquete_id' => $volquete->id,
                    'alquiler_id' => $alquilerActivo->id,
                    'fecha' => now()->toDateString(),
                    'concepto' => 'reemplazo',
                ];

                $existente = DineroMovimiento::where($match)->first();
                if ($existente) {
                    $existente->update([
                        'monto_ars' => (int) $existente->monto_ars + self::COSTO_SERVICIO_ARS,
                        'nota' => 'reemplazo (auto)',
                        'movimiento_id' => $movReemp->id,
                    ]);
                } else {
                    DineroMovimiento::create([
                        'monto_ars' => self::COSTO_SERVICIO_ARS,
                        'nota' => 'reemplazo (auto)',
                        'movimiento_id' => $movReemp->id,
                        ...$match,
                    ]);
                }
            }
        }

        $updates = [];
        if ($direccion !== null) $updates['direccion'] = $direccion;
        if ($lat !== null) $updates['lat'] = $lat;
        if ($lng !== null) $updates['lng'] = $lng;

        if (!$volquete->es_privado) {
            $updates['fecha_colocacion'] = now()->toDateString();
        }

        if (!empty($updates)) {
            $volquete->update($updates);
        }

        return response()->json($this->dto($volquete->fresh()->load('alquilerActual')));
    }

    public function retirar(Request $request, Volquete $volquete)
    {
        if (!$volquete->es_privado) {
            return response()->json([
                'message' => 'Este volquete es no privado: no tiene flujo de retirar (alquiler). Solo registrá traslados.'
            ], 409);
        }

        $data = $request->validate([
            'fecha' => ['nullable','date'],
            'motivo' => ['nullable','string','max:80'],
            'nota' => ['nullable','string','max:500'],
        ]);

        $alquiler = $volquete->alquileres()->whereNull('fecha_retiro')->first();
        if (!$alquiler) {
            return response()->json(['message' => 'Este volquete no tiene un alquiler activo para retirar.'], 409);
        }

        $alquiler->update([
            'fecha_retiro' => isset($data['fecha']) ? Carbon::parse($data['fecha'])->toDateString() : now()->toDateString(),
            'nota' => $data['nota'] ?? $alquiler->nota,
        ]);

        Movimiento::create([
            'volquete_id' => $volquete->id,
            'fecha' => $alquiler->fecha_retiro,
            'tipo' => 'retiro',
            'ubicacion_anterior' => $alquiler->direccion,
            'ubicacion_nueva' => null,
            'lat_anterior' => $alquiler->lat,
            'lng_anterior' => $alquiler->lng,
            'lat_nueva' => null,
            'lng_nueva' => null,
            'nota' => $alquiler->nota,
        ]);

        $inicio = Carbon::parse($alquiler->fecha_colocacion);
        $fin = Carbon::parse($alquiler->fecha_retiro);
        $dias = $fin->diffInDays($inicio);

        $dineroAlquiler = (int) DineroMovimiento::where('alquiler_id', $alquiler->id)->sum('monto_ars');

        $reemplazosAlquiler = (int) Movimiento::where('volquete_id', $volquete->id)
            ->where('nota', 'like', 'reemplazo%')
            ->whereDate('fecha', '>=', $alquiler->fecha_colocacion)
            ->whereDate('fecha', '<=', $alquiler->fecha_retiro)
            ->count();

        AlquilerCerrado::updateOrCreate(
            ['alquiler_id' => $alquiler->id],
            [
                'volquete_id' => $volquete->id,
                'fecha_colocacion' => $alquiler->fecha_colocacion,
                'fecha_retiro' => $alquiler->fecha_retiro,
                'dias' => $dias,
                'direccion' => $alquiler->direccion,
                'cliente' => $alquiler->cliente,
                'lat' => $alquiler->lat,
                'lng' => $alquiler->lng,
                'nota' => $alquiler->nota,
                'reemplazos_total' => $reemplazosAlquiler,
                'dinero_total_ars' => $dineroAlquiler,
            ]
        );

        return response()->json($this->dto($volquete->fresh()->load('alquilerActual')));
    }

    public function destroy(Volquete $volquete)
    {
        $abierto = $volquete->alquileres()->whereNull('fecha_retiro')->exists();
        if ($abierto) {
            return response()->json(['message' => 'No se puede eliminar: tiene un alquiler activo. Retíralo primero.'], 409);
        }

        $volquete->delete();
        return response()->noContent();
    }

    private function dto(Volquete $v): array
    {
        $a = $v->alquilerActual;
        $dias = null;
        $vencido = false;

        if ($a) {
            $dias = Carbon::parse($a->fecha_colocacion)->diffInDays(now());
            $vencido = $dias > $this->umbralDias;
        }

        $movimientosTotal = (int) $v->movimientos()->count();
        $trasladosTotal   = (int) $v->movimientos()->where('tipo', 'traslado')->count();
        $reemplazosTotal  = (int) $v->movimientos()->where('nota', 'like', 'reemplazo%')->count();
        $dineroTotal = (int) DineroMovimiento::where('volquete_id', $v->id)->sum('monto_ars');

        return [
            'id' => $v->id,
            'nombre' => $v->nombre,
            'esPrivado' => (bool) $v->es_privado,
            'movimientosTotal' => $movimientosTotal,
            'trasladosTotal' => $trasladosTotal,
            'reemplazosTotal' => $reemplazosTotal,
            'dineroTotalArs' => $dineroTotal,
            'colocado' => $v->es_privado ? (bool) $a : (bool) ($v->direccion ?? false),
            'fechaColocacion' => $a
                ? optional($a->fecha_colocacion)->format('Y-m-d')
                : optional($v->fecha_colocacion)->format('Y-m-d'),
            'lat' => $a ? (float) $a->lat : (float) $v->lat,
            'lng' => $a ? (float) $a->lng : (float) $v->lng,
            'direccion' => $a ? $a->direccion : ($v->direccion ?? null),
            'cliente' => $a ? $a->cliente : ($v->cliente ?? null),
            'alquilerActual' => $a ? [
                'id' => $a->id,
                'fechaColocacion' => optional($a->fecha_colocacion)->format('Y-m-d'),
                'fechaRetiro' => optional($a->fecha_retiro)->format('Y-m-d'),
                'direccion' => $a->direccion,
                'cliente' => $a->cliente,
                'lat' => (float) $a->lat,
                'lng' => (float) $a->lng,
                'nota' => $a->nota,
            ] : null,
            'dias' => $dias,
            'vencido' => $vencido,
            'umbralDias' => $this->umbralDias,
        ];
    }

    public function crearVolquete(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:50'],
            'lat' => ['nullable', 'numeric'],
            'lng' => ['nullable', 'numeric'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'cliente' => ['nullable', 'string', 'max:255'],
            'esPrivado' => ['nullable','boolean'],
        ]);

        $esPrivado = (bool) ($data['esPrivado'] ?? true);

        $volquete = Volquete::create([
            'nombre' => $data['nombre'],
            'lat' => $data['lat'] ?? null,
            'lng' => $data['lng'] ?? null,
            'direccion' => $data['direccion'] ?? null,
            'cliente' => $esPrivado ? ($data['cliente'] ?? null) : null,
            'fecha_colocacion' => $esPrivado ? null : now()->toDateString(),
            'es_privado' => $esPrivado,
        ]);

        if (!$esPrivado) {
            Movimiento::create([
                'volquete_id' => $volquete->id,
                'fecha' => now()->toDateString(),
                'tipo' => 'colocacion',
                'ubicacion_anterior' => null,
                'ubicacion_nueva' => $volquete->direccion,
                'lat_anterior' => null,
                'lng_anterior' => null,
                'lat_nueva' => $volquete->lat,
                'lng_nueva' => $volquete->lng,
                'nota' => 'Alta (público)',
            ]);
        }

        return response()->json($this->dto($volquete->fresh()->load('alquilerActual')), 201);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Volquete;
use App\Models\Movimiento;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardMunicipalesStatsController extends Controller
{
    public function __invoke(Request $request)
    {
        $days = (int) ($request->query('days', 30));
        $from = Carbon::today()->subDays($days);

        // IDs de volquetes municipales
        $municipalesIds = Volquete::where('es_privado', false)->pluck('id');

        // Total y por estado
        $total = Volquete::where('es_privado', false)->count();

        $porEstado = Volquete::where('es_privado', false)
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->pluck('total', 'estado')
            ->toArray();

        $getEstado = fn(string $k) => (int)($porEstado[$k] ?? 0);
        $colocadosHoy = Volquete::where('es_privado', false)
            ->whereDate('fecha_colocacion', Carbon::today())
            ->count();

        // ── Top volquetes por cantidad de movimientos en el período ──
        $topMovimientos = Movimiento::whereIn('volquete_id', $municipalesIds)
            ->whereDate('fecha', '>=', $from)
            ->select('volquete_id', DB::raw('COUNT(*) as total'))
            ->groupBy('volquete_id')
            ->orderByDesc('total')
            ->take(8)
            ->get()
            ->map(function ($row) {
                $nombre = Volquete::find($row->volquete_id)?->nombre ?? $row->volquete_id;
                return ['name' => $nombre, 'value' => (int) $row->total];
            });

        // ── Distribución de tipos de movimiento ──
        $tiposMovimiento = Movimiento::whereIn('volquete_id', $municipalesIds)
            ->whereDate('fecha', '>=', $from)
            ->select('tipo', DB::raw('COUNT(*) as total'))
            ->groupBy('tipo')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => ['name' => $r->tipo, 'value' => (int) $r->total]);

        // ── Movimientos por día (actividad operativa) ──
        $movsPorDiaRaw = Movimiento::whereIn('volquete_id', $municipalesIds)
            ->whereDate('fecha', '>=', $from)
            ->selectRaw('DATE(fecha) as day, COUNT(*) as total')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->pluck('total', 'day')
            ->toArray();

        $actividadLabels = [];
        $actividadValues = [];
        for ($i = $days; $i >= 0; $i--) {
            $d = Carbon::today()->subDays($i)->toDateString();
            $actividadLabels[] = $d;
            $actividadValues[] = (int)($movsPorDiaRaw[$d] ?? 0);
        }

        // ── Volquetes con más días colocados actualmente ──
        $mastiempoColocados = Volquete::where('es_privado', false)
            ->whereNotNull('fecha_colocacion')
            ->orderBy('fecha_colocacion', 'asc')
            ->take(8)
            ->get()
            ->map(fn($v) => [
                'name' => $v->nombre,
                'value' => (int) Carbon::parse($v->fecha_colocacion)->diffInDays(Carbon::today()),
                'direccion' => $v->direccion,
                'cliente' => $v->cliente,
            ]);

        // ── Últimos movimientos ──
        $ultimosMovs = Movimiento::whereIn('volquete_id', $municipalesIds)
            ->orderByDesc('fecha')
            ->take(10)
            ->get()
            ->map(fn($m) => [
                'id' => $m->id,
                'fecha' => $m->fecha,
                'tipo' => $m->tipo,
                'volquete' => Volquete::find($m->volquete_id)?->nombre ?? $m->volquete_id,
                'ubicacion_nueva' => $m->ubicacion_nueva,
                'nota' => $m->nota,
            ]);

        // ── Municipales colocados actualmente ──
        $municipalesColocados = Volquete::where('es_privado', false)
            ->whereNotNull('fecha_colocacion')
            ->orderByDesc('fecha_colocacion')
            ->take(10)
            ->get()
            ->map(fn($v) => [
                'id' => $v->id,
                'nombre' => $v->nombre,
                'direccion' => $v->direccion,
                'cliente' => $v->cliente,
                'fecha_colocacion' => $v->fecha_colocacion,
                'dias_colocado' => (int) Carbon::parse($v->fecha_colocacion)->diffInDays(Carbon::today()),
            ]);

        $totalMovsPeriodo = array_sum($actividadValues);

        return response()->json([
            'cards' => [
                ['label' => 'Volquetes municipales', 'value' => $total],
                ['label' => 'Disponibles', 'value' => $getEstado('disponible')],
                ['label' => 'Ocupados', 'value' => $getEstado('ocupado')],
                ['label' => 'Colocados hoy', 'value' => $colocadosHoy],
                ['label' => "Movimientos {$days}d", 'value' => $totalMovsPeriodo],
            ],
            'charts' => [
                'actividad' => [
                    'labels' => $actividadLabels,
                    'values' => $actividadValues,
                ],
                'estadoVolquetes' => [
                    'labels' => array_keys($porEstado),
                    'values' => array_values($porEstado),
                ],
                'tiposMovimiento' => [
                    'labels' => $tiposMovimiento->pluck('name')->toArray(),
                    'values' => $tiposMovimiento->pluck('value')->toArray(),
                ],
                'topMovimientos' => [
                    'labels' => $topMovimientos->pluck('name')->toArray(),
                    'values' => $topMovimientos->pluck('value')->toArray(),
                ],
                'mastiempoColocados' => [
                    'labels' => $mastiempoColocados->pluck('name')->toArray(),
                    'values' => $mastiempoColocados->pluck('value')->toArray(),
                ],
            ],
            'tables' => [
                'ultimosMovimientos' => $ultimosMovs,
                'municipalesColocados' => $municipalesColocados,
            ],
        ]);
    }
}
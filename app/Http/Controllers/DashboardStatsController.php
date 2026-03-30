<?php

namespace App\Http\Controllers;

use App\Models\Volquete;
use App\Models\Movimiento;
use App\Models\Alquiler;
use App\Models\DineroMovimiento;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardStatsController extends Controller
{
    public function __invoke(Request $request)
    {
        $days = (int) ($request->query('days', 30));
        $from = Carbon::today()->subDays($days);

        // ---- Volquetes
        $volquetesTotal = Volquete::count();
        $volquetesPorEstado = Volquete::select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')->pluck('total', 'estado');
        $privados = Volquete::where('es_privado', true)->count();
        $noPrivados = Volquete::where('es_privado', false)->count();

        // ---- Alquileres activos
        $alquileresActivos = Alquiler::whereNull('fecha_retiro')->count();

        // ---- Ingresos por día
        $ingresosRaw = DineroMovimiento::whereDate('fecha', '>=', $from)
            ->selectRaw('fecha as day, SUM(monto_ars) as total')
            ->groupBy('day')->orderBy('day')->get();
        $map = $ingresosRaw->pluck('total', 'day')->toArray();
        $labels = []; $values = [];
        for ($i = $days; $i >= 0; $i--) {
            $d = Carbon::today()->subDays($i)->toDateString();
            $labels[] = $d;
            $values[] = (int)($map[$d] ?? 0);
        }
        $ingresoPeriodo = array_sum($values);

        // ---- Donut por concepto
        $porConcepto = DineroMovimiento::whereDate('fecha', '>=', $from)
            ->select('concepto', DB::raw('SUM(monto_ars) as total'))
            ->groupBy('concepto')->pluck('total', 'concepto')->toArray();
        $conceptos = ['colocacion', 'reemplazo'];
        $conceptoValues = array_map(fn($c) => (int)($porConcepto[$c] ?? 0), $conceptos);

        // ---- Últimos movimientos
        $ultimosMovs = Movimiento::with('volquete')
            ->orderByDesc('fecha')->take(10)->get()
            ->map(fn($m) => [
                'id' => $m->id, 'fecha' => $m->fecha, 'tipo' => $m->tipo,
                'volquete' => $m->volquete?->nombre ?? $m->volquete_id,
                'ubicacion_nueva' => $m->ubicacion_nueva, 'nota' => $m->nota,
            ]);

        // ---- Alquileres activos list
        $alquileresList = Alquiler::whereNull('fecha_retiro')
            ->orderByDesc('fecha_colocacion')->take(10)->get()
            ->map(fn($a) => [
                'id' => $a->id, 'cliente' => $a->cliente, 'direccion' => $a->direccion,
                'volquete_id' => $a->volquete_id, 'fecha_colocacion' => $a->fecha_colocacion,
                'dias_activo' => Carbon::parse($a->fecha_colocacion)->diffInDays(Carbon::today()),
                'nota' => $a->nota,
            ]);

        // ---- Alquileres cerrados en el período
        $alquileresCerrados = DB::table('alquileres_cerrados')
            ->whereDate('fecha_retiro', '>=', $from)
            ->orderByDesc('fecha_retiro')
            ->take(20)
            ->get()
            ->map(fn($a) => [
                'id'               => $a->id,
                'alquiler_id'      => $a->alquiler_id ?? null,
                'volquete_id'      => $a->volquete_id ?? null,
                'fecha_colocacion' => $a->fecha_colocacion ?? null,
                'fecha_retiro'     => $a->fecha_retiro ?? null,
                'dias'             => $a->dias ?? null,
                'direccion'        => $a->direccion ?? null,
                'cliente'          => $a->cliente ?? null,
                'nota'             => $a->nota ?? null,
                'reemplazos_total' => $a->reemplazos_total ?? 0,
                'dinero_total_ars' => $a->dinero_total_ars ?? 0,
            ]);

        // ---- Stats de alquileres cerrados en el período
        $cerradosStats = DB::table('alquileres_cerrados')
            ->whereDate('fecha_retiro', '>=', $from)
            ->selectRaw('COUNT(*) as total, SUM(dinero_total_ars) as ingresos_total, AVG(dias) as dias_promedio, MAX(dias) as dias_max')
            ->first();

        $getEstado = fn(string $k) => (int)($volquetesPorEstado[$k] ?? 0);

        return response()->json([
            'cards' => [
                ['label' => 'Volquetes', 'value' => $volquetesTotal],
                ['label' => 'Disponibles', 'value' => $getEstado('disponible')],
                ['label' => 'Ocupados', 'value' => $getEstado('ocupado')],
                ['label' => 'En tránsito', 'value' => $getEstado('en_transito')],
                ['label' => 'Mantenimiento', 'value' => $getEstado('mantenimiento')],
                ['label' => "Ingresos {$days}d (ARS)", 'value' => $ingresoPeriodo],
            ],
            'charts' => [
                'ingresos' => ['labels' => $labels, 'values' => $values],
                'estadoVolquetes' => [
                    'labels' => array_keys($volquetesPorEstado->toArray()),
                    'values' => array_values($volquetesPorEstado->toArray()),
                ],
                'conceptoDinero' => ['labels' => $conceptos, 'values' => $conceptoValues],
                'privados' => ['labels' => ['Privados', 'No privados'], 'values' => [$privados, $noPrivados]],
            ],
            'tables' => [
                'ultimosMovimientos' => $ultimosMovs,
                'alquileresActivos'  => $alquileresList,
                'alquileresCerrados' => $alquileresCerrados,
            ],
            'cerradosStats' => [
                'total'         => (int)($cerradosStats->total ?? 0),
                'ingresos_total'=> (float)($cerradosStats->ingresos_total ?? 0),
                'dias_promedio' => round((float)($cerradosStats->dias_promedio ?? 0), 1),
                'dias_max'      => (int)($cerradosStats->dias_max ?? 0),
            ],
        ]);
    }
}
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PuntosSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $volquetes = [

            // ─────────────────────────────────────────
            //  PRIVADOS (5)
            // ─────────────────────────────────────────
            [
                'nombre'          => 'Punto Privado - Barrio Centro',
                'estado'          => 'disponible',
                'lat'             => -39.2831,
                'lng'             => -65.6612,
                'direccion'       => 'San Martín 450, Choele Choel',
                'cliente'         => 'privado',
                'fecha_colocacion'=> '2024-03-15',
                'es_privado'      => 1,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'nombre'          => 'Punto Privado - Av. Roca',
                'estado'          => 'disponible',
                'lat'             => -39.2795,
                'lng'             => -65.6580,
                'direccion'       => 'Av. Roca 1230, Choele Choel',
                'cliente'         => 'privado',
                'fecha_colocacion'=> '2024-05-20',
                'es_privado'      => 1,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'nombre'          => 'Punto Privado - Barrio Norte',
                'estado'          => 'disponible',
                'lat'             => -39.2748,
                'lng'             => -65.6645,
                'direccion'       => 'Perito Moreno 870, Choele Choel',
                'cliente'         => 'privado',
                'fecha_colocacion'=> '2024-07-10',
                'es_privado'      => 1,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'nombre'          => 'Punto Privado - Villa Unión Sur',
                'estado'          => 'disponible',
                'lat'             => -39.2950,
                'lng'             => -65.6700,
                'direccion'       => 'Avellaneda 320, Barrio Villa Unión Sur',
                'cliente'         => 'privado',
                'fecha_colocacion'=> '2024-09-05',
                'es_privado'      => 1,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'nombre'          => 'Punto Privado - Barrio Las Bardas',
                'estado'          => 'disponible',
                'lat'             => -39.2880,
                'lng'             => -65.6530,
                'direccion'       => 'Irigoyen 155, Barrio Las Bardas',
                'cliente'         => 'privado',
                'fecha_colocacion'=> '2024-11-18',
                'es_privado'      => 1,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],

            // ─────────────────────────────────────────
            //  MUNICIPALES (5)
            // ─────────────────────────────────────────
            [
                'nombre'          => 'Punto Municipal - Plaza Central',
                'estado'          => 'disponible',
                'lat'             => -39.2867,
                'lng'             => -65.6633,
                'direccion'       => 'Plaza San Martín, Choele Choel',
                'cliente'         => 'municipal',
                'fecha_colocacion'=> null,
                'es_privado'      => 0,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'nombre'          => 'Punto Municipal - Terminal de Ómnibus',
                'estado'          => 'disponible',
                'lat'             => -39.2820,
                'lng'             => -65.6590,
                'direccion'       => 'Mansilla 600, Choele Choel',
                'cliente'         => 'municipal',
                'fecha_colocacion'=> null,
                'es_privado'      => 0,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'nombre'          => 'Punto Municipal - Acceso Sur RN 22',
                'estado'          => 'disponible',
                'lat'             => -39.3020,
                'lng'             => -65.6660,
                'direccion'       => 'Ruta Nacional 22, Acceso Sur',
                'cliente'         => 'municipal',
                'fecha_colocacion'=> null,
                'es_privado'      => 0,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'nombre'          => 'Punto Municipal - Barrio Rosa Maldonado',
                'estado'          => 'disponible',
                'lat'             => -39.2910,
                'lng'             => -65.6750,
                'direccion'       => 'Francisco Bonavita 210, B° Rosa Maldonado',
                'cliente'         => 'municipal',
                'fecha_colocacion'=> null,
                'es_privado'      => 0,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
            [
                'nombre'          => 'Punto Municipal - Costanera del Río Negro',
                'estado'          => 'disponible',
                'lat'             => -39.2760,
                'lng'             => -65.6620,
                'direccion'       => 'Costanera s/n, Río Negro, Choele Choel',
                'cliente'         => 'municipal',
                'fecha_colocacion'=> null,
                'es_privado'      => 0,
                'created_at'      => $now,
                'updated_at'      => $now,
            ],
        ];

        DB::table('volquetes')->insert($volquetes);
    }
}
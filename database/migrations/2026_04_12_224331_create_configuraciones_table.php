<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tipos_volquete', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->integer('precio_servicio_ars')->default(52000);
            $table->timestamps();
        });

        DB::table('tipos_volquete')->insert([
            'nombre' => 'estandar',
            'precio_servicio_ars' => 52000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('tipos_volquete');
    }
};
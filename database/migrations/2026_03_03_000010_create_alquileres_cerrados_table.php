<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('alquileres_cerrados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alquiler_id')->constrained('alquileres')->cascadeOnDelete();
            $table->foreignId('volquete_id')->constrained('volquetes')->cascadeOnDelete();
            $table->date('fecha_colocacion');
            $table->date('fecha_retiro');
            $table->integer('dias')->nullable();
            $table->string('direccion')->nullable();
            $table->string('cliente')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->string('nota', 500)->nullable();
            $table->integer('reemplazos_total')->default(0);
            $table->integer('dinero_total_ars')->default(0);
            $table->timestamps();

            $table->unique('alquiler_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alquileres_cerrados');
    }
};
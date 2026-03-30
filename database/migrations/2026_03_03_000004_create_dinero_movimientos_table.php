<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('dinero_movimientos', function (Blueprint $table) {
            $table->id();
            $table->date('fecha');
            $table->enum('concepto', ['colocacion', 'reemplazo']);
            $table->integer('monto_ars');
            $table->string('nota', 500)->nullable();
            $table->foreignId('volquete_id')->nullable()->constrained('volquetes')->nullOnDelete();
            $table->foreignId('alquiler_id')->nullable()->constrained('alquileres')->nullOnDelete();
            $table->foreignId('movimiento_id')->nullable()->constrained('movimientos')->nullOnDelete();
            $table->timestamps();

            $table->index(['fecha', 'concepto']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dinero_movimientos');
    }
};
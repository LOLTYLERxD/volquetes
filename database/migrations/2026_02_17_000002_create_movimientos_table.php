<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('volquete_id')->constrained('volquetes')->onDelete('cascade');
            $table->date('fecha');
            $table->enum('tipo', ['colocacion','retiro','traslado']);
            $table->string('ubicacion_anterior')->nullable();
            $table->string('ubicacion_nueva')->nullable();
            $table->double('lat_anterior')->nullable();
            $table->double('lng_anterior')->nullable();
            $table->double('lat_nueva')->nullable();
            $table->double('lng_nueva')->nullable();
            $table->string('nota', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movimientos');
    }
};
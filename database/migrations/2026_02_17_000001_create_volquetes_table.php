<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('volquetes', function (Blueprint $table) {
$table->id();
            $table->string('nombre', 50)->unique();
            $table->enum('estado', ['disponible','ocupado','en_transito','mantenimiento'])->default('disponible');
            $table->double('lat');
            $table->double('lng');
            $table->string('direccion');
            $table->string('cliente')->nullable();
$table->date('fecha_colocacion')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('volquetes');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('alquileres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('volquete_id')->constrained('volquetes')->onDelete('cascade');
            $table->date('fecha_colocacion');
            $table->date('fecha_retiro')->nullable();
            $table->string('direccion', 255);
            $table->string('cliente', 255)->nullable();
            $table->decimal('lat', 10, 7);
            $table->decimal('lng', 10, 7);
            $table->string('nota', 500)->nullable();
            $table->timestamps();

            $table->index(['volquete_id', 'fecha_retiro']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alquileres');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('galpon_stock', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('cantidad')->default(0);
            $table->timestamps();
        });

        // Seed del único registro
        DB::table('galpon_stock')->insert(['cantidad' => 0]);
    }

    public function down(): void
    {
        Schema::dropIfExists('galpon_stock');
    }
};
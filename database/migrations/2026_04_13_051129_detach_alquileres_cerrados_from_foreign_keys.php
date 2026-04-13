<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $database = DB::getDatabaseName();

        $fkAlquiler = DB::selectOne("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = 'alquileres_cerrados'
              AND COLUMN_NAME = 'alquiler_id'
              AND REFERENCED_TABLE_NAME IS NOT NULL
            LIMIT 1
        ", [$database]);

        if ($fkAlquiler) {
            DB::statement("ALTER TABLE alquileres_cerrados DROP FOREIGN KEY `{$fkAlquiler->CONSTRAINT_NAME}`");
        }

        $fkVolquete = DB::selectOne("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = 'alquileres_cerrados'
              AND COLUMN_NAME = 'volquete_id'
              AND REFERENCED_TABLE_NAME IS NOT NULL
            LIMIT 1
        ", [$database]);

        if ($fkVolquete) {
            DB::statement("ALTER TABLE alquileres_cerrados DROP FOREIGN KEY `{$fkVolquete->CONSTRAINT_NAME}`");
        }

        DB::statement("ALTER TABLE alquileres_cerrados MODIFY alquiler_id BIGINT UNSIGNED NULL");
        DB::statement("ALTER TABLE alquileres_cerrados MODIFY volquete_id BIGINT UNSIGNED NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE alquileres_cerrados MODIFY alquiler_id BIGINT UNSIGNED NOT NULL");
        DB::statement("ALTER TABLE alquileres_cerrados MODIFY volquete_id BIGINT UNSIGNED NOT NULL");

        $database = DB::getDatabaseName();

        $fkAlquiler = DB::selectOne("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = 'alquileres_cerrados'
              AND COLUMN_NAME = 'alquiler_id'
              AND REFERENCED_TABLE_NAME IS NOT NULL
            LIMIT 1
        ", [$database]);

        if (!$fkAlquiler) {
            DB::statement("
                ALTER TABLE alquileres_cerrados
                ADD CONSTRAINT alquileres_cerrados_alquiler_id_foreign
                FOREIGN KEY (alquiler_id) REFERENCES alquileres(id)
                ON DELETE CASCADE
            ");
        }

        $fkVolquete = DB::selectOne("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = 'alquileres_cerrados'
              AND COLUMN_NAME = 'volquete_id'
              AND REFERENCED_TABLE_NAME IS NOT NULL
            LIMIT 1
        ", [$database]);

        if (!$fkVolquete) {
            DB::statement("
                ALTER TABLE alquileres_cerrados
                ADD CONSTRAINT alquileres_cerrados_volquete_id_foreign
                FOREIGN KEY (volquete_id) REFERENCES volquetes(id)
                ON DELETE CASCADE
            ");
        }
    }
};
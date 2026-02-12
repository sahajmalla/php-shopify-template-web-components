<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRefreshTokenColumnsToSessions extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->text('refresh_token')->nullable()->after('access_token');
            $table->dateTime('refresh_token_expires_at')->nullable()->after('refresh_token');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropColumn('refresh_token');
            $table->dropColumn('refresh_token_expires_at');
        });
    }
}

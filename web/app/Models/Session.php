<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    use HasFactory;

    protected $casts = [
        'expires_at' => 'datetime',
        'refresh_token_expires_at' => 'datetime',
    ];
}

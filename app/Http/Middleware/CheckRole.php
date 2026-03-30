<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (! $request->user()) { abort(401); }
        if (! $request->user()->activo) {
            auth()->logout();
            return redirect()->route('login')->withErrors(['email' => 'Tu cuenta esta desactivada.']);
        }
        if ($request->user()->role !== $role) { abort(403, 'Sin permiso.'); }
        return $next($request);
    }
}

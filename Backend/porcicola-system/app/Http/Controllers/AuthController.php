<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $usuario = User::where('email', $datos['email'])->first();

        if (!$usuario || !Hash::check($datos['password'], $usuario->password)) {
            return response()->json([
                'message' => 'Credenciales incorrectas.',
            ], 401);
        }

        if (!$usuario->activo) {
            return response()->json([
                'message' => 'El usuario está inactivo.',
            ], 403);
        }

        return response()->json([
            'message' => 'Inicio de sesión correcto.',
            'user' => $this->formatearUsuario($usuario),
        ]);
    }

    public function logout(): JsonResponse
    {
        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    public function roles(): JsonResponse
    {
        return response()->json([
            'roles' => User::ROLES,
        ]);
    }

    private function formatearUsuario(User $usuario): array
    {
        return [
            'id' => $usuario->id,
            'name' => $usuario->name,
            'email' => $usuario->email,
            'role' => $usuario->role,
            'activo' => (bool) $usuario->activo,
        ];
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->requiereAdministrador($request);

        $usuarios = User::query()
            ->select('id', 'name', 'email', 'role', 'activo', 'created_at', 'updated_at')
            ->orderBy('id')
            ->get();

        return response()->json($usuarios);
    }

    public function store(Request $request): JsonResponse
    {
        $this->requiereAdministrador($request);

        $datos = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(User::ROLES)],
            'activo' => ['sometimes', 'boolean'],
        ]);

        $datos['activo'] = $datos['activo'] ?? true;

        $usuario = User::create($datos);

        return response()->json([
            'message' => 'Usuario creado correctamente.',
            'user' => $this->formatearUsuario($usuario),
        ], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->requiereAdministrador($request);

        $datos = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'required', Rule::in(User::ROLES)],
            'activo' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('password', $datos) && empty($datos['password'])) {
            unset($datos['password']);
        }

        $nuevoRol = $datos['role'] ?? $user->role;
        $nuevoActivo = array_key_exists('activo', $datos) ? (bool) $datos['activo'] : (bool) $user->activo;

        if ($user->role === User::ROLE_ADMINISTRADOR && ($nuevoRol !== User::ROLE_ADMINISTRADOR || !$nuevoActivo)) {
            $existeOtroAdminActivo = User::where('role', User::ROLE_ADMINISTRADOR)
                ->where('activo', true)
                ->where('id', '!=', $user->id)
                ->exists();

            if (!$existeOtroAdminActivo) {
                return response()->json([
                    'message' => 'No puedes dejar el sistema sin un administrador activo.',
                ], 422);
            }
        }

        $user->fill($datos);
        $user->save();

        return response()->json([
            'message' => 'Usuario actualizado correctamente.',
            'user' => $this->formatearUsuario($user),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->requiereAdministrador($request);

        if ($user->role === User::ROLE_ADMINISTRADOR) {
            $existeOtroAdminActivo = User::where('role', User::ROLE_ADMINISTRADOR)
                ->where('activo', true)
                ->where('id', '!=', $user->id)
                ->exists();

            if (!$existeOtroAdminActivo) {
                return response()->json([
                    'message' => 'No puedes desactivar el último administrador activo.',
                ], 422);
            }
        }

        $user->activo = false;
        $user->save();

        return response()->json([
            'message' => 'Usuario desactivado correctamente.',
            'user' => $this->formatearUsuario($user),
        ]);
    }

    private function requiereAdministrador(Request $request): void
    {
        if ($request->header('X-Porcys-Role') !== User::ROLE_ADMINISTRADOR) {
            abort(response()->json([
                'message' => 'Acceso denegado. Se requiere rol administrador.',
            ], 403));
        }
    }

    private function formatearUsuario(User $usuario): array
    {
        return [
            'id' => $usuario->id,
            'name' => $usuario->name,
            'email' => $usuario->email,
            'role' => $usuario->role,
            'activo' => (bool) $usuario->activo,
            'created_at' => $usuario->created_at,
            'updated_at' => $usuario->updated_at,
        ];
    }
}
<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\SignupRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Registra un usuario y devuelve token de Sanctum.
     */
    public function signup(SignupRequest $request)
    {
        $data = $request->validated();

        $user = \App\Models\User::create([
            'name'      => $data['name'],
            'email'     => $data['email'],
            'password'  => bcrypt($data['password']),
            'direccion' => $data['address'],
            'provincia' => $data['province'],
            'ciudad'    => $data['city'],
            'cp'        => $data['postal_code'],
            'admin'     => false,
            'cancelada' => false,
        ]);

        /** @var \App\Models\User $user */
        $newToken = $user->createToken('main');
        $token = $newToken->plainTextToken;


        return response([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    /**
     * Inicia sesión. Si la cuenta está cancelada, se bloquea el login.
     */
    public function login(LoginRequest $request)
    {
        $credentials = $request->validated();
        $remember = $credentials['remember'] ?? false;
        unset($credentials['remember']);

        if (!Auth::attempt($credentials, $remember)) {
            return response()->json([
                'errors' => [
                    'credentials' => ['Email o contraseña incorrectos.'],
                ],
            ], 422);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if ($user && $user->cancelada) {
            Auth::logout();
            return response()->json([
                'errors' => [
                    'account' => ['Tu cuenta está cancelada. Contacta con el administrador.
                    agdls03@gmail.com'],
                ],
            ], 403);
        }

        $newToken = $user->createToken('main');
        $token = $newToken->plainTextToken;


        return response([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    /**
     * Cierra sesión eliminando el token actual.
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();
        $token?->delete();

        return response([
            'success' => true,
        ]);
    }

    /**
     * Devuelve el usuario autenticado.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->valoracion_media = $user->valoracionMedia();
        }

        return response()->json($user);
    }

    /**
     * Actualiza el perfil del usuario autenticado.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'provincia' => 'nullable|string|max:255',
            'ciudad'    => 'nullable|string|max:255',
            'cp'        => 'nullable|string|max:20',
        ]);

        $user->fill($data);
        $user->save();

        return response()->json($user);
    }
}

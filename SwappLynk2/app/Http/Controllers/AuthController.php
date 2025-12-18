<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\SignupRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function signup(SignupRequest $request)
    {
        // Validamos los datos con el FormRequest (aquí ya vienen limpios y con reglas aplicadas)
        $data = $request->validated();

        // Creamos el usuario en base de datos
        // (password se guarda hasheado y los flags admin/cancelada se inicializan)
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

        // Generamos token personal de Sanctum para que el frontend pueda autenticar peticiones
        /** @var \App\Models\User $user */
        $newToken = $user->createToken('main');
        $token = $newToken->plainTextToken;

        // Devolvemos usuario + token (formato típico para login/signup en SPAs)
        return response([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    public function login(LoginRequest $request)
    {
        // Recuperamos credenciales validadas (email/ password / remember)
        $credentials = $request->validated();

        // "remember" no forma parte de las credenciales de Auth::attempt, lo separamos
        $remember = $credentials['remember'] ?? false;
        unset($credentials['remember']);

        // Intento de login: si falla devolvemos error 422 (front lo trata como error de formulario)
        if (!Auth::attempt($credentials, $remember)) {
            return response()->json([
                'errors' => [
                    'credentials' => ['Email o contraseña incorrectos.'],
                ],
            ], 422);
        }

        // Si el login es correcto, Auth::user() nos da el usuario autenticado
        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Regla del sistema: si la cuenta está cancelada, no puede iniciar sesión
        // Hacemos logout inmediato y devolvemos un 403 para indicar bloqueo
        if ($user && $user->cancelada) {
            Auth::logout();

            return response()->json([
                'errors' => [
                    'account' => ['Tu cuenta está cancelada. Contacta con el administrador.
                    agdls03@gmail.com'],
                ],
            ], 403);
        }

        // Generamos un token nuevo de Sanctum para esta sesión
        $newToken = $user->createToken('main');
        $token = $newToken->plainTextToken;

        // Devolvemos usuario + token para que el frontend lo guarde (localStorage/cookies, etc.)
        return response([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        // Obtenemos el usuario autenticado en esta request (si viene con token)
        $user = $request->user();

        // Con Sanctum, eliminamos solo el token actual (cierra sesión en este dispositivo)
        $token = $user?->currentAccessToken();
        $token?->delete();

        return response([
            'success' => true,
        ]);
    }

    public function me(Request $request)
    {
        // Devuelve el usuario asociado al token (si existe)
        $user = $request->user();

        // Añadimos un campo calculado para el frontend (no necesariamente guardado en BD)
        if ($user) {
            $user->valoracion_media = $user->valoracionMedia();
        }

        return response()->json($user);
    }

    public function updateProfile(Request $request)
    {
        // Usuario autenticado que está editando su perfil
        $user = $request->user();

        // Validación directa aquí porque es una actualización sencilla de perfil
        $data = $request->validate([
            'name'      => 'required|string|max:255',
            'direccion' => 'nullable|string|max:255',
            'provincia' => 'nullable|string|max:255',
            'ciudad'    => 'nullable|string|max:255',
            'cp'        => 'nullable|string|max:20',
        ]);

        // Rellenamos con los campos permitidos y guardamos cambios
        $user->fill($data);
        $user->save();

        // Devolvemos el usuario actualizado para refrescar el estado en el frontend
        return response()->json($user);
    }
}

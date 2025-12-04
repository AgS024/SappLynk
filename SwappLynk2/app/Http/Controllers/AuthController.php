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
        $data = $request->validated();
        
        /** @var \App\Models\User $user */
        $user = \App\Models\User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
            'direccion' => $data['address'],
            'provincia' => $data['province'],
            'ciudad' => $data['city'],
            'cp' => $data['postal_code'],
        ]);
        
        /** @var \Laravel\Sanctum\NewAccessToken $newToken */
        $newToken = $user->createToken('main');
        $token = $newToken->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function login(LoginRequest $request){
        $credentials = $request->validated();
        $remember = $credentials['remember'] ?? false;
        unset($credentials['remember']);

        if(!Auth::attempt($credentials, $remember)){
            return response([
                'error' => 'Las credenciales no son correctas'
            ], 422);
        }
        
        /** @var \App\Models\User $user */
        $user = Auth::user();
        
        /** @var \Laravel\Sanctum\NewAccessToken $newToken */
        $newToken = $user->createToken('main');
        $token = $newToken->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request){
        /** @var \App\Models\User|null $user */
        $user = $request->user();
        
        /** @var \Laravel\Sanctum\PersonalAccessToken|null $token */
        $token = $user?->currentAccessToken();
        $token?->delete();

        return response([
            'success' => true
        ]);
    }
}
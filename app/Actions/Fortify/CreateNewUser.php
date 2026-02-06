<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'nik' => ['required', 'string'], // NIK wajib diisi
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
            ],
            'password' => $this->passwordRules(),
        ])->validate();

        // Cari user berdasarkan NIK yang belum terdaftar
        $user = User::where('id', $input['nik'])
                    ->where('is_registered', false)
                    ->first();

        // Jika NIK tidak ditemukan atau sudah terdaftar
        if (!$user) {
            throw ValidationException::withMessages([
                'nik' => ['NIK tidak ditemukan atau sudah terdaftar.'],
            ]);
        }

        // Cek apakah email sudah digunakan di user lain yang sudah terdaftar
        $emailExists = User::where('email', $input['email'])
                           ->where('is_registered', true)
                           ->where('id', '!=', $user->id)
                           ->exists();

        if ($emailExists) {
            throw ValidationException::withMessages([
                'email' => ['Email sudah digunakan.'],
            ]);
        }

        // Update user dengan data registrasi
        $user->update([
            'name' => $input['name'],
            'email' => $input['email'],
            'email_verified_at' => now(),
            'password' => Hash::make($input['password']),
            'is_registered' => true,
        ]);

        return $user;
    }
}

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head, Link } from '@inertiajs/react';
import { IdCard, Lock, Mail, User, Languages } from 'lucide-react';
import { useState } from 'react';

// Komponen Ikon Google
const GoogleIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

// Definisi type bahasa
type Language = 'id' | 'en';

// Kamus terjemahan
const translations = {
  id: {
    brand: 'Indosat LMS',
    subtitle: 'Sistem Manajemen Pembelajaran',
    signIn: 'Masuk',
    signUp: 'Daftar',
    createAccount: 'Buat Akun',
    googleSignUp: 'Daftar dengan Google',
    or: 'Atau',
    name: {
      label: 'Nama Lengkap *',
      placeholder: 'Masukkan nama lengkap Anda'
    },
    employeeId: {
      label: 'ID Karyawan (Opsional)',
      placeholder: 'Masukkan ID karyawan'
    },
    email: {
      label: 'Alamat Email *',
      placeholder: 'nama@indosatooredoo.com'
    },
    password: {
      label: 'Kata Sandi *',
      placeholder: 'Buat kata sandi (min 8 karakter)'
    },
    confirmPassword: {
      label: 'Konfirmasi Kata Sandi *',
      placeholder: 'Konfirmasi kata sandi Anda'
    },
    signUpButton: 'Daftar',
    footer: {
      terms: 'Dengan mendaftar, Anda menyetujui Syarat Layanan kami',
      link: 'Sudah punya akun? Masuk'
    }
  },
  en: {
    brand: 'Indosat LMS',
    subtitle: 'Learning Management System',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    createAccount: 'Create Account',
    googleSignUp: 'Sign Up with Google',
    or: 'Or',
    name: {
        label: 'Full Name *',
        placeholder: 'Enter your full name'
    },
    employeeId: {
        label: 'Employee ID (Optional)',
        placeholder: 'Enter employee ID'
    },
    email: {
        label: 'Email address *',
        placeholder: 'name@indosatooredoo.com'
    },
    password: {
        label: 'Password *',
        placeholder: 'Create a password (min 8 chars)'
    },
    confirmPassword: {
        label: 'Confirm Password *',
        placeholder: 'Confirm your password'
    },
    signUpButton: 'Sign Up',
    footer: {
        terms: 'By signing up, you agree to our Terms of Service',
        link: 'Already have an account? Sign In'
    }
  }
};

export default function Register() {
    const [lang, setLang] = useState<Language>('id');
    const t = translations[lang];

    const toggleLang = () => {
        setLang(prev => prev === 'id' ? 'en' : 'id');
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-600 dark:bg-gray-950 p-4 relative transition-colors duration-300">
            <Head title="Register" />

            {/* Language Switcher */}
             <button 
                onClick={toggleLang}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors flex items-center space-x-1 backdrop-blur-sm z-50"
            >
                <Languages className="w-5 h-5" />
                <span className="text-sm font-medium">{lang === 'id' ? 'ID' : 'EN'}</span>
            </button>


            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
                {/* Logo Section */}
                <div className="mb-8 text-center">
                    <div className="inline-block mb-4 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl w-full">
                        <h1 className="text-3xl font-bold text-red-600 dark:text-red-500">{t.brand}</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400 font-medium">{t.subtitle}</p>
                    </div>
                </div>

                {/* Register Card */}
                <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                    {/* Toggle Tabs (Visual only, acting as links) */}
                    <div className="mb-8 flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                        <Link
                            href={login.url()}
                            className="flex-1 py-3 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
                        >
                            <div className="text-center font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                {t.signIn}
                            </div>
                        </Link>
                        <div className="flex-1 rounded-lg bg-white dark:bg-gray-700 py-3 shadow-sm transition-all">
                            <div className="text-center font-bold text-red-600 dark:text-red-400">
                                {t.signUp}
                            </div>
                        </div>
                    </div>

                    <h2 className="mb-8 text-center text-2xl font-bold text-gray-800 dark:text-white">
                        {t.createAccount}
                    </h2>

                    {/* Google Login Section */}
                    <div className="mb-6">
                        <a
                            href="/login/google" 
                            className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-3 font-semibold rounded-lg shadow-sm"
                        >
                            <GoogleIcon className="w-5 h-5" />
                            <span>{t.googleSignUp}</span>
                        </a>

                        <div className="relative mt-6 mb-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white dark:bg-gray-900 px-4 text-gray-500 dark:text-gray-400">
                                    {t.or}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password', 'password_confirmation']}
                        disableWhileProcessing
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-gray-700 dark:text-gray-300 font-semibold">{t.name.label}</Label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400 group-focus-within:text-red-600 transition-colors">
                                                <User size={20} />
                                            </div>
                                            <Input
                                                id="name"
                                                type="text"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="name"
                                                name="name"
                                                placeholder={t.name.placeholder}
                                                className="h-12 pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 rounded-lg transition-all"
                                            />
                                        </div>
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="employee_id" className="text-gray-700 dark:text-gray-300 font-semibold">{t.employeeId.label}</Label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400 group-focus-within:text-red-600 transition-colors">
                                                <IdCard size={20} />
                                            </div>
                                            <Input
                                                id="employee_id"
                                                type="text"
                                                tabIndex={2}
                                                autoComplete="off"
                                                name="employee_id"
                                                placeholder={t.employeeId.placeholder}
                                                className="h-12 pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 rounded-lg transition-all"
                                            />
                                        </div>
                                        <InputError message={errors.employee_id} className="mt-1" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-semibold">{t.email.label}</Label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400 group-focus-within:text-red-600 transition-colors">
                                                <Mail size={20} />
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                tabIndex={3}
                                                autoComplete="email"
                                                name="email"
                                                placeholder={t.email.placeholder}
                                                className="h-12 pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 rounded-lg transition-all"
                                            />
                                        </div>
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-semibold">{t.password.label}</Label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400 group-focus-within:text-red-600 transition-colors">
                                                <Lock size={20} />
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                required
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                name="password"
                                                placeholder={t.password.placeholder}
                                                className="h-12 pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 rounded-lg transition-all"
                                            />
                                        </div>
                                        <InputError message={errors.password} className="mt-1" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation" className="text-gray-700 dark:text-gray-300 font-semibold">{t.confirmPassword.label}</Label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400 group-focus-within:text-red-600 transition-colors">
                                                <Lock size={20} />
                                            </div>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                required
                                                tabIndex={5}
                                                autoComplete="new-password"
                                                name="password_confirmation"
                                                placeholder={t.confirmPassword.placeholder}
                                                className="h-12 pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 rounded-lg transition-all"
                                            />
                                        </div>
                                        <InputError message={errors.password_confirmation} className="mt-1" />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-600/25 transition-all duration-300 rounded-lg"
                                        tabIndex={6}
                                        data-test="register-user-button"
                                    >
                                        {processing && <Spinner className="mr-2 text-white" />}
                                        {t.signUpButton}
                                    </Button>
                                </div>
                                <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
                                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                        {t.footer.terms}
                                    </p>
                                    <div className="mt-4 text-center">
                                        <Link
                                            href={login.url()}
                                            className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                        >
                                            {t.footer.link}
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}

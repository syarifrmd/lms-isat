import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head, Link } from '@inertiajs/react';
import { Lock, Mail, Languages } from 'lucide-react';
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
    welcome: 'Selamat Datang Kembali',
    email: {
      label: 'Alamat Email',
      placeholder: 'nama@indosatooredoo.com'
    },
    password: {
      label: 'Kata Sandi',
      placeholder: 'Masukkan kata sandi Anda',
      forgot: 'Lupa kata sandi?'
    },
    remember: 'Ingat saya',
    loginButton: 'Masuk',
    footer: {
      text: 'Gunakan kredensial email Indosat Anda untuk masuk',
      link: 'Belum punya akun? Daftar'
    }
  },
  en: {
    brand: 'Indosat LMS',
    subtitle: 'Learning Management System',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    welcome: 'Welcome Back',
    email: {
        label: 'Email Address',
        placeholder: 'name@indosatooredoo.com'
    },
    password: {
        label: 'Password',
        placeholder: 'Enter your password',
        forgot: 'Forgot password?'
    },
    remember: 'Remember me',
    loginButton: 'Login',
    footer: {
        text: 'Use your Indosat email credentials to sign in',
        link: "Don't have an account? Sign Up"
    }
  }
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    const [lang, setLang] = useState<Language>('id');
    const t = translations[lang];

    const toggleLang = () => {
        setLang(prev => prev === 'id' ? 'en' : 'id');
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-600 dark:bg-gray-950 p-4 relative transition-colors duration-300">
            <Head title="Log in" />

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

                {/* Login Card */}
                <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                    {status && (
                        <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-900/30 p-4 border border-green-200 dark:border-green-800">
                            <div className="text-sm font-medium text-green-700 dark:text-green-400 text-center">
                                {status}
                            </div>
                        </div>
                    )}

                    {/* Toggle Tabs (Visual only, acting as links) */}
                    <div className="mb-8 flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                        <div className="flex-1 rounded-lg bg-white dark:bg-gray-700 py-3 shadow-sm transition-all">
                            <div className="text-center font-bold text-red-600 dark:text-red-400">
                                {t.signIn}
                            </div>
                        </div>
                        {canRegister && (
                            <Link
                                href={register.url()}
                                className="flex-1 py-3 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
                            >
                                <div className="text-center font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                    {t.signUp}
                                </div>
                            </Link>
                        )}
                    </div>

                    <h2 className="mb-8 text-center text-2xl font-bold text-gray-800 dark:text-white">
                        {t.welcome}
                    </h2>

                    <div className="mb-6">
                        <a
                            href="/login/google"
                            className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-3 font-semibold rounded-lg shadow-sm"
                        >
                            <GoogleIcon className="w-5 h-5" />
                            <span>Login dengan Google</span>
                        </a>

                        <div className="relative mt-6 mb-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white dark:bg-gray-900 px-4 text-gray-500 dark:text-gray-400">
                                    atau
                                </span>
                            </div>
                        </div>
                    </div>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-semibold">{t.email.label}</Label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400 group-focus-within:text-red-600 transition-colors">
                                                <Mail size={20} />
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder={t.email.placeholder}
                                                className="h-12 pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 rounded-lg transition-all"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-semibold">{t.password.label}</Label>
                                            {canResetPassword && (
                                                <Link
                                                    href={request()}
                                                    className="ml-auto text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                                                    tabIndex={5}
                                                >
                                                    {t.password.forgot}
                                                </Link>
                                            )}
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400 group-focus-within:text-red-600 transition-colors">
                                                <Lock size={20} />
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder={t.password.placeholder}
                                                className="h-12 pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 rounded-lg transition-all"
                                            />
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-600 rounded"
                                        />
                                        <Label htmlFor="remember" className="text-gray-600 dark:text-gray-400 font-medium">{t.remember}</Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-12 text-base font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-600/25 transition-all duration-300 rounded-lg"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && <Spinner className="mr-2 text-white" />}
                                        {t.loginButton}
                                    </Button>
                                </div>
                                <div className="mt-8 border-t border-gray-100 dark:border-gray-800 pt-6">
                                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                        {t.footer.text}
                                    </p>
                                    {canRegister && (
                                        <div className="mt-4 text-center">
                                            <Link
                                                href={register.url()}
                                                className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                            >
                                                {t.footer.link}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
}



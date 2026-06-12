import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login'; 
import { Form, Head, Link } from '@inertiajs/react';
import { SlideIn } from '@/components/page-transition';
import { Lock, Mail, Languages, Eye, EyeOff } from 'lucide-react';
import '@/../css/indosat-login-register.css';
import { useState } from 'react';

const GoogleIcon = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

type Language = 'id' | 'en';

const translations = {
  id: {
    brand: 'Indosat LMS',
    subtitle: 'Sistem Manajemen Pembelajaran',
    signIn: 'Masuk',
    signUp: 'Daftar',
    loginAccount: 'Masuk ke Akun',
    googleSignIn: 'Masuk dengan Google',
    or: 'Atau',
    email: { label: 'Alamat Email *', placeholder: 'nama@indosatooredoo.com' },
    password: { label: 'Kata Sandi *', placeholder: 'Masukkan kata sandi Anda' },
    loginButton: 'Masuk',
    illustration: {
      category: 'Digital Learning',
      title: 'Selamat Datang di Indosat LMS',
      desc: 'Platform pembelajaran digital terpadu untuk pengembangan kompetensi karyawan Indosat Ooredoo Hutchison.'
    },
    footer: { link: 'Belum punya akun? Daftar' }
  },
  en: {
    brand: 'Indosat LMS',
    subtitle: 'Learning Management System',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    loginAccount: 'Sign In to Account',
    googleSignIn: 'Sign In with Google',
    or: 'Or',
    email: { label: 'Email address *', placeholder: 'name@indosatooredoo.com' },
    password: { label: 'Password *', placeholder: 'Enter your password' },
    loginButton: 'Sign In',
    illustration: {
      category: 'Digital Learning',
      title: 'Welcome to Indosat LMS',
      desc: 'An integrated digital learning platform for the competency development of Indosat Ooredoo Hutchison employees.'
    },
    footer: { link: "Don't have an account? Sign Up" }
  }
};

export default function Login() {
    const [lang, setLang] = useState<Language>('id');
    const [showPassword, setShowPassword] = useState(false);
    const t = translations[lang];

    const toggleLang = () => {
        setLang(prev => prev === 'id' ? 'en' : 'id');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
            <Head title="Log in" />

            {/* Language Switcher */}
            <button
                onClick={toggleLang}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-gray-800 dark:text-white p-2 rounded-full transition-colors flex items-center space-x-1 backdrop-blur-sm z-50"
            >
                <Languages className="w-4 h-4" />
                <span className="text-xs font-medium">{lang === 'id' ? 'ID' : 'EN'}</span>
            </button>

            {/* LEFT SIDE: Form Konten */}
            <SlideIn direction="left" className="flex w-full lg:w-1/2 items-center justify-center px-8 overflow-hidden">
                <div className="w-full max-w-md">

                    {/* Logo Indosat */}
                    <div className="mb-10 flex justify-center">
                        <img src="/assets/logoindosat.png" alt="Indosat Logo" className="h-14 w-auto object-contain dark:hidden" />
                        <img src="/assets/logoindosatterang.png" alt="Indosat Logo" className="h-14 w-auto object-contain hidden dark:block" />
                    </div>

                    {/* Toggle Tabs */}
                    <div className="mb-4 flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                        <div className="flex-1 rounded-lg bg-white dark:bg-gray-700 py-2 shadow-sm">
                            <div className="text-center text-sm font-bold text-indosat-active">{t.signIn}</div>
                        </div>
                        <Link href={register.url()} className="flex-1 py-2 transition-colors">
                            <div className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 hover-text-indosat transition-colors">{t.signUp}</div>
                        </Link>
                    </div>

                    <h2 className="mb-3 text-center text-lg font-bold text-gray-800 dark:text-white">{t.loginAccount}</h2>

                    {/* Google Button */}
                    <div className="mb-3">
                        <a href="/login/google" className="w-full h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold rounded-lg shadow-sm">
                            <GoogleIcon className="w-4 h-4" />
                            <span>{t.googleSignIn}</span>
                        </a>
                        <div className="relative mt-3 mb-1">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-gray-50 dark:bg-gray-950 px-3 text-gray-500 dark:text-gray-400">{t.or}</span>
                            </div>
                        </div>
                    </div>

                    <Form {...store.form()} resetOnSuccess={['password']} className="flex flex-col gap-3">
                        {({ processing, errors }) => (
                            <>
                                <div className="space-y-2">
                                    {/* Input Email */}
                                    <div className="focus-input-indosat">
                                        <Label htmlFor="email" className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{t.email.label}</Label>
                                        <div className="relative mt-1 flex items-center">
                                            <div className="absolute left-3 text-gray-400 icon-container pointer-events-none z-10">
                                                <Mail size={15} />
                                            </div>
                                            <Input 
                                                id="email" 
                                                type="email" 
                                                required 
                                                autoFocus 
                                                tabIndex={1} 
                                                autoComplete="email" 
                                                name="email" 
                                                placeholder={t.email.placeholder} 
                                                className="h-10 w-full pl-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 input-field-indosat rounded-lg text-sm" 
                                            />
                                        </div>
                                        <InputError message={errors.email} className="text-xs mt-0.5" />
                                    </div>

                                    {/* Input Password */}
                                    <div className="focus-input-indosat">
                                        <Label htmlFor="password" className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{t.password.label}</Label>
                                        <div className="relative mt-1 flex items-center">
                                            <div className="absolute left-3 text-gray-400 icon-container pointer-events-none z-10">
                                                <Lock size={15} />
                                            </div>
                                            <Input 
                                                id="password" 
                                                type={showPassword ? 'text' : 'password'} 
                                                required 
                                                tabIndex={2} 
                                                autoComplete="current-password" 
                                                name="password" 
                                                placeholder={t.password.placeholder} 
                                                className="h-10 w-full pl-9 pr-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 input-field-indosat rounded-lg text-sm" 
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-20 focus:outline-none flex items-center justify-center h-full"
                                            >
                                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                            </button>
                                        </div>
                                        <InputError message={errors.password} className="text-xs mt-0.5" />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full h-10 text-sm font-bold btn-indosat-primary rounded-lg mt-2" tabIndex={3} disabled={processing}>
                                    {processing && <Spinner className="mr-2 text-white" />}
                                    {t.loginButton}
                                </Button>

                                <div className="border-t border-gray-200 dark:border-gray-800 pt-2 text-center">
                                    <Link href={register.url()} className="text-xs font-semibold text-indosat-active hover-text-indosat transition-colors">
                                        {t.footer.link}
                                    </Link>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SlideIn>

        
            <SlideIn direction="right" delay={0.1} className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-8 illustration-panel-container">
                <div className="w-full max-w-lg main-box-card">
                    {/* Efek Glow & Dot Ornamen */}
                    <div className="glow-frame-indosat" />
                    <div className="dot-decoration-yellow" />
                    <div className="dot-decoration-blue" />

                    {/* Frame Foto Utama */}
                    <div className="inner-photo-frame">
                        <img 
                            src="/assets/loginimage.png" 
                            alt="Learning Illustration" 
                            className="absolute inset-0 w-full h-full object-cover" 
                        />
                        <div className="dark-overlay-indosat" />
                        
                        {/* Konten Teks di Atas Overlay */}
                        <div className="relative z-20 p-6 text-left">
                            <span className="badge-indosat">{t.illustration.category}</span>
                            <h2 className="text-2xl font-bold text-white mb-2">{t.illustration.title}</h2>
                            <p className="text-gray-200 text-xs leading-relaxed">{t.illustration.desc}</p>
                        </div>
                    </div>
                </div>
            </SlideIn>
        </div>
    );
}
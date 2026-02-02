// Components
import { login } from '@/routes';
import { email } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Mail, Languages, ArrowLeft } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

// Definisi type bahasa
type Language = 'id' | 'en';

// Kamus terjemahan
const translations = {
  id: {
    title: 'Lupa Kata Sandi',
    brand: 'Indosat LMS',
    subtitle: 'Sistem Manajemen Pembelajaran',
    headline: 'Atur Ulang Kata Sandi',
    description: 'Jangan khawatir! Masukkan alamat email yang terdaftar, dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.',
    emailLabel: 'Alamat Email',
    emailPlaceholder: 'nama@indosatooredoo.com',
    submitButton: 'Kirim Tautan Reset',
    backToLogin: 'Kembali ke halaman masuk',
    status: {
        success: 'Tautan reset telah dikirim ke email Anda.'
    }
  },
  en: {
    title: 'Forgot Password',
    brand: 'Indosat LMS',
    subtitle: 'Learning Management System',
    headline: 'Reset Password',
    description: 'No worries! Enter your registered email address, and we will send you a link to reset your password.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'name@indosatooredoo.com',
    submitButton: 'Send Reset Link',
    backToLogin: 'Return to login',
    status: {
        success: 'Reset link has been sent to your email.'
    }
  }
};

export default function ForgotPassword({ status }: { status?: string }) {
    const [lang, setLang] = useState<Language>('id');
    const t = translations[lang];

    const toggleLang = () => {
        setLang(prev => prev === 'id' ? 'en' : 'id');
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-600 dark:bg-gray-950 p-4 relative transition-colors duration-300">
            <Head title={t.title} />

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

                <div className="rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                    {status && (
                        <div className="mb-6 rounded-lg bg-green-50 dark:bg-green-900/30 p-4 border border-green-200 dark:border-green-800">
                            <div className="text-sm font-medium text-green-700 dark:text-green-400 text-center">
                                {status}
                            </div>
                        </div>
                    )}

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            {t.headline}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            {t.description}
                        </p>
                    </div>

                    <Form {...email.form()}>
                        {({ processing, errors }) => (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-semibold">
                                        {t.emailLabel}
                                    </Label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-3 z-10 text-gray-400 group-focus-within:text-red-600 transition-colors">
                                            <Mail size={20} />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            autoComplete="email"
                                            autoFocus
                                            placeholder={t.emailPlaceholder}
                                            className="h-12 pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600/20 focus:border-red-600 rounded-lg transition-all"
                                        />
                                    </div>
                                    <InputError message={errors.email} />
                                </div>

                                <Button
                                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-600/25 transition-all duration-300 rounded-lg"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                >
                                    {processing ? (
                                        <LoaderCircle className="h-5 w-5 animate-spin mr-2" />
                                    ) : null}
                                    {t.submitButton}
                                </Button>
                            </div>
                        )}
                    </Form>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                        <TextLink 
                            href={login()} 
                            className="inline-flex items-center text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t.backToLogin}
                        </TextLink>
                    </div>
                </div>
            </div>
        </div>
    );
}

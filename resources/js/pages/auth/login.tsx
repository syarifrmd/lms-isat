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
import { Lock, Mail } from 'lucide-react';

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
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-600 p-4">
            <Head title="Log in" />

            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="mb-8 items-center">
                    <div className="mb-4 rounded-2xl bg-white p-6 shadow-lg text-center">
                        <h1 className="text-3xl font-bold text-red-600">Indosat LMS</h1>
                        <p className="mt-2 text-gray-600">Learning Management System</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="rounded-2xl bg-white p-8 shadow-lg">
                    {status && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

                    {/* Toggle Tabs (Visual only, acting as links) */}
                    <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
                        <div className="flex-1 rounded-lg bg-white py-3 shadow-sm">
                            <div className="text-center font-semibold text-red-600">
                                Sign In
                            </div>
                        </div>
                        {canRegister && (
                            <Link
                                href={register.url()}
                                className="flex-1 py-3"
                            >
                                <div className="text-center font-semibold text-gray-500 hover:text-red-600">
                                    Sign Up
                                </div>
                            </Link>
                        )}
                    </div>

                    <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
                        Welcome Back
                    </h2>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="font-medium text-gray-700">Email address</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400">
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
                                                placeholder="Enter your email"
                                                className="h-auto w-full rounded-lg border-2 text-black border-gray-200 py-3 pl-10 pr-4 focus-visible:border-red-600 focus-visible:ring-0"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password" className="font-medium text-gray-700">Password</Label>
                                            {canResetPassword && (
                                                <Link
                                                    href={request()}
                                                    className="ml-auto text-sm text-red-600 hover:underline"
                                                    tabIndex={5}
                                                >
                                                    Forgot password?
                                                </Link>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400">
                                                <Lock size={20} />
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Enter your password"
                                                className="h-auto w-full rounded-lg border-2 text-black border-gray-200 py-3 pl-10 pr-4 focus-visible:border-red-600 "
                                            />
                                        </div>
                                        <InputError message={errors.password} />
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="border-gray-300 text-red-600 focus:ring-red-600"
                                        />
                                        <Label htmlFor="remember" className="text-gray-500">Remember me</Label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-4 w-full rounded-lg bg-red-600 py-6 text-lg font-bold text-white hover:bg-red-700"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && <Spinner className="mr-2 text-white" />}
                                        Login
                                    </Button>
                                </div>
                                <div className="mt-6 border-t border-gray-200 pt-6">
                                    <p className="text-center text-xs text-gray-500">
                                        Use your Indosat email credentials to sign in
                                    </p>
                                    {canRegister && (
                                        <div className="mt-3 text-center">
                                            <Link
                                                href={register.url()}
                                                className="text-sm font-medium text-red-600 hover:underline"
                                            >
                                                Don't have an account? Sign Up
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



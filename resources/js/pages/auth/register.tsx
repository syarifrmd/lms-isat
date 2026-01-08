import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head, Link } from '@inertiajs/react';
import { IdCard, Lock, Mail, User } from 'lucide-react';

export default function Register() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-red-600 p-4">
            <Head title="Register" />

            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="mb-8 items-center">
                    <div className="mb-4 rounded-2xl bg-white p-6 shadow-lg text-center">
                        <h1 className="text-3xl font-bold text-red-600">Indosat LMS</h1>
                        <p className="mt-2 text-gray-600">Learning Management System</p>
                    </div>
                </div>

                {/* Register Card */}
                <div className="rounded-2xl bg-white p-8 shadow-lg">
                    {/* Toggle Tabs (Visual only, acting as links) */}
                    <div className="mb-6 flex rounded-lg bg-gray-100 p-1">
                        <Link
                            href={login.url()}
                            className="flex-1 py-3"
                        >
                            <div className="text-center font-semibold text-gray-500 hover:text-red-600">
                                Sign In
                            </div>
                        </Link>
                        <div className="flex-1 rounded-lg bg-white py-3 shadow-sm">
                            <div className="text-center font-semibold text-red-600">
                                Sign Up
                            </div>
                        </div>
                    </div>

                    <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
                        Create Account
                    </h2>

                    <Form
                        {...store.form()}
                        resetOnSuccess={['password', 'password_confirmation']}
                        disableWhileProcessing
                        className="flex flex-col gap-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name" className="font-medium text-gray-700">Full Name *</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400">
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
                                                placeholder="Enter your full name"
                                                className="h-auto w-full rounded-lg border-2 text-black border-gray-200 py-3 pl-10 pr-4 focus-visible:border-red-600 focus-visible:ring-0"
                                            />
                                        </div>
                                        <InputError message={errors.name} className="mt-1" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="employee_id" className="font-medium text-gray-700">Employee ID (Optional)</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400">
                                                <IdCard size={20} />
                                            </div>
                                            <Input
                                                id="employee_id"
                                                type="text"
                                                tabIndex={2}
                                                autoComplete="off"
                                                name="employee_id"
                                                placeholder="Enter employee ID"
                                                className="h-auto w-full rounded-lg border-2 text-black border-gray-200 py-3 pl-10 pr-4 focus-visible:border-red-600 focus-visible:ring-0"
                                            />
                                        </div>
                                        <InputError message={errors.employee_id} className="mt-1" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="font-medium text-gray-700">Email address *</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400">
                                                <Mail size={20} />
                                            </div>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                tabIndex={3}
                                                autoComplete="email"
                                                name="email"
                                                placeholder="Enter your email"
                                                className="h-auto w-full rounded-lg border-2 text-black border-gray-200 py-3 pl-10 pr-4 focus-visible:border-red-600 focus-visible:ring-0"
                                            />
                                        </div>
                                        <InputError message={errors.email} className="mt-1" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password" className="font-medium text-gray-700">Password *</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400">
                                                <Lock size={20} />
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                required
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                name="password"
                                                placeholder="Create a password (min 8 chars)"
                                                className="h-auto w-full rounded-lg border-2 text-black border-gray-200 py-3 pl-10 pr-4 focus-visible:border-red-600 focus-visible:ring-0"
                                            />
                                        </div>
                                        <InputError message={errors.password} className="mt-1" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password_confirmation" className="font-medium text-gray-700">Confirm Password *</Label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-3 z-10 text-gray-400">
                                                <Lock size={20} />
                                            </div>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                required
                                                tabIndex={5}
                                                autoComplete="new-password"
                                                name="password_confirmation"
                                                placeholder="Confirm your password"
                                                className="h-auto w-full rounded-lg border-2 text-black border-gray-200 py-3 pl-10 pr-4 focus-visible:border-red-600 focus-visible:ring-0"
                                            />
                                        </div>
                                        <InputError message={errors.password_confirmation} className="mt-1" />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-4 w-full rounded-lg bg-red-600 py-6 text-lg font-bold text-white hover:bg-red-700"
                                        tabIndex={6}
                                        data-test="register-user-button"
                                    >
                                        {processing && <Spinner className="mr-2 text-white" />}
                                        Sign Up
                                    </Button>
                                </div>
                                <div className="mt-6 border-t border-gray-200 pt-6">
                                    <p className="text-center text-xs text-gray-500">
                                        By signing up, you agree to our Terms of Service
                                    </p>
                                    <div className="mt-3 text-center">
                                        <Link
                                            href={login.url()}
                                            className="text-sm font-medium text-red-600 hover:underline"
                                        >
                                            Already have an account? Sign In
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

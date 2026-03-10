import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Camera, UserCircle2, X } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';

const REGIONS = [
    'Jakarta',
    'Bandung',
    'Surabaya',
    'Medan',
    'Makassar',
    'Semarang',
    'Palembang',
    'Balikpapan',
    'Manado',
    'Denpasar',
    'Yogyakarta',
    'Solo',
    'Malang',
    'Bogor',
    'Batam',
    'Pekanbaru',
    'Banjarmasin',
    'Pontianak',
    'Samarinda',
    'Lampung',
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile',
        href: edit().url,
    },
];

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    trainer: 'Trainer',
    user: 'Employee',
};

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    trainer: 'bg-blue-100 text-blue-700',
    user: 'bg-green-100 text-green-700',
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const avatarUrl = user.avatar ?? null;

    const [preview, setPreview] = useState<string | null>(avatarUrl);
    const avatarInput = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm<{
        _method: string;
        name: string;
        email: string;
        region: string;
        avatar: File | null;
        remove_avatar: boolean;
    }>({
        _method: 'PATCH',
        name: user.name ?? '',
        email: user.email ?? '',
        region: user.region ?? '',
        avatar: null,
        remove_avatar: false,
    });

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);
            setData('remove_avatar', false);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveAvatar = () => {
        setData('avatar', null);
        setData('remove_avatar', true);
        setPreview(null);
        if (avatarInput.current) avatarInput.current.value = '';
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/settings/profile', { forceFormData: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile Settings</h1>

            <SettingsLayout>
                {/* ── Personal Information Card ── */}
                <div className="rounded-2xl bg-card p-6 shadow-sm border space-y-6">
                    <HeadingSmall
                        title="Personal Information"
                        description="Update your personal details and profile photo"
                    />

                    {/* Avatar Upload */}
                    <div className="flex items-center gap-5">
                        <div className="relative h-20 w-20 shrink-0">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Profile photo"
                                    className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
                                />
                            ) : (
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted ring-2 ring-border">
                                    <UserCircle2 className="h-10 w-10 text-muted-foreground" />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => avatarInput.current?.click()}
                                className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                            >
                                <Camera className="h-3 w-3" />
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                size="sm"
                                className="bg-rose-500 hover:bg-rose-600 text-white rounded-full"
                                onClick={() => avatarInput.current?.click()}
                            >
                                Upload
                            </Button>
                            {preview && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={handleRemoveAvatar}
                                >
                                    <X className="mr-1 h-3 w-3" />
                                    Remove
                                </Button>
                            )}
                        </div>

                        <input
                            ref={avatarInput}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>

                    {/* Form */}
                    <form onSubmit={submit} className="space-y-5" encType="multipart/form-data">
                        {/* Row 1: Full Name + NIK */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="name">
                                    Full Name <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                    className="bg-muted/30"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="nik">Employee ID (NIK)</Label>
                                <Input
                                    id="nik"
                                    value={user.id}
                                    readOnly
                                    disabled
                                    className="cursor-not-allowed opacity-60 bg-muted/30"
                                />
                            </div>
                        </div>

                        {/* Row 2: Email + Region */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="email">
                                    Email <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                    className="bg-muted/30"
                                />
                                <InputError message={errors.email} />
                                {mustVerifyEmail && user.email_verified_at === null && (
                                    <p className="text-xs text-amber-600">
                                        Your email address is unverified.
                                    </p>
                                )}
                                {status === 'verification-link-sent' && (
                                    <p className="text-xs text-green-600">
                                        Verification link sent!
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="region">
                                    Region <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="region"
                                    list="region-list"
                                    value={data.region}
                                    onChange={(e) => setData('region', e.target.value)}
                                    placeholder="Type or select region"
                                    className="bg-muted/30"
                                    autoComplete="off"
                                />
                                <datalist id="region-list">
                                    {REGIONS.map((r) => (
                                        <option key={r} value={r} />
                                    ))}
                                </datalist>
                                <InputError message={errors.region} />
                            </div>
                        </div>

                        {/* Row 3: Role (read-only) */}
                        <div className="space-y-1.5">
                            <Label>Role</Label>
                            <div className="flex items-center h-9">
                                <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${ROLE_COLORS[user.role] ?? 'bg-muted text-muted-foreground'}`}
                                >
                                    {ROLE_LABELS[user.role] ?? user.role}
                                </span>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex items-center gap-4 pt-2">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-6"
                            >
                                Save Changes
                            </Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-muted-foreground">Saved.</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                {/* Delete Account */}
                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}

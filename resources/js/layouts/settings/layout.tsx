import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn, toUrl } from '@/lib/utils';
import { useActiveUrl } from '@/hooks/use-active-url';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Password',
        href: editPassword(),
        icon: null,
    },
    {
        title: 'Two-Factor Auth',
        href: show(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { urlIsActive } = useActiveUrl();

    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="px-4 py-6 sm:px-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-12">
                <nav
                    className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden"
                    aria-label="Settings Mobile"
                >
                    {sidebarNavItems.map((item, index) => (
                        <Button
                            key={`${toUrl(item.href)}-${index}-mobile`}
                            size="sm"
                            variant="ghost"
                            asChild
                            className={cn('h-9 shrink-0 rounded-full px-4 text-sm', {
                                'bg-red-500 font-medium text-white hover:bg-red-600 hover:text-white': urlIsActive(item.href),
                            })}
                        >
                            <Link href={item.href}>{item.title}</Link>
                        </Button>
                    ))}
                </nav>

                <aside className="hidden w-full max-w-xl lg:block lg:w-56">
                    <nav className="flex flex-col gap-1" aria-label="Settings">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('h-9 w-full justify-start rounded-lg px-3 text-sm', {
                                    'bg-red-500 font-medium text-white hover:bg-red-600 hover:text-white': urlIsActive(item.href),
                                })}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="h-4 w-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="lg:hidden" />

                <div className="min-w-0 flex-1 md:max-w-2xl">
                    <section className="max-w-xl space-y-8 sm:space-y-10 lg:space-y-12">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}

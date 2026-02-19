import { dashboard } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Award,
    BookOpen,
    GraduationCap,
    LayoutDashboard,
    Settings,
    Trophy,
    Users,
    BarChart3,
} from 'lucide-react';

interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
}

export function MobileBottomNav() {
    const { props, url } = usePage<SharedData>();
    const role = props.auth.user.role?.toLowerCase();

    const isActive = (href: string) => url.startsWith(href);

    const getNavItems = (): NavItem[] => {
        switch (role) {
            case 'admin':
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                    { title: 'Users', href: '/admin/users', icon: Users },
                    { title: 'Courses', href: '/courses', icon: BookOpen },
                    { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
                    { title: 'Settings', href: '/dashboard/settings', icon: Settings },
                ];
            case 'trainer':
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                    { title: 'Courses', href: '/courses', icon: BookOpen },
                    { title: 'Assessments', href: '/assessments', icon: Award },
                    { title: 'Students', href: '/dashboard/students', icon: Users },
                ];
            case 'user':
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                    { title: 'Learning', href: '/courses', icon: BookOpen },
                    { title: 'Certificates', href: '/certificates', icon: GraduationCap },
                    { title: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
                ];
            default:
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                ];
        }
    };

    const navItems = getNavItems();

    return (
        <nav className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
            <div className="flex items-center justify-around rounded-full bg-white/80 dark:bg-neutral-900/80 px-2 py-3 shadow-xl backdrop-blur-md border border-black/5 dark:border-white/10">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center px-4 py-2 min-w-13"
                        >
                            {/* Sliding red bubble */}
                            {active && (
                                <motion.div
                                    layoutId="mobile-nav-bubble"
                                    className="absolute inset-0 rounded-full bg-red-600"
                                    transition={{
                                        type: 'spring',
                                        stiffness: 380,
                                        damping: 30,
                                    }}
                                />
                            )}

                            {/* Icon & label */}
                            <span className="relative z-10 flex flex-col items-center gap-0.5">
                                <Icon
                                    className={`h-6 w-6 transition-colors ${
                                        active ? 'text-white' : 'text-neutral-500 dark:text-white/60'
                                    }`}
                                />
                                <span
                                    className={`text-[10px] leading-tight font-medium transition-colors ${
                                        active ? 'text-white' : 'text-neutral-500 dark:text-white/50'
                                    }`}
                                >
                                    {item.title}
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from '@/components/ui/sidebar';
import { dashboard, logout } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BarChart3,
    BookOpen,
    FileText,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Settings,
    Trophy,
    Users,
} from 'lucide-react';

// Map icon names if needed, or use lucide-react direct imports
// BarChart3 might be BarChart or ChartBar in some versions

export function AppSidebar() {
    const { props, url } = usePage<SharedData>();
    const { auth } = props;
    const role = auth.user.profile?.role;
    const user = auth.user;

    // Helper to check active route
    const isActive = (path: string) => url.startsWith(path);

    const getNavItems = (): NavItem[] => {
        switch (role) {
            case 'admin':
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                    { title: 'Manage Users', href: '/dashboard/users', icon: Users },
                    { title: 'Courses', href: '/dashboard/courses', icon: BookOpen },
                    { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
                    { title: 'Settings', href: '/dashboard/settings', icon: Settings },
                ];
            case 'trainer':
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                    { title: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
                    { title: 'Create Module', href: '/dashboard/create', icon: FileText },
                    { title: 'Assessments', href: '/dashboard/assessments', icon: Award },
                    { title: 'Students', href: '/dashboard/students', icon: Users },
                ];
            case 'user': // Previously 'dse'
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                    { title: 'My Learning', href: '/dashboard/learning', icon: BookOpen },
                    { title: 'Certificates', href: '/dashboard/certificates', icon: GraduationCap },
                    { title: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
                    { title: 'My Badges', href: '/dashboard/badges', icon: Award },
                ];
            default:
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                ];
        }
    };

    const navItems = getNavItems();

    return (
        <Sidebar collapsible="icon" className="border-r-0 bg-[#1a1a1a] text-white">
            <SidebarHeader className="border-b border-gray-700 p-6 bg-[#1a1a1a]" >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600">
                        <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-white">Indosat LMS</div>
                        <div className="text-xs capitalize text-gray-400">
                            {role || 'User'} Portal
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="bg-[#1a1a1a]">
                {/* User Profile Section */}
                <div className="border-b border-gray-700 p-6">
                    <div className="flex items-center gap-3">
                        <img
                            src={
                                user.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                            }
                            alt={user.name}
                            className="h-12 w-12 rounded-full border-2 border-yellow-400 bg-gray-600"
                        />
                        <div className="flex-1 overflow-hidden">
                            <div className="truncate font-medium text-white">
                                {user.name}
                            </div>
                            <div className="truncate text-sm text-gray-400">
                                {user.email}
                            </div>
                            {role === 'user' && ( // role was 'dse' in previous app
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="text-xs text-yellow-400">
                                        Level {user.level || 1}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-xs text-gray-400">
                                        {user.points || 0} pts
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 space-y-1 p-4">
                    {navItems.map((item) => {
                        const Icon = item.icon!;
                        const active = isActive(item.href as string);
                        return (
                            <Link
                                key={item.href as string}
                                href={item.href}
                                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                                    active
                                        ? 'bg-red-600'
                                        : 'bg-transparent hover:bg-white/5'
                                }`}
                            >
                                <Icon
                                    className={`h-5 w-5 ${
                                        active ? 'text-white' : 'text-[#d1d5db]'
                                    }`}
                                />
                                <span
                                    className={
                                        active ? 'text-white' : 'text-gray-300'
                                    }
                                >
                                    {item.title}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-700 bg-[#1a1a1a] p-4 text-white">
                <Link
                    href={logout().url}
                    method="post"
                    as="button"
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 hover:bg-white/5"
                >
                    <LogOut className="h-5 w-5 text-[#d1d5db]" />
                    <span className="text-gray-300">Logout</span>
                </Link>
            </SidebarFooter>
        </Sidebar>
    );
}

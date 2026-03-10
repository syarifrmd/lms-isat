import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard, logout } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Settings,
    Trophy,
    Users,
} from 'lucide-react';

export function AppSidebar() {
    const { props, url } = usePage<SharedData>();
    const { auth } = props;
    const role = auth.user.role?.toLowerCase();
    const user = auth.user;

    // Helper to check active route
    const isActive = (path: string) => url.startsWith(path);

    const getNavItems = (): NavItem[] => {
        switch (role) {
            case 'admin':
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                    { title: 'User Management', href: '/admin/users', icon: Users },
                    { title: 'Courses', href: '/courses', icon: BookOpen },
                    { title: 'Settings', href: '/settings', icon: Settings },
                ];
            case 'trainer':
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                    { title: 'My Courses', href: '/courses', icon: BookOpen },
                    { title: 'Assessments', href: '/assessments', icon: Award },
                    { title: 'Students', href: '/students', icon: Users },
                ];
            case 'user':
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                    { title: 'My Learning', href: '/courses', icon: BookOpen },
                    { title: 'Certificates', href: '/certificates', icon: GraduationCap },
                    { title: 'Leaderboard', href: '/leaderboard', icon: Trophy },
                ];
            default:
                return [
                    { title: 'Dashboard', href: dashboard().url, icon: LayoutDashboard },
                ];
        }
    };

    const navItems = getNavItems();

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">

            {/* ── Logo header ── */}
            <SidebarHeader className="border-b border-sidebar-border bg-sidebar px-2 py-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" tooltip="Indosat LMS" asChild className="hover:bg-transparent active:bg-transparent cursor-default">
                            <Link href={dashboard().url}>
                                <img 
                                    src="https://prod-talentics-storage.s3.ap-southeast-1.amazonaws.com/organizations/110284/logos/1648697982_4de97d5a7c04a252d442a320bf625037a16fe803.png" 
                                    alt="Indosat Logo" 
                                    className="h-6 w-6 shrink-0 object-contain" 
                                />
                                <div className="flex flex-col leading-tight min-w-0">
                                    <span className="font-bold text-sidebar-foreground truncate">Indosat LMS</span>
                                    <span className="text-xs capitalize text-muted-foreground truncate">
                                        {role || 'User'} Portal
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-sidebar">

                {/* ── User profile ── */}
                <SidebarGroup className="border-b border-sidebar-border py-2 px-2 group-data-[collapsible=icon]:hidden">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    size="lg"
                                    tooltip="Edit Profile"
                                    asChild
                                    className="h-auto py-3 px-3 group/profile"
                                >
                                    <Link href="/settings/profile" className="flex items-center gap-3">
                                        <img
                                            src={
                                                user.avatar ||
                                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
                                            }
                                            alt={user.name}
                                            className="h-10 w-10 shrink-0 rounded-full border-2 border-yellow-400 bg-gray-600 object-cover"
                                        />
                                        <div className="flex flex-col leading-tight min-w-0 group-data-[collapsible=icon]:hidden">
                                            <span className="truncate font-semibold text-sidebar-foreground text-sm group-hover/profile:text-white transition-colors">
                                                {user.name}
                                            </span>
                                            <span className="truncate text-xs text-muted-foreground mt-0.5 group-hover/profile:text-white transition-colors">
                                                {user.email}
                                            </span>
                                            {role === 'user' && (
                                                <span className="text-xs font-medium text-yellow-500 mt-1">
                                                    Level {user.level || 1} · {user.points || 0} pts
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* ── Navigation ── */}
                <SidebarGroup className="py-2">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const Icon = item.icon!;
                                const active = isActive(item.href as string);
                                return (
                                    <SidebarMenuItem key={item.href as string}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={active}
                                            tooltip={item.title}
                                        >
                                            <Link href={item.href}>
                                                <Icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* ── Logout footer ── */}
            <SidebarFooter className="bg-sidebar border-t border-sidebar-border py-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Logout">
                            <Link href={logout().url} method="post" as="button">
                                <LogOut />
                                <span>Logout</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

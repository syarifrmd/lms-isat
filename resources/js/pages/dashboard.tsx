import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData, type TrainerDashboardData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import TrainerDashboard from './trainer/TrainerDashboard';
// import EmployeeDashboard from './employee/EmployeeDashboard'; // Uncomment when created

interface DashboardPageProps extends SharedData {
    dashboardData?: TrainerDashboardData;
    youtube_connected: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({ youtube_connected }: { youtube_connected: boolean }) {
    const { auth, dashboardData } = usePage<DashboardPageProps>().props;
    const role = auth.user.role?.toUpperCase();

    // Render dashboard berdasarkan role
    const renderDashboardContent = () => {
        switch (role) {
            case 'TRAINER':
                return <TrainerDashboard data={dashboardData} youtube_connected={youtube_connected} />;
            
            case 'USER':
                // return <EmployeeDashboard />; // Uncomment when EmployeeDashboard is created
                return (
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                        <PlaceholderPattern className="size-20 text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600">Employee Dashboard</h2>
                        <p className="text-gray-400">Coming Soon...</p>
                    </div>
                );
            
            default:
                return (
                    <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                            <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            </div>
                            <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            </div>
                            <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                                <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                            </div>
                        </div>
                        <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </div>
                    </div>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            
            {renderDashboardContent()}
            
            <div className="px-4 pb-4">
                Current Active Role: <span className="font-semibold uppercase">{role || 'N/A'}</span>
            </div>
        </AppLayout>
    );
}


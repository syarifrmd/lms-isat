import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData, type TrainerDashboardData, type UserDashboardData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import AdminDashboard from './admin/AdminDashboard';
import TrainerDashboard from './trainer/TrainerDashboard';
import UserDashboard from './employee/UserDashboard';

interface AdminData {
    stats: {
        total_users: number;
        total_trainers: number;
        total_students: number;
        total_courses: number;
        total_enrollments: number;
        completed_enrollments: number;
        completion_rate: number;
        platform_avg_rating: number | null;
    };
    courses_by_status: Record<string, number>;
    popular_courses: Array<{
        id: number;
        title: string;
        status: string;
        enrollments_count: number;
        creator_name: string;
        average_rating: number | null;
    }>;
    monthly_enrollments: Record<string, number>;
    recent_enrollments: Array<{
        course_title: string;
        user_name: string;
        status: string;
        progress: number;
        enrolled_at: string;
    }>;
    trainer_stats: Array<{
        trainer_name: string;
        student_total: number;
    }>;
}

interface DashboardPageProps extends SharedData {
    dashboardData?: TrainerDashboardData;
    adminData?: AdminData;
    userData?: UserDashboardData;
    youtube_connected: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({ youtube_connected }: { youtube_connected: boolean }) {
    const { auth, dashboardData, adminData, userData } = usePage<DashboardPageProps>().props;
    const role = auth.user.role?.toUpperCase();

    // Render dashboard berdasarkan role
    const renderDashboardContent = () => {
        switch (role) {
            case 'ADMIN':
                return <AdminDashboard data={adminData} />;

            case 'TRAINER':
                return <TrainerDashboard data={dashboardData} youtube_connected={youtube_connected} />;

            case 'USER':
                return <UserDashboard data={userData} />;

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
                        <div className="relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
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
        </AppLayout>
    );
}



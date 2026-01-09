import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    profile?: Profile;
    level?: number;
    points?: number;
    [key: string]: unknown; // This allows for additional properties...
}

export type UserRole = 'admin' | 'trainer' | 'user';

export interface Profile {
    user_id: number;
    email: string;
    full_name: string | null;
    role: UserRole;
    employee_id: string | null;
    region: string | null;
    created_at: string;
}

export interface Course {
    id: number;
    title: string;
    description?: string;
    trainer_id: number;
    students_count?: number;
    progress?: number;
    rating?: number;
    status?: 'draft' | 'published' | 'archived';
    created_at: string;
    updated_at: string;
}

export interface TrainerDashboardStats {
    total_courses: number;
    total_students: number;
    completed_courses: number;
    average_rating: string;
}

export interface TrainerDashboardData {
    stats: TrainerDashboardStats;
    recent_courses: Course[];
}

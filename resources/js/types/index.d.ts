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
    profile?: Profile; // Kept for backward compatibility if needed, but likely null now
    role?: UserRole;
    employee_id?: string;
    region?: string;
    full_name?: string;
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

export interface Answer {
    id: number;
    question_id: number;
    answer_text: string;
    is_correct: boolean;
}

export interface Question {
    id: number;
    quiz_id: number;
    question_text: string;
    explanation: string | null;
    point: number;
    answers: Answer[];
}

export interface Quiz {
    id: number;
    course_id: number;
    module_id: number | null;
    title: string;
    min_score: number;
    passing_score: number | null;
    is_timed: boolean;
    time_limit_second: number | null;
    xp_bonus: number | null;
    questions?: Question[];
    questions_count?: number;
    course?: Course;
    module?: {
        id: number;
        title: string;
    };
}

export interface UserQuizAttempt {
    id: number;
    user_id: number;
    quiz_id: number;
    course_id: number;
    score: number;
    is_passed: boolean;
    submitted_at: string;
    created_at: string;
    updated_at: string;
    quiz?: Quiz;
    course?: Course;
    user_answers?: UserAnswer[];
}

export interface UserAnswer {
    id: number;
    attempt_id: number;
    question_id: number;
    answer_id: number;
    is_correct: boolean;
    question?: Question;
    answer?: Answer;
}

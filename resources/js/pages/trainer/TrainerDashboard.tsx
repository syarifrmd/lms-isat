import React from 'react';
import { StatCard } from '@/components/shared/StatCard';
import { DashboardSection } from '@/components/shared/DashboardSection';
import { CourseListItem } from '@/components/shared/CourseListItem';
import { QuickAction } from '@/components/shared/QuickAction';
import { Video, FileText, Award, BookOpen, Users, CheckCircle } from 'lucide-react';
import { TrainerDashboardData } from '@/types';

interface TrainerDashboardProps {
    data?: TrainerDashboardData;
}

export default function TrainerDashboard({ data }: TrainerDashboardProps) {
    // Use data from props if available, otherwise use default/empty data
    const stats = data?.stats ? [
        { label: 'Total Courses', value: data.stats.total_courses, icon: BookOpen, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
        { label: 'Total Students', value: data.stats.total_students, icon: Users, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
        { label: 'Completed', value: data.stats.completed_courses, icon: CheckCircle, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
        { label: 'Avg Rating', value: data.stats.average_rating, icon: Award, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    ] : [
        { label: 'Total Courses', value: 0, icon: BookOpen, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
        { label: 'Total Students', value: 0, icon: Users, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
        { label: 'Completed', value: 0, icon: CheckCircle, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
        { label: 'Avg Rating', value: '0.0', icon: Award, iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    ];

    const courses = data?.recent_courses || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
                <button className="bg-[#DC1F2E] text-white px-6 py-2 rounded-lg">Create Course</button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((s, i) => <StatCard key={s.label} {...s} index={i} />)}
            </div>

            {/* My Courses */}
            <DashboardSection title="My Courses" action={<button className="text-[#DC1F2E]">View All</button>} delay={0.3}>
                <div className="space-y-4">
                    {courses.length > 0 ? (
                        courses.slice(0, 4).map((c, i) => <CourseListItem key={c.id} course={c} index={i} />)
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No courses yet. Create your first course!</p>
                        </div>
                    )}
                </div>
            </DashboardSection>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <QuickAction title="Upload Video" description="Add new learning materials" icon={Video} variant="blue" />
                <QuickAction title="Create Quiz" description="Test student knowledge" icon={FileText} variant="green" />
                <QuickAction title="Review" description="Check student progress" icon={Award} variant="purple" />
            </div>
        </div>
    );
}
import React, { Fragment } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, Transition } from '@headlessui/react';
import { StatCard } from '@/components/shared/StatCard';
import { DashboardSection } from '@/components/shared/DashboardSection';
import { CourseListItem } from '@/components/shared/CourseListItem';
import { QuickAction } from '@/components/shared/QuickAction';
import { Video, FileText, Award, BookOpen, Users, CheckCircle, Youtube, LogOut, ChevronDown } from 'lucide-react';
import { TrainerDashboardData } from '@/types';

interface TrainerDashboardProps {
    data?: TrainerDashboardData;
    youtube_connected: boolean;
}

export default function TrainerDashboard({ data, youtube_connected }: TrainerDashboardProps) {
    // Use data from props if available, otherwise use default/empty data
    const stats = data?.stats ? [
        { label: 'Total Courses', value: data.stats.total_courses, icon: BookOpen, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
        { label: 'Total Students', value: data.stats.total_students, icon: Users, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
        { label: 'Completed', value: data.stats.completed_courses, icon: CheckCircle, iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
        { label: 'Avg Rating', value: data.stats.average_rating, icon: Award, iconBg: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600 dark:text-yellow-400' },
    ] : [
        { label: 'Total Courses', value: 0, icon: BookOpen, iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
        { label: 'Total Students', value: 0, icon: Users, iconBg: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
        { label: 'Completed', value: 0, icon: CheckCircle, iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconColor: 'text-purple-600 dark:text-purple-400' },
        { label: 'Avg Rating', value: '0.0', icon: Award, iconBg: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600 dark:text-yellow-400' },
    ];

    const courses = data?.recent_courses || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Trainer Dashboard</h1>
                <div className="flex gap-2">
                    {youtube_connected ? (
                        <Menu as="div" className="relative">
                            <Menu.Button className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">YouTube Connected</span>
                                <ChevronDown className="w-4 h-4 ml-1" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-zinc-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 border border-gray-100 dark:border-zinc-700">
                                    <div className="p-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <Link
                                                    href="/auth/google/disconnect"
                                                    method="post"
                                                    as="button"
                                                    className={`${
                                                        active ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-gray-200'
                                                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                                                >
                                                    <LogOut className="mr-2 h-4 w-4" />
                                                    Disconnect
                                                </Link>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    ) : (
                        <a 
                            href="/auth/google" 
                            className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <Youtube className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium">Connect YouTube</span>
                        </a>
                    )}
                    <Link 
                        href="/courses/create" 
                        className="bg-[#DC1F2E] text-white px-6 py-2 rounded-lg hover:bg-[#B51826] transition-colors"
                    >
                        Create Course
                    </Link>
                </div>
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
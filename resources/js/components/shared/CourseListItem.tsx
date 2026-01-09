import { motion } from 'framer-motion';
import { Users, BookOpen, Star } from 'lucide-react';
import { Course } from '@/types';

interface CourseListItemProps {
    course: Course;
    index: number;
}

export const CourseListItem = ({ course, index }: CourseListItemProps) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 * index }}
        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-[#DC1F2E] transition-all cursor-pointer group"
    >
        <div className="w-20 h-20 bg-gradient-to-br from-[#DC1F2E] to-[#FF6B6B] rounded-lg flex items-center justify-center">
            <BookOpen className="text-white" size={32} />
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 mb-1 truncate group-hover:text-[#DC1F2E]">{course.title}</h4>
            {course.description && (
                <p className="text-sm text-gray-500 truncate mb-2">{course.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                    <Users size={14} /> {course.students_count || 0} students
                </span>
                {course.rating && (
                    <span className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" /> {course.rating}
                    </span>
                )}
                <span className={`px-2 py-0.5 rounded text-xs ${
                    course.status === 'published' ? 'bg-green-100 text-green-700' :
                    course.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-700'
                }`}>
                    {course.status}
                </span>
            </div>
        </div>
    </motion.div>
);
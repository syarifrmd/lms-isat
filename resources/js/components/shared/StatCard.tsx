import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    index: number;
}

export const StatCard = ({ label, value, icon: Icon, iconBg, iconColor, index }: StatCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
        <div className="flex items-center justify-between mb-4">
            <div className={`${iconBg} p-3 rounded-lg`}>
                <Icon className={iconColor} size={24} />
            </div>
        </div>
        <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1">{value}</div>
        <div className="text-gray-600 dark:text-gray-400 text-sm">{label}</div>
    </motion.div>
);

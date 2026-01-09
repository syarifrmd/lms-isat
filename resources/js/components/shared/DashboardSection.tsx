import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface DashboardSectionProps {
    title: string;
    children: ReactNode;
    action?: ReactNode;
    delay?: number;
}

export const DashboardSection = ({ title, children, action, delay = 0 }: DashboardSectionProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white rounded-xl p-6 shadow-sm"
    >
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
            {action}
        </div>
        {children}
    </motion.div>
);
import { LucideIcon } from 'lucide-react';

interface QuickActionProps {
    title: string;
    description: string;
    icon: LucideIcon;
    variant: 'blue' | 'green' | 'purple';
}

export const QuickAction = ({ title, description, icon: Icon, variant }: QuickActionProps) => {
    const themes = {
        blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', bgHover: 'group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50', text: 'text-blue-600 dark:text-blue-400' },
        green: { bg: 'bg-green-100 dark:bg-green-900/30', bgHover: 'group-hover:bg-green-200 dark:group-hover:bg-green-900/50', text: 'text-green-600 dark:text-green-400' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', bgHover: 'group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50', text: 'text-purple-600 dark:text-purple-400' },
    };

    return (
        <button className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-left group border border-transparent hover:border-gray-100 dark:hover:border-zinc-700">
            <div className={`${themes[variant].bg} ${themes[variant].bgHover} w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors`}>
                <Icon className={themes[variant].text} size={24} />
            </div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </button>
    );
};
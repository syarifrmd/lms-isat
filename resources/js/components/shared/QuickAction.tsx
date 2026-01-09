import { LucideIcon } from 'lucide-react';

interface QuickActionProps {
    title: string;
    description: string;
    icon: LucideIcon;
    variant: 'blue' | 'green' | 'purple';
}

export const QuickAction = ({ title, description, icon: Icon, variant }: QuickActionProps) => {
    const themes = {
        blue: { bg: 'bg-blue-100', bgHover: 'group-hover:bg-blue-200', text: 'text-blue-600' },
        green: { bg: 'bg-green-100', bgHover: 'group-hover:bg-green-200', text: 'text-green-600' },
        purple: { bg: 'bg-purple-100', bgHover: 'group-hover:bg-purple-200', text: 'text-purple-600' },
    };

    return (
        <button className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all text-left group border border-transparent hover:border-gray-100">
            <div className={`${themes[variant].bg} ${themes[variant].bgHover} w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors`}>
                <Icon className={themes[variant].text} size={24} />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
        </button>
    );
};
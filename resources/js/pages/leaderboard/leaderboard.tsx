import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

const breadcrumbs = [
    {
        title: 'Leaderboard',
        href: '/leaderboard',
    },
];

function Avatar({ user, size = 'md' }: { user: any; size?: 'sm' | 'md' | 'lg' }) {
    const sizes = { sm: 'h-9 w-9 text-sm', md: 'h-12 w-12 text-base', lg: 'h-16 w-16 text-xl' };
    return (
        <div className={`${sizes[size]} rounded-full overflow-hidden bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 font-bold flex items-center justify-center shrink-0`}>
            {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
            ) : (
                user.name.charAt(0).toUpperCase()
            )}
        </div>
    );
}

const podiumOrder = [1, 0, 2]; // visual order: 2nd (index 1), 1st (index 0), 3rd (index 2)
const podiumHeight = ['h-28', 'h-20', 'h-14']; // rank1=tallest, rank2=medium, rank3=shortest
const rankLabel = ['1st', '2nd', '3rd'];
const rankBadge = [
    'bg-amber-400 text-white',
    'bg-slate-300 text-white',
    'bg-orange-300 text-white',
];
const podiumCardBorder = [
    'ring-2 ring-amber-400',
    'ring-2 ring-slate-300',
    'ring-2 ring-orange-300',
];

export default function Leaderboard({ auth, leaderboard, currentUser }: any) {
    const top3 = leaderboard.slice(0, 3);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leaderboard" />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* My Position Card */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <Avatar user={currentUser.data} size="md" />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Your Rank</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600">#{currentUser.rank}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Total XP</p>
                        <p className="mt-0.5 text-2xl font-bold text-gray-800 dark:text-gray-100">{currentUser.data.xp.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">experience points</p>
                    </div>
                </div>

                {/* Podium + Full List side by side on desktop */}
                <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">

                {/* Podium — Top 3 */}
                {top3.length === 3 && (
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 flex-1 flex flex-col">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 text-center">Top 3</h2>
                        <div className="flex-1 flex items-end justify-center gap-4">
                            {podiumOrder.map((idx) => {
                                const user = top3[idx];
                                return (
                                    <div key={user.id} className="flex flex-col items-center gap-2 flex-1">
                                        {/* Badge */}
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rankBadge[idx]}`}>
                                            {rankLabel[idx]}
                                        </span>
                                        {/* Avatar */}
                                        <div className={`rounded-full ${podiumCardBorder[idx]} ring-offset-2 dark:ring-offset-gray-800`}>
                                            <Avatar user={user} size="lg" />
                                        </div>
                                        {/* Name */}
                                        <p className={`text-sm font-semibold text-center text-gray-800 dark:text-gray-100 leading-tight max-w-[90px] truncate ${user.is_current_user ? 'text-sky-600 dark:text-sky-400' : ''}`}>
                                            {user.name}
                                            {user.is_current_user && <span className="block text-xs font-normal text-sky-400">(you)</span>}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.xp.toLocaleString()} XP</p>
                                        {/* Podium block */}
                                        <div className={`w-full rounded-t-lg ${podiumHeight[idx]} ${idx === 0 ? 'bg-amber-100 dark:bg-amber-900/40' : idx === 1 ? 'bg-slate-100 dark:bg-slate-700/40' : 'bg-orange-100 dark:bg-orange-900/40'}`} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Full List */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
                        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Full Ranking</h2>
                        <span className="text-xs text-gray-300 dark:text-gray-600">{leaderboard.length} participants</span>
                    </div>

                    {leaderboard.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400">
                            No data yet. Be the first to earn XP!
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50 dark:divide-gray-700 overflow-y-auto flex-1">
                            {leaderboard.map((user: any) => {
                                const isMe = user.is_current_user;
                                return (
                                    <li
                                        key={user.id}
                                        className={`flex items-center gap-4 px-5 py-3 transition-colors ${isMe ? 'bg-sky-50/60 dark:bg-sky-900/30' : 'hover:bg-gray-50/60 dark:hover:bg-gray-700/40'}`}
                                    >
                                        <div className="w-8 text-center shrink-0">
                                            {user.rank === 1 && <span className="text-xs font-bold text-amber-500">1st</span>}
                                            {user.rank === 2 && <span className="text-xs font-bold text-slate-400">2nd</span>}
                                            {user.rank === 3 && <span className="text-xs font-bold text-orange-400">3rd</span>}
                                            {user.rank > 3 && <span className="text-xs font-medium text-gray-300">#{user.rank}</span>}
                                        </div>
                                        <Avatar user={user} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <p className={`truncate text-sm font-medium ${isMe ? 'text-sky-600 dark:text-sky-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                                {user.name}
                                                {isMe && <span className="ml-1.5 text-xs text-sky-400 font-normal">(you)</span>}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user.xp.toLocaleString()}</span>
                                            <span className="ml-1 text-xs text-gray-300 dark:text-gray-600">XP</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                </div>{/* end side by side */}

            </div>
        </AppLayout>
    );
}

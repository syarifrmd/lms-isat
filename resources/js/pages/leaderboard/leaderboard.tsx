import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

const breadcrumbs = [
    {
        title: 'Leaderboard',
        href: '/leaderboard',
    },
];

export default function Leaderboard({ auth, leaderboard, currentUser }: any) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Leaderboard" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    
                    {/* Kartu User Saya */}
                    <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold">Posisi Anda</h3>
                            <div className="text-3xl font-extrabold mt-1">#{currentUser.rank}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm opacity-90">Total XP</div>
                            <div className="text-2xl font-bold">{currentUser.data.xp.toLocaleString()} XP</div>
                        </div>
                    </div>

                    {/* Tabel Leaderboard */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h3 className="text-lg font-semibold mb-4">Top 50 Learners</h3>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-gray-500 text-sm">
                                            <th className="py-3 px-4 w-16">Rank</th>
                                            <th className="py-3 px-4">User</th>
                                            <th className="py-3 px-4 text-right">XP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((user: any) => (
                                            <tr 
                                                key={user.id} 
                                                className={`border-b border-gray-100 hover:bg-gray-50 transition ${user.is_current_user ? 'bg-indigo-50' : ''}`}
                                            >
                                                <td className="py-3 px-4">
                                                    {user.rank === 1 && <span className="text-xl">🥇</span>}
                                                    {user.rank === 2 && <span className="text-xl">🥈</span>}
                                                    {user.rank === 3 && <span className="text-xl">🥉</span>}
                                                    {user.rank > 3 && <span className="font-bold text-gray-600">#{user.rank}</span>}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold mr-3 overflow-hidden">
                                                            {user.avatar ? (
                                                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                user.name.charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className={`font-medium ${user.is_current_user ? 'text-indigo-600' : 'text-gray-900'}`}>
                                                                {user.name} {user.is_current_user && '(You)'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-gray-700">
                                                    {user.xp.toLocaleString()} XP
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {leaderboard.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    Belum ada data leaderboard. Jadilah yang pertama mendapatkan XP!
                                </div>
                            )}
                        </div>
                    </div>
            </div>
        </AppLayout>
    );
}
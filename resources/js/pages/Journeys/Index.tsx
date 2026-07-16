import AppLayout from '@/layouts/app-layout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ClockIcon, PlusCircle, Trash, BookOpen, AlertCircle, Bookmark, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SharedData } from '@/types';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { EnrollmentModal } from '@/components/EnrollmentModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Journey {
    id: number;
    title: string;
    description: string;
    cover_url: string;
    status: string; // draft, published, archived
    created_by: number;
    created_at: string;
    creator: {
        name: string;
    };
    target_division?: string;
    is_mandatory?: boolean | number;
    is_locked?: boolean | number;
}

export default function JourneysIndex({ 
    journeys, 
    filters, 
    divisions 
}: { 
    journeys: {
        data: Journey[];
        current_page: number;
        last_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    filters: { search?: string; division?: string }; 
    divisions: string[]; 
}) {
    const { auth } = usePage<SharedData>().props;
    const canCreateCourse = auth.user.role?.toLowerCase() === 'trainer' || auth.user.role?.toLowerCase() === 'admin';
    const isAdmin = auth.user.role?.toLowerCase() === 'admin';
    const [journeyToDelete, setJourneyToDelete] = useState<number | null>(null);

    const [search, setSearch] = useState(filters?.search || '');
    const [division, setDivision] = useState(filters?.division || 'all');

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search !== (filters?.search || '')) {
                updateFilters(search, division);
            }
        }, 500); 

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    const updateFilters = (newSearch: string, newDivision: string) => {
        router.get(
            '/journeys',
            {
                search: newSearch || undefined,
                division: newDivision === 'all' ? undefined : newDivision, 
            },
            {
                preserveState: true, 
                replace: true,
            }
        );
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleDivisionChange = (val: string) => {
        setDivision(val);
        updateFilters(search, val);
    };
    
    const handleDelete = () => {
        if (journeyToDelete) {
            router.delete(`/journeys/${journeyToDelete}`, {
                onSuccess: () => setJourneyToDelete(null),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Journeys', href: '/journeys' }]}>
            <Head title="Journeys" />

            <div className="mx-auto max-w-8xl px-4 py-6 flex flex-col gap-6">

                {/* Header */}
                <div className="rounded-2xl border border-sky-100 dark:border-sky-900 bg-gradient-to-br from-sky-50 to-white dark:from-sky-950 dark:to-gray-900 p-5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Learning Portal</p>
                            <p className="mt-0.5 text-2xl font-bold text-sky-600">Available Journeys</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-widest text-sky-400">Total</p>
                        <p className="mt-0.5 text-2xl font-bold text-gray-800 dark:text-gray-100">{journeys.total}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">journeys available</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-wrap">
                        {/* Search hanya tampil untuk admin, disembunyikan untuk user biasa */}
                        {isAdmin && (
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Cari journey..."
                                    value={search}
                                    onChange={handleSearchChange}
                                    className="pl-9"
                                />
                            </div>
                        )}

                        {/* FILTER DROPDOWN DIVISI  */}
                        {auth?.user?.role === 'admin' && (
                            <Select value={division} onValueChange={handleDivisionChange}>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue>
                                        {division === 'all' ? 'Semua Divisi' : division}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Divisi</SelectItem>
                                    {divisions && divisions.map(div => (
                                        <SelectItem key={div} value={div}>{div}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {canCreateCourse && (
                        <div className="flex justify-end">
                            <Link
                                href="/journeys/create"
                                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 transition-colors shadow-sm"
                            >
                                <PlusCircle className="h-4 w-4" />
                                Create Journey
                            </Link>
                        </div>
                    )}
                </div>

                {/* Course Grid */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">All Journeys</h2>
                        <span className="text-xs text-gray-300 dark:text-gray-600">{journeys.total} journeys</span>
                    </div>

                    {journeys.data.length === 0 ? (
                        <div className="py-16 text-center text-sm text-gray-400">
                            No journeys available yet for this selection.
                        </div>
                    ) : (
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {journeys.data.map((journey, index) => {
                                // Proteksi Pengguna Biasa: Jika statusnya bukan published, jangan dirender ke tampilan USER biasa
                                if (!canCreateCourse && ['draft', 'archived'].includes(journey.status?.toLowerCase())) {
                                    return null;
                                }

                                const isLocked = !canCreateCourse && !!journey.is_locked;

                                return (
                                    <div
                                        key={`${journey.id}-${index}`}
                                        className="relative rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden"
                                    >
                                        {/* Overlay Gembok 1 Card Penuh jika status Terkunci */}
                                        {isLocked && (
                                            <div className="absolute inset-0 z-30 flex items-center justify-center transition-all duration-300">
                                                <div className="h-14 w-14 rounded-full bg-gray-600/90 dark:bg-gray-700/90 text-white shadow-xl flex items-center justify-center border border-gray-500/30">
                                                    <Lock className="h-6 w-6" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Cover */}
                                        <div 
                                            className={`relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 ${!isLocked ? 'cursor-pointer' : ''}`}
                                            onClick={() => {
                                                if (isLocked) return;
                                                router.get(`/courses?journey_id=${journey.id}`);
                                            }}
                                        >
                                            {journey.cover_url ? (
                                                <img
                                                    src={journey.cover_url}
                                                    alt={journey.title}
                                                    className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                                                    <span className="text-3xl font-bold">{journey.title.charAt(0)}</span>
                                                </div>
                                            )}
                                            {/* Label overlay dipindahkan ke body agar berdampingan dengan Published */}
                                        </div>

                                        {/* Body */}
                                        <div className="flex flex-col flex-1 px-4 pt-4 pb-4 gap-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {/* LABEL STATUS (DRAFT/PUBLISHED/ARCHIVED) - HANYA TRAINER & ADMIN */}
                                                {canCreateCourse && (
                                                    <>
                                                        {journey.status === 'draft' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60">
                                                                Draft
                                                            </span>
                                                        )}
                                                        {journey.status === 'published' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/60">
                                                                Published
                                                            </span>
                                                        )}
                                                        {journey.status === 'archived' && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                                                                Archived
                                                            </span>
                                                        )}
                                                    </>
                                                )}

                                                {/* PINDAHAN BARU: Badge Mandatory / Non-Mandatory di sebelah status */}
                                                {journey.is_mandatory !== undefined && journey.is_mandatory !== null && (
                                                    <span className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${journey.is_mandatory ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
                                                        {journey.is_mandatory ? 'Mandatory' : 'Non-Mandatory'}
                                                    </span>
                                                )}
                                                
                                                {/* PINDAHAN BARU: Badge Target Division di sebelah status */}
                                                {journey.target_division && (
                                                    <span className="inline-flex items-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900/60">
                                                        {journey.target_division}
                                                    </span>
                                                )}
                                            </div>

                                            <p 
                                                className={`text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 leading-snug ${!isLocked ? 'hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors' : ''}`}
                                                onClick={() => {
                                                    if (isLocked) return;
                                                    router.get(`/courses?journey_id=${journey.id}`);
                                                }}
                                            >
                                                {journey.title}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-3 flex-1">
                                                {journey.description || 'No description available for this journey.'}
                                            </p>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 mt-auto">
                                                <div className="flex items-center gap-1 text-xs text-gray-300 dark:text-gray-600">
                                                    <ClockIcon className="h-3 w-3" />
                                                    <span>{formatDistanceToNow(new Date(journey.created_at), { addSuffix: true })}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {canCreateCourse ? (
                                                        <>
                                                            {(auth?.user?.role === 'admin' || auth?.user?.id === journey.created_by || (auth?.user?.role === 'trainer' && !!journey.target_division && !!auth?.user?.division && journey.target_division.split(', ').includes(auth?.user?.division))) && (
                                                                <>
                                                                    <button
                                                                        onClick={() => setJourneyToDelete(journey.id)}
                                                                        className="group inline-flex items-center gap-1 cursor-pointer border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-700 dark:hover:text-white px-2.5 py-1 rounded-xl text-xs font-medium transition-all duration-200"
                                                                    >
                                                                        <Trash className="h-3.5 w-3.5" />
                                                                        Remove
                                                                    </button>
                                                                    <Link
                                                                        href={`/journeys/${journey.id}/edit`}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/40 text-xs font-medium transition-colors"
                                                                    >
                                                                        Edit
                                                                    </Link>
                                                                </>
                                                            )}
                                                            <Link
                                                                href={`/courses?journey_id=${journey.id}`}
                                                                className="inline-flex items-center px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/40 text-xs font-medium transition-colors"
                                                            >
                                                                View
                                                            </Link>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => { if (!isLocked) router.get(`/courses?journey_id=${journey.id}`); }}
                                                            disabled={isLocked}
                                                            className={`inline-flex items-center px-2.5 py-1 rounded-xl text-white text-xs font-semibold transition-colors shadow-sm ${isLocked ? 'bg-sky-600' : 'bg-sky-600 hover:bg-sky-700'}`}
                                                        >
                                                            Lihat Course
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {journeys.links && journeys.links.length > 3 && (
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-center">
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                {journeys.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveState
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border ${
                                            link.active
                                                ? 'z-10 bg-sky-50 border-sky-500 text-sky-600 dark:bg-sky-900/50 dark:border-sky-500 dark:text-sky-400'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                                        } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}
                                        ${i === 0 ? 'rounded-l-md' : ''} ${i === journeys.links.length - 1 ? 'rounded-r-md' : ''}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </div>
                    )}
                </div>

            </div>

            <AlertDialog open={!!journeyToDelete} onOpenChange={(open) => !open && setJourneyToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the journey and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </AppLayout>
    );
}
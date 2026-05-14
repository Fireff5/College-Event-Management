import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { DashboardStats, Result } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Medal } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentResults, setRecentResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, resultsRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/results')
                ]);
                setStats(statsRes.data);
                // Take top 5 recent results for dashboard (assuming order means recent)
                const sortedResults = resultsRes.data.sort((a: any, b: any) => b.id - a.id).slice(0, 5);
                setRecentResults(sortedResults);
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading dashboard data...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <p className="text-slate-500 mt-2">Overview of the sports meet progress and recent activity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 content-center">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                            Total Participants
                        </CardTitle>
                        <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-slate-900">{stats?.totalParticipants || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 content-center">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                            Events Scheduled
                        </CardTitle>
                        <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                            <Trophy className="h-5 w-5 text-emerald-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-slate-900">{stats?.totalEvents || 0}</div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 content-center">
                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                            Results Recorded
                        </CardTitle>
                        <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center">
                            <Medal className="h-5 w-5 text-amber-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-slate-900">{stats?.totalResults || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle>Recent Results</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentResults.length === 0 ? (
                            <div className="text-center py-6 text-slate-500">No results recorded yet.</div>
                        ) : (
                            recentResults.map((result) => (
                                <div key={result.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            {result.position === 1 ? <Medal className="h-5 w-5 text-yellow-500" /> :
                                                result.position === 2 ? <Medal className="h-5 w-5 text-slate-400" /> :
                                                    <Medal className="h-5 w-5 text-amber-600" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{result.participant?.name} <span className="text-slate-400 text-sm font-normal">({result.participant?.id})</span></p>
                                            <p className="text-sm text-slate-500">{result.event?.name} • <span className="text-blue-600 font-medium">Position: {result.position}</span></p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;

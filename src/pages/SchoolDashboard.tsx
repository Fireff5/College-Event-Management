import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Event, AdminMessage } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    School, LogOut, CalendarDays, Users, ClipboardList, MessageSquare,
    Trophy, MapPin, Clock, Hash,
    Inbox, CheckCircle2, UserCheck
} from 'lucide-react';

type Tab = 'events' | 'students' | 'registrations' | 'messages';

// Shape returned by GET /schools/:id/students
interface SchoolStudent {
    id: string;
    name: string;
    events: string[]; // event names
}

// Shape returned by GET /schools/:id/registrations
interface SchoolRegistration {
    id: string;
    studentName: string;
    event: Event;
}

const SchoolDashboard = () => {
    const { schoolData, schoolLogout } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<Tab>('events');
    const [events, setEvents] = useState<Event[]>([]);
    const [students, setStudents] = useState<SchoolStudent[]>([]);
    const [registrations, setRegistrations] = useState<SchoolRegistration[]>([]);
    const [messages, setMessages] = useState<AdminMessage[]>([]);
    const [loading, setLoading] = useState(false);

    const schoolId = schoolData?.id || '';

    useEffect(() => {
        fetchTab(activeTab);
    }, [activeTab]);

    const fetchTab = async (tab: Tab) => {
        setLoading(true);
        try {
            if (tab === 'events') {
                const res = await api.get(`/schools/${schoolId}/events`);
                setEvents(res.data);
            } else if (tab === 'students') {
                const res = await api.get(`/schools/${schoolId}/students`);
                setStudents(res.data);
            } else if (tab === 'registrations') {
                const res = await api.get(`/schools/${schoolId}/registrations`);
                setRegistrations(res.data);
            } else if (tab === 'messages') {
                const res = await api.get(`/schools/${schoolId}/messages`);
                setMessages(res.data);
            }
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        schoolLogout();
        navigate('/school/login');
    };

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'events', label: 'Event Details', icon: <CalendarDays size={18} /> },
        { key: 'students', label: 'Student Details', icon: <Users size={18} /> },
        { key: 'registrations', label: 'Registrations', icon: <ClipboardList size={18} /> },
        { key: 'messages', label: 'Messages from Admin', icon: <MessageSquare size={18} /> },
    ];

    const categoryColors: Record<string, string> = {
        Track: 'bg-blue-100 text-blue-700',
        Field: 'bg-green-100 text-green-700',
        Swimming: 'bg-cyan-100 text-cyan-700',
        'Team Sport': 'bg-purple-100 text-purple-700',
        'School Events': 'bg-amber-100 text-amber-700',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <School size={20} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 leading-tight">{schoolData?.name || 'School Portal'}</p>
                            <p className="text-xs text-slate-500">{schoolData?.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-red-500 hover:bg-red-50 gap-2">
                        <LogOut size={16} />Logout
                    </Button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white mb-8 shadow-lg">
                    <h1 className="text-2xl font-bold mb-1">Welcome, {schoolData?.name}!</h1>
                    <p className="text-emerald-100 text-sm">
                        School ID: <span className="font-mono bg-white/20 px-2 py-0.5 rounded">{schoolData?.id}</span>
                    </p>
                    {/* Quick stats */}
                    <div className="flex gap-4 mt-4">
                        <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                            <p className="text-xl font-bold">{schoolData?.registeredEvents?.length ?? 0}</p>
                            <p className="text-xs text-emerald-100">Events</p>
                        </div>
                        <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                            <p className="text-xl font-bold">{schoolData?.studentNames?.length ?? 0}</p>
                            <p className="text-xs text-emerald-100">Students</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-1 bg-white rounded-xl p-1 border border-slate-200 shadow-sm mb-6 w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.key
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent" />
                    </div>
                ) : (
                    <>
                        {/* EVENTS TAB */}
                        {activeTab === 'events' && (
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <Trophy size={20} className="text-emerald-600" /> Registered Events
                                </h2>
                                {events.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400">No events registered yet.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {events.map(ev => (
                                            <Card key={ev.id} className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-start justify-between">
                                                        <CardTitle className="text-base font-semibold text-slate-800 leading-snug">{ev.name}</CardTitle>
                                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 shrink-0 ${categoryColors[ev.category] || 'bg-slate-100 text-slate-600'}`}>
                                                            {ev.category}
                                                        </span>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-2 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays size={14} className="text-slate-400" />
                                                        {new Date(ev.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={14} className="text-slate-400" />{ev.venue}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users size={14} className="text-slate-400" />
                                                        Max: {ev.max_participants} participants
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STUDENTS TAB */}
                        {activeTab === 'students' && (
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <Users size={20} className="text-emerald-600" /> Registered Students
                                </h2>
                                {students.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400">
                                        No students registered. Add student names during school registration.
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                                                            <div className="flex items-center gap-1"><Hash size={14} /> #</div>
                                                        </th>
                                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                                                            <div className="flex items-center gap-1"><UserCheck size={14} /> Student Name</div>
                                                        </th>
                                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">
                                                            <div className="flex items-center gap-1"><Trophy size={14} /> Registered Events</div>
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {students.map((s, idx) => (
                                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3 text-slate-400 text-xs font-mono">{idx + 1}</td>
                                                            <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {s.events.length > 0
                                                                        ? s.events.map((evName, i) => (
                                                                            <Badge key={i} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs font-medium">
                                                                                {evName}
                                                                            </Badge>
                                                                        ))
                                                                        : <span className="text-slate-400 text-xs">—</span>
                                                                    }
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* REGISTRATIONS TAB */}
                        {activeTab === 'registrations' && (
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <ClipboardList size={20} className="text-emerald-600" /> Registration Details
                                </h2>
                                {registrations.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400">No registrations found.</div>
                                ) : (
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200">
                                                    <tr>
                                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Student Name</th>
                                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Event</th>
                                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Category</th>
                                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Date</th>
                                                        <th className="text-left px-4 py-3 text-slate-600 font-semibold">Venue</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {registrations.map((r) => (
                                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                                                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                                {r.studentName}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-700 font-medium">{r.event?.name}</td>
                                                            <td className="px-4 py-3">
                                                                {r.event?.category && (
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[r.event.category] || 'bg-slate-100 text-slate-600'}`}>
                                                                        {r.event.category}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500">
                                                                {r.event?.date && new Date(r.event.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-500">{r.event?.venue}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* MESSAGES TAB */}
                        {activeTab === 'messages' && (
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                    <Inbox size={20} className="text-emerald-600" /> Messages from Admin
                                </h2>
                                {messages.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400">
                                        <MessageSquare size={40} className="mx-auto mb-3 text-slate-200" />
                                        No messages yet. The admin will send information here.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map(msg => (
                                            <Card key={msg.id} className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between">
                                                        <CardTitle className="text-base font-semibold text-slate-800">{msg.subject}</CardTitle>
                                                        <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 ml-4">
                                                            <Clock size={12} />
                                                            {new Date(msg.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </span>
                                                    </div>
                                                    <Badge className="w-fit bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">From: Admin</Badge>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed">{msg.body}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default SchoolDashboard;

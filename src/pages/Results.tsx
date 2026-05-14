import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Result, Event, Participant, School } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Medal, Trophy, GraduationCap, X, BookOpen, School as SchoolIcon, Eye } from 'lucide-react';

interface SchoolResult {
    id: number;
    schoolId: string;
    schoolName: string;
    studentName: string;
    eventId: number;
    eventName: string;
    position: 1 | 2 | 3;
    remarks: string;
}

interface StudentDetailModal {
    studentName: string;
    schoolName: string;
    eventName: string;
    position: 1 | 2 | 3;
    remarks: string;
}

const PositionBadge = ({ position }: { position: 1 | 2 | 3 }) => {
    const configs = {
        1: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', icon: '🥇', label: '1st Place' },
        2: { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-600', icon: '🥈', label: '2nd Place' },
        3: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', icon: '🥉', label: '3rd Place' },
    };
    const c = configs[position];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.border} ${c.text}`}>
            <span>{c.icon}</span>{c.label}
        </span>
    );
};

const Results = () => {
    // ── Regular results state ────────────────────────────────────
    const [results, setResults] = useState<Result[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
    const [formData, setFormData] = useState({ event_id: '', participant_id: '', position: '1', remarks: '' });

    // ── School results state ─────────────────────────────────────
    const [schoolResults, setSchoolResults] = useState<SchoolResult[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [activeTab, setActiveTab] = useState<'regular' | 'school'>('regular');
    const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false);
    const [detailModal, setDetailModal] = useState<StudentDetailModal | null>(null);
    const [schoolEventFilter, setSchoolEventFilter] = useState<string>('all');

    // School result form
    const [schoolForm, setSchoolForm] = useState({
        schoolId: '',
        eventId: '',
        studentName: '',
        position: '1',
        remarks: '',
    });

    const { toast } = useToast();

    // ── Derived: students for selected school+event ──────────────
    // Show all School Events category events in the dropdown
    const schoolEventsList = events.filter(e => e.category === 'School Events');
    // Fall back to all events if no School Events category exists
    const eventsForSchoolForm = schoolEventsList.length > 0 ? schoolEventsList : events;

    // ── School events that appear in school events filter ────────
    const schoolEventOptions = Array.from(
        new Map(schoolResults.map(r => [r.eventId, r.eventName])).entries()
    ).map(([id, name]) => ({ id, name }));

    // ── Fetch all data ───────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        try {
            const [resResults, resEvents, resParticipants, resSchools, resSchoolResults] = await Promise.all([
                api.get('/results'),
                api.get('/events'),
                api.get('/participants'),
                api.get('/schools'),
                api.get('/school-results'),
            ]);
            setResults(resResults.data);
            setEvents(resEvents.data);
            setParticipants(resParticipants.data);
            setSchools(resSchools.data);
            setSchoolResults(resSchoolResults.data);
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch data' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // ── Regular result handlers ──────────────────────────────────
    const handleOpenDialog = () => {
        setFormData({ event_id: '', participant_id: '', position: '1', remarks: '' });
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.event_id || !formData.participant_id) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select an event and participant' });
            return;
        }
        try {
            await api.post('/results', {
                event_id: parseInt(formData.event_id),
                participant_id: formData.participant_id,
                position: parseInt(formData.position),
                remarks: formData.remarks,
            });
            toast({ title: 'Recorded', description: 'Result recorded successfully' });
            setIsDialogOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed', description: error.response?.data || 'Could not record result' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this result?')) return;
        try {
            await api.delete(`/results/${id}`);
            toast({ title: 'Deleted', description: 'Result removed' });
            fetchData();
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
        }
    };

    // ── School result handlers ───────────────────────────────────
    const handleOpenSchoolDialog = () => {
        setSchoolForm({ schoolId: '', eventId: '', studentName: '', position: '1', remarks: '' });
        setIsSchoolDialogOpen(true);
    };

    const handleSchoolSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolForm.schoolId || !schoolForm.eventId || !schoolForm.studentName.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please fill in school, event and student name' });
            return;
        }
        const school = schools.find(s => s.id === schoolForm.schoolId);
        const event = events.find(ev => ev.id === Number(schoolForm.eventId));
        try {
            await api.post('/school-results', {
                schoolId: schoolForm.schoolId,
                schoolName: school?.name ?? '',
                studentName: schoolForm.studentName.trim(),
                eventId: Number(schoolForm.eventId),
                eventName: event?.name ?? '',
                position: parseInt(schoolForm.position),
                remarks: schoolForm.remarks,
            });
            toast({ title: 'Recorded', description: `Position recorded for ${schoolForm.studentName.trim()}` });
            setIsSchoolDialogOpen(false);
            fetchData();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed', description: error.response?.data || 'Could not record result' });
        }
    };

    const handleSchoolDelete = async (id: number) => {
        if (!confirm('Remove this result?')) return;
        try {
            await api.delete(`/school-results/${id}`);
            toast({ title: 'Deleted', description: 'Result removed' });
            fetchData();
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete' });
        }
    };

    // ── Filtered lists ───────────────────────────────────────────
    const filteredResults = selectedEventFilter === 'all'
        ? results
        : results.filter(r => r.event_id.toString() === selectedEventFilter);

    const filteredSchoolResults = schoolEventFilter === 'all'
        ? schoolResults
        : schoolResults.filter(r => r.eventId.toString() === schoolEventFilter);



    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Results</h1>
                <p className="text-slate-500 mt-1">Record and manage event outcomes and winners.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveTab('regular')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'regular'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Trophy className="h-4 w-4" /> College Participants
                </button>
                <button
                    onClick={() => setActiveTab('school')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'school'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <GraduationCap className="h-4 w-4" /> School Students
                    {schoolResults.length > 0 && (
                        <span className="ml-1 bg-indigo-100 text-indigo-700 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                            {schoolResults.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ═══ REGULAR RESULTS TAB ═══════════════════════════════════ */}
            {activeTab === 'regular' && (
                <>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <Select value={selectedEventFilter} onValueChange={setSelectedEventFilter}>
                            <SelectTrigger className="w-[200px] bg-white">
                                <SelectValue placeholder="Filter by Event" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                {events.map(event => (
                                    <SelectItem key={event.id} value={event.id.toString()}>{event.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={handleOpenDialog} className="bg-amber-600 hover:bg-amber-700 text-white">
                                    <Plus className="mr-2 h-4 w-4" /> Record Result
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
                                <DialogHeader>
                                    <DialogTitle>Record New Result</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Event</Label>
                                        <Select value={formData.event_id} onValueChange={v => setFormData({ ...formData, event_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Event" /></SelectTrigger>
                                            <SelectContent>
                                                {events.map(e => <SelectItem key={e.id} value={e.id.toString()}>{e.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Participant</Label>
                                        <Select value={formData.participant_id} onValueChange={v => setFormData({ ...formData, participant_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Participant" /></SelectTrigger>
                                            <SelectContent>
                                                {participants.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Position</Label>
                                        <Select value={formData.position} onValueChange={v => setFormData({ ...formData, position: v })}>
                                            <SelectTrigger><SelectValue placeholder="Select Position" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">1st Place (Gold)</SelectItem>
                                                <SelectItem value="2">2nd Place (Silver)</SelectItem>
                                                <SelectItem value="3">3rd Place (Bronze)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="remarks">Remarks (Optional)</Label>
                                        <Input id="remarks" value={formData.remarks} onChange={e => setFormData({ ...formData, remarks: e.target.value })} placeholder="e.g., New Record 9.58s" />
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit">Save Result</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-semibold">Event</TableHead>
                                    <TableHead className="font-semibold">Position</TableHead>
                                    <TableHead className="font-semibold">Participant Details</TableHead>
                                    <TableHead className="font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-slate-500">Loading...</TableCell></TableRow>
                                ) : filteredResults.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center h-24 text-slate-500">No results recorded.</TableCell></TableRow>
                                ) : (
                                    filteredResults.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="h-4 w-4 text-slate-400" />
                                                    <span className="font-medium text-slate-900">{r.event?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {r.position === 1 ? <Medal className="h-5 w-5 text-yellow-500" /> :
                                                        r.position === 2 ? <Medal className="h-5 w-5 text-slate-400" /> :
                                                            <Medal className="h-5 w-5 text-amber-600" />}
                                                    <span className="font-bold tabular-nums">{r.position}{r.position === 1 ? 'st' : r.position === 2 ? 'nd' : 'rd'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-slate-900">{r.participant?.name} <span className="text-slate-400 text-sm font-normal">({r.participant_id})</span></div>
                                                {r.remarks && <div className="text-xs text-slate-500 mt-1 italic">"{r.remarks}"</div>}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </>
            )}

            {/* ═══ SCHOOL STUDENTS TAB ════════════════════════════════════ */}
            {activeTab === 'school' && (
                <>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        {/* Filter */}
                        <Select value={schoolEventFilter} onValueChange={setSchoolEventFilter}>
                            <SelectTrigger className="w-[220px] bg-white">
                                <SelectValue placeholder="Filter by Event" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                {schoolEventOptions.map(ev => (
                                    <SelectItem key={ev.id} value={ev.id.toString()}>{ev.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Record button */}
                        <Button onClick={handleOpenSchoolDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Record School Result
                        </Button>
                    </div>

                    {/* School results table */}
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-semibold">Student</TableHead>
                                    <TableHead className="font-semibold">School</TableHead>
                                    <TableHead className="font-semibold">Event</TableHead>
                                    <TableHead className="font-semibold">Position</TableHead>
                                    <TableHead className="font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-slate-500">Loading...</TableCell></TableRow>
                                ) : filteredSchoolResults.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-32 text-slate-400">
                                            <GraduationCap className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                                            No school student results recorded yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSchoolResults.map((r) => (
                                        <TableRow key={r.id}>
                                            {/* Student name — clickable */}
                                            <TableCell>
                                                <button
                                                    onClick={() => setDetailModal({
                                                        studentName: r.studentName,
                                                        schoolName: r.schoolName,
                                                        eventName: r.eventName,
                                                        position: r.position,
                                                        remarks: r.remarks,
                                                    })}
                                                    className="flex items-center gap-2.5 group"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-700 font-bold text-sm">
                                                        {r.studentName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-medium text-slate-800 group-hover:text-indigo-600 group-hover:underline transition-colors">
                                                        {r.studentName}
                                                    </span>
                                                    <Eye className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center shrink-0">
                                                        <SchoolIcon className="h-3 w-3 text-emerald-600" />
                                                    </div>
                                                    <span className="text-sm text-slate-600">{r.schoolName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                    <Trophy className="h-3 w-3" />{r.eventName}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <PositionBadge position={r.position} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleSchoolDelete(r.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* School result form dialog */}
                    {isSchoolDialogOpen && (
                        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <GraduationCap className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">Record School Result</h3>
                                            <p className="text-xs text-slate-500">Assign a winning position to a school student</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsSchoolDialogOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSchoolSubmit} className="px-6 py-5 space-y-4">
                                    {/* School select */}
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                            <SchoolIcon className="h-3.5 w-3.5 text-emerald-500" /> School
                                        </Label>
                                        <Select value={schoolForm.schoolId} onValueChange={v => setSchoolForm({ ...schoolForm, schoolId: v, eventId: '', studentName: '' })}>
                                            <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Select School" /></SelectTrigger>
                                            <SelectContent>
                                                {schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Event select — all events (filtered to School Events category if available) */}
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                            <Trophy className="h-3.5 w-3.5 text-amber-500" /> Event
                                        </Label>
                                        <Select
                                            value={schoolForm.eventId}
                                            onValueChange={v => setSchoolForm({ ...schoolForm, eventId: v, studentName: '' })}
                                        >
                                            <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Select Event" /></SelectTrigger>
                                            <SelectContent>
                                                {eventsForSchoolForm.map(ev => (
                                                    <SelectItem key={ev.id} value={ev.id.toString()}>{ev.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Student name — free-text input */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="school-student-name" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                            <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> Student Name
                                        </Label>
                                        <Input
                                            id="school-student-name"
                                            value={schoolForm.studentName}
                                            onChange={e => setSchoolForm({ ...schoolForm, studentName: e.target.value })}
                                            placeholder="Enter student's full name"
                                            className="bg-slate-50 border-slate-200"
                                        />
                                    </div>

                                    {/* Position select */}
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                            <Medal className="h-3.5 w-3.5 text-yellow-500" /> Position
                                        </Label>
                                        <Select value={schoolForm.position} onValueChange={v => setSchoolForm({ ...schoolForm, position: v })}>
                                            <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">🥇 1st Place (Gold)</SelectItem>
                                                <SelectItem value="2">🥈 2nd Place (Silver)</SelectItem>
                                                <SelectItem value="3">🥉 3rd Place (Bronze)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Remarks */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="school-remarks" className="text-sm font-medium text-slate-700">Remarks (Optional)</Label>
                                        <Input
                                            id="school-remarks"
                                            value={schoolForm.remarks}
                                            onChange={e => setSchoolForm({ ...schoolForm, remarks: e.target.value })}
                                            placeholder="e.g., Outstanding performance"
                                            className="bg-slate-50 border-slate-200"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button type="button" variant="outline" onClick={() => setIsSchoolDialogOpen(false)} className="flex-1 border-slate-200">Cancel</Button>
                                        <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Save Result</Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Student detail modal */}
                    {detailModal && (
                        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                                {/* Header band */}
                                <div className={`px-6 py-5 text-center ${detailModal.position === 1 ? 'bg-gradient-to-br from-yellow-50 to-amber-50' : detailModal.position === 2 ? 'bg-gradient-to-br from-slate-50 to-slate-100' : 'bg-gradient-to-br from-amber-50 to-orange-50'}`}>
                                    <div className="text-4xl mb-2">{detailModal.position === 1 ? '🥇' : detailModal.position === 2 ? '🥈' : '🥉'}</div>
                                    <h3 className="text-lg font-bold text-slate-800">{detailModal.studentName}</h3>
                                    <PositionBadge position={detailModal.position} />
                                </div>

                                <div className="px-6 py-5 space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <SchoolIcon className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">School</p>
                                            <p className="text-sm font-semibold text-slate-700">{detailModal.schoolName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <Trophy className="h-4 w-4 text-indigo-500 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Event</p>
                                            <p className="text-sm font-semibold text-slate-700">{detailModal.eventName}</p>
                                        </div>
                                    </div>
                                    {detailModal.remarks && (
                                        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                            <Medal className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Remarks</p>
                                                <p className="text-sm text-slate-600 italic">"{detailModal.remarks}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="px-6 pb-6">
                                    <Button onClick={() => setDetailModal(null)} className="w-full bg-slate-800 hover:bg-slate-900 text-white">
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Results;

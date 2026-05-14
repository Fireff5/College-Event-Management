import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { School, AdminMessage, Event } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    School as SchoolIcon, Send, Search, Mail, Phone, MapPin,
    CalendarDays, MessageSquare, X, Pencil, Trash2, AlertTriangle, BookOpen,
    ChevronDown, ChevronUp, Trophy, Users
} from 'lucide-react';

interface MessageDialog {
    school: School;
    subject: string;
    body: string;
    loading: boolean;
}

interface EditDialog {
    school: School;
    name: string;
    phone: string;
    address: string;
    loading: boolean;
}

interface DeleteDialog {
    school: School;
    loading: boolean;
}

interface SchoolWithMessages extends School {
    messages?: AdminMessage[];
    expanded?: boolean;
}

const Schools = () => {
    const [schools, setSchools] = useState<SchoolWithMessages[]>([]);
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState<MessageDialog | null>(null);
    const [editDialog, setEditDialog] = useState<EditDialog | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<DeleteDialog | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    useEffect(() => {
        fetchSchools();
        // Fetch all events once for name resolution
        api.get('/events').then(res => setAllEvents(res.data)).catch(() => { });
    }, []);

    const getEventName = (id: number) => allEvents.find(e => Number(e.id) === Number(id))?.name || `Event #${id}`;
    const getEventCategory = (id: number) => allEvents.find(e => Number(e.id) === Number(id))?.category;

    const toggleExpand = (id: string) =>
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    const fetchSchools = async () => {
        setLoading(true);
        try {
            const res = await api.get('/schools');
            setSchools(res.data);
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch schools.' });
        } finally {
            setLoading(false);
        }
    };

    // ── Message ──────────────────────────────────────────────────────────────
    const openDialog = (school: School) => setDialog({ school, subject: '', body: '', loading: false });
    const closeDialog = () => setDialog(null);

    const handleSendMessage = async () => {
        if (!dialog) return;
        if (!dialog.subject.trim() || !dialog.body.trim()) {
            toast({ variant: 'destructive', title: 'Validation Error', description: 'Subject and body are required.' });
            return;
        }
        setDialog(d => d ? { ...d, loading: true } : null);
        try {
            await api.post(`/schools/${dialog.school.id}/messages`, {
                subject: dialog.subject,
                body: dialog.body,
            });
            toast({ title: 'Message Sent', description: `Your message was delivered to ${dialog.school.name}.` });
            closeDialog();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Failed to Send', description: 'Could not send the message.' });
            setDialog(d => d ? { ...d, loading: false } : null);
        }
    };

    // ── Edit ─────────────────────────────────────────────────────────────────
    const openEditDialog = (school: School) =>
        setEditDialog({ school, name: school.name, phone: school.phone, address: school.address, loading: false });
    const closeEditDialog = () => setEditDialog(null);

    const handleEdit = async () => {
        if (!editDialog) return;
        setEditDialog(d => d ? { ...d, loading: true } : null);
        try {
            const res = await api.put(`/schools/${editDialog.school.id}`, {
                name: editDialog.name.trim(),
                phone: editDialog.phone.trim(),
                address: editDialog.address.trim(),
            });
            setSchools(prev => prev.map(s => s.id === editDialog.school.id ? { ...s, ...res.data } : s));
            toast({ title: 'School Updated', description: `${editDialog.name} has been updated.` });
            closeEditDialog();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Update Failed', description: err.response?.data || 'Could not update school.' });
            setEditDialog(d => d ? { ...d, loading: false } : null);
        }
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const openDeleteDialog = (school: School) => setDeleteDialog({ school, loading: false });
    const closeDeleteDialog = () => setDeleteDialog(null);

    const handleDelete = async () => {
        if (!deleteDialog) return;
        setDeleteDialog(d => d ? { ...d, loading: true } : null);
        try {
            await api.delete(`/schools/${deleteDialog.school.id}`);
            setSchools(prev => prev.filter(s => s.id !== deleteDialog.school.id));
            toast({ title: 'School Deleted', description: `${deleteDialog.school.name} has been removed.` });
            closeDeleteDialog();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: err.response?.data || 'Could not delete school.' });
            setDeleteDialog(d => d ? { ...d, loading: false } : null);
        }
    };

    const filtered = schools.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <SchoolIcon size={20} className="text-emerald-600" />
                        </div>
                        Registered Schools
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 ml-13">
                        Manage schools and send messages directly to their dashboards
                    </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
                    <div className="text-2xl font-bold text-emerald-700">{schools.length}</div>
                    <div className="text-xs text-emerald-600 font-medium">Schools</div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                    id="school-search"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-white border-slate-200"
                />
            </div>

            {/* School Cards */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <SchoolIcon size={48} className="mx-auto mb-4 text-slate-200" />
                    {search ? 'No schools match your search.' : 'No schools registered yet.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(school => (
                        <Card key={school.id} className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                            <CardHeader className="pb-3 pt-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base font-semibold text-slate-800 truncate">{school.name}</CardTitle>
                                        <span className="text-xs font-mono text-slate-400 mt-0.5 block">{school.id}</span>
                                    </div>
                                    {/* Edit / Delete icon buttons */}
                                    <div className="flex items-center gap-1 ml-2 shrink-0">
                                        <button
                                            onClick={() => openEditDialog(school)}
                                            title="Edit school"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            onClick={() => openDeleteDialog(school)}
                                            title="Delete school"
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm text-slate-600 pb-4">
                                <div className="flex items-center gap-2">
                                    <Mail size={13} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{school.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={13} className="text-slate-400 shrink-0" />
                                    {school.phone}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={13} className="text-slate-400 shrink-0" />
                                    <span className="truncate">{school.address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CalendarDays size={13} className="text-slate-400 shrink-0" />
                                    Registered: {new Date(school.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                </div>

                                <div className="pt-3 border-t border-slate-100 space-y-2">
                                    {/* Expandable events & students details */}
                                    {(school.registeredEvents?.length ?? 0) > 0 || (school.studentNames?.length ?? 0) > 0 ? (
                                        <>
                                            <button
                                                onClick={() => toggleExpand(school.id)}
                                                className="w-full flex items-center justify-between text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors py-1"
                                            >
                                                <span className="flex items-center gap-1">
                                                    {expandedIds.has(school.id) ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                                    {expandedIds.has(school.id) ? 'Hide details' : 'View events & students'}
                                                </span>
                                                <span className="text-slate-400">
                                                    {school.registeredEvents?.length ?? 0} events &bull; {school.studentNames?.length ?? 0} students
                                                </span>
                                            </button>

                                            {expandedIds.has(school.id) && (
                                                <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 space-y-3 text-xs">
                                                    {/* Events */}
                                                    {(school.registeredEvents?.length ?? 0) > 0 && (
                                                        <div>
                                                            <p className="font-semibold text-slate-600 flex items-center gap-1 mb-1.5">
                                                                <Trophy size={11} className="text-amber-500" /> Registered Events
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {school.registeredEvents!.map(evId => {
                                                                    const cat = getEventCategory(evId);
                                                                    const colorMap: Record<string, string> = {
                                                                        Track: 'bg-blue-100 text-blue-700',
                                                                        Field: 'bg-green-100 text-green-700',
                                                                        Swimming: 'bg-cyan-100 text-cyan-700',
                                                                        'Team Sport': 'bg-purple-100 text-purple-700',
                                                                    };
                                                                    return (
                                                                        <span key={evId} className={`px-2 py-0.5 rounded-full font-medium ${cat ? colorMap[cat] || 'bg-slate-200 text-slate-600' : 'bg-slate-200 text-slate-600'}`}>
                                                                            {getEventName(evId)}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Students */}
                                                    {(school.studentNames?.length ?? 0) > 0 && (
                                                        <div>
                                                            <p className="font-semibold text-slate-600 flex items-center gap-1 mb-1.5">
                                                                <Users size={11} className="text-emerald-500" /> Students ({school.studentNames!.length})
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {school.studentNames!.map((n, i) => (
                                                                    <span key={i} className="bg-white border border-slate-200 rounded-full px-2.5 py-0.5 text-slate-600 font-medium">{n}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : null}

                                    <Button
                                        onClick={() => openDialog(school)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-sm"
                                        size="sm"
                                    >
                                        <Send size={14} />
                                        Send Message to School
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Send Message Dialog ─────────────────────────────────────────── */}
            {dialog && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <MessageSquare size={18} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Send Message</h3>
                                    <p className="text-xs text-slate-500">To: {dialog.school.name}</p>
                                </div>
                            </div>
                            <button onClick={closeDialog} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="msg-subject" className="text-slate-700 text-sm font-medium">Subject</Label>
                                <Input
                                    id="msg-subject"
                                    placeholder="e.g., Event Schedule Update"
                                    value={dialog.subject}
                                    onChange={e => setDialog(d => d ? { ...d, subject: e.target.value } : null)}
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="msg-body" className="text-slate-700 text-sm font-medium">Message</Label>
                                <textarea
                                    id="msg-body"
                                    rows={5}
                                    placeholder="Type your message here..."
                                    value={dialog.body}
                                    onChange={e => setDialog(d => d ? { ...d, body: e.target.value } : null)}
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 px-6 pb-6">
                            <Button variant="outline" onClick={closeDialog} className="flex-1 border-slate-200">Cancel</Button>
                            <Button
                                onClick={handleSendMessage}
                                disabled={dialog.loading}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            >
                                <Send size={15} />
                                {dialog.loading ? 'Sending...' : 'Send Message'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit School Dialog ──────────────────────────────────────────── */}
            {editDialog && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Pencil size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-800">Edit School</h3>
                                    <p className="text-xs text-slate-500">{editDialog.school.id}</p>
                                </div>
                            </div>
                            <button onClick={closeEditDialog} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name" className="text-slate-700 text-sm font-medium flex items-center gap-1.5">
                                    <BookOpen size={13} className="text-blue-500" /> School Name
                                </Label>
                                <Input
                                    id="edit-name"
                                    value={editDialog.name}
                                    onChange={e => setEditDialog(d => d ? { ...d, name: e.target.value } : null)}
                                    className="bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone" className="text-slate-700 text-sm font-medium flex items-center gap-1.5">
                                    <Phone size={13} className="text-blue-500" /> Phone
                                </Label>
                                <Input
                                    id="edit-phone"
                                    value={editDialog.phone}
                                    onChange={e => setEditDialog(d => d ? { ...d, phone: e.target.value } : null)}
                                    className="bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-address" className="text-slate-700 text-sm font-medium flex items-center gap-1.5">
                                    <MapPin size={13} className="text-blue-500" /> Address
                                </Label>
                                <Input
                                    id="edit-address"
                                    value={editDialog.address}
                                    onChange={e => setEditDialog(d => d ? { ...d, address: e.target.value } : null)}
                                    className="bg-slate-50 border-slate-200 focus:border-blue-400 focus:ring-blue-300"
                                />
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Mail size={11} /> Email cannot be changed after registration.
                            </p>
                        </div>

                        <div className="flex gap-3 px-6 pb-6">
                            <Button variant="outline" onClick={closeEditDialog} className="flex-1 border-slate-200">Cancel</Button>
                            <Button
                                onClick={handleEdit}
                                disabled={editDialog.loading || !editDialog.name.trim()}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                            >
                                <Pencil size={14} />
                                {editDialog.loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
            {deleteDialog && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 pt-8 pb-5 text-center">
                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={26} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">Delete School?</h3>
                            <p className="text-sm text-slate-500">
                                This will permanently remove <strong className="text-slate-700">{deleteDialog.school.name}</strong> and all
                                associated messages. This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex gap-3 px-6 pb-6">
                            <Button variant="outline" onClick={closeDeleteDialog} className="flex-1 border-slate-200">Cancel</Button>
                            <Button
                                onClick={handleDelete}
                                disabled={deleteDialog.loading}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white gap-2"
                            >
                                <Trash2 size={14} />
                                {deleteDialog.loading ? 'Deleting...' : 'Delete School'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schools;

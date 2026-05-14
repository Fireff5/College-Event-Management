import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Participant, Event } from '../types';
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
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

const Participants = () => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', department: '', year: 1, institute: '', events: [] as number[]
    });

    const { toast } = useToast();

    const fetchParticipants = async (query = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/participants${query ? `?q=${query}` : ''}`);
            setParticipants(res.data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch participants" });
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events');
            setAllEvents(res.data);
        } catch (error) {
            console.error("Failed to fetch events:", error);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchParticipants(searchQuery);
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleOpenDialog = (participant?: Participant) => {
        if (participant) {
            setEditingParticipant(participant);
            setFormData({
                name: participant.name,
                email: participant.email,
                phone: participant.phone,
                department: participant.department,
                year: participant.year,
                institute: participant.institute || '',
                events: participant.registered_events || []
            });
        } else {
            setEditingParticipant(null);
            setFormData({ name: '', email: '', phone: '', department: '', year: 1, institute: '', events: [] });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingParticipant) {
                await api.put(`/participants/${encodeURIComponent(editingParticipant.id)}`, formData);
                toast({ title: "Updated", description: "Participant updated successfully" });
            } else {
                await api.post('/participants', formData);
                toast({ title: "Created", description: "Participant created successfully" });
            }
            setIsDialogOpen(false);
            fetchParticipants(searchQuery);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Operation failed" });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this participant?")) {
            try {
                await api.delete(`/participants/${encodeURIComponent(id)}`);
                toast({ title: "Deleted", description: "Participant removed" });
                fetchParticipants(searchQuery);
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Participants</h1>
                    <p className="text-slate-500 mt-1">Manage event athletes and participants.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Participant
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]" aria-describedby={undefined}>
                        <DialogHeader>
                            <DialogTitle>{editingParticipant ? 'Edit Participant' : 'Add New Participant'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input id="department" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="year">Year</Label>
                                    <Input id="year" type="number" min="1" max="5" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="institute">Institute</Label>
                                <Input id="institute" value={formData.institute} onChange={e => setFormData({ ...formData, institute: e.target.value })} required placeholder="Enter Institute Name" />
                            </div>
                            <div className="space-y-2">
                                <Label>Registered Events</Label>
                                <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                                    {allEvents.map(ev => (
                                        <div key={ev.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`event-${ev.id}`}
                                                checked={formData.events.includes(ev.id)}
                                                onChange={(e) => {
                                                    const newEvents = e.target.checked
                                                        ? [...formData.events, ev.id]
                                                        : formData.events.filter(id => id !== ev.id);
                                                    setFormData({ ...formData, events: newEvents });
                                                }}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                            />
                                            <Label htmlFor={`event-${ev.id}`} className="font-normal cursor-pointer text-sm">
                                                {ev.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit">{editingParticipant ? 'Save Changes' : 'Create'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or ID..."
                            className="pl-9 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[100px] font-semibold">Reg ID</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Contact</TableHead>
                            <TableHead className="font-semibold">Dept / Year</TableHead>
                            <TableHead className="font-semibold">Institute</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-slate-500">Loading...</TableCell></TableRow>
                        ) : participants.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-slate-500">No participants found.</TableCell></TableRow>
                        ) : (
                            participants.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium text-slate-900">{p.id}</TableCell>
                                    <TableCell>{p.name}</TableCell>
                                    <TableCell>
                                        <div className="text-sm">{p.email}</div>
                                        <div className="text-xs text-slate-500">{p.phone}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{p.department}</div>
                                        <div className="text-xs text-slate-500">Year {p.year}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-700">{p.institute || '-'}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(p)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default Participants;

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Event, EventCategory } from '../types';
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
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react';

const CATEGORIES: EventCategory[] = ['Track', 'Field', 'Team Sport', 'School Events'];

const Events = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '', category: 'Track' as EventCategory, date: '', venue: '', max_participants: 10
    });

    const { toast } = useToast();

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch events" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleOpenDialog = (event?: Event) => {
        if (event) {
            setEditingEvent(event);
            setFormData({
                name: event.name,
                category: event.category,
                date: event.date.split('T')[0], // format logic if necessary
                venue: event.venue,
                max_participants: event.max_participants
            });
        } else {
            setEditingEvent(null);
            setFormData({ name: '', category: 'Track', date: new Date().toISOString().split('T')[0], venue: '', max_participants: 10 });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingEvent) {
                await api.put(`/events/${editingEvent.id}`, formData);
                toast({ title: "Updated", description: "Event updated successfully" });
            } else {
                await api.post('/events', formData);
                toast({ title: "Created", description: "Event created successfully" });
            }
            setIsDialogOpen(false);
            fetchEvents();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Operation failed" });
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this event? All associated results will also be deleted.")) {
            try {
                await api.delete(`/events/${id}`);
                toast({ title: "Deleted", description: "Event removed" });
                fetchEvents();
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to delete" });
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Events</h1>
                    <p className="text-slate-500 mt-1">Manage sports meet events and categories.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()} className="bg-emerald-600 hover:bg-emerald-700">
                            <Plus className="mr-2 h-4 w-4" /> Add Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]" aria-describedby={undefined}>
                        <DialogHeader>
                            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Event Name</Label>
                                <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value as EventCategory })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input id="date" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="venue">Venue</Label>
                                    <Input id="venue" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max">Max Participants</Label>
                                    <Input id="max" type="number" min="1" value={formData.max_participants} onChange={e => setFormData({ ...formData, max_participants: parseInt(e.target.value) })} required />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit">{editingEvent ? 'Save Changes' : 'Create Event'}</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[80px] font-semibold text-center">ID</TableHead>
                            <TableHead className="font-semibold">Event Details</TableHead>
                            <TableHead className="font-semibold">Schedule & Venue</TableHead>
                            <TableHead className="font-semibold text-center">Capacity</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-slate-500">Loading...</TableCell></TableRow>
                        ) : events.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-slate-500">No events found.</TableCell></TableRow>
                        ) : (
                            events.map((e) => (
                                <TableRow key={e.id}>
                                    <TableCell className="font-medium text-center text-slate-900">EV{e.id}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900">{e.name}</div>
                                        <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1 font-medium border border-emerald-100">{e.category}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm text-slate-600 mb-1">
                                            <Calendar className="mr-2 h-3 w-3" />
                                            {new Date(e.date).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-slate-500">{e.venue}</div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-medium">{e.max_participants}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(e)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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

export default Events;

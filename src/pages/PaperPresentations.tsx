import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, FileText, ExternalLink } from 'lucide-react';

interface PaperSubmission {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    year: number;
    institute: string;
    event_name: string;
    document_url: string | null;
}

const PaperPresentations = () => {
    const [submissions, setSubmissions] = useState<PaperSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await api.get('/papers');
            setSubmissions(res.data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch paper presentations" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const filteredSubmissions = submissions.filter(sub =>
        sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Paper Presentations</h1>
                    <p className="text-slate-500 mt-1">Review uploaded documents from participants registered for the Paper Presentation event.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by name, ID or Dept..."
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
                            <TableHead className="text-right font-semibold">Document</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-slate-500">Loading...</TableCell></TableRow>
                        ) : filteredSubmissions.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-slate-500">No submissions found.</TableCell></TableRow>
                        ) : (
                            filteredSubmissions.map((p) => (
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
                                    <TableCell className="text-right">
                                        {p.document_url ? (
                                            <a
                                                href={p.document_url.startsWith('data:') ? p.document_url : `http://localhost:5000${p.document_url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100 border-blue-200"
                                            >
                                                <FileText className="h-4 w-4 mr-2" />
                                                View Document
                                                <ExternalLink className="h-3 w-3 ml-1.5 opacity-70" />
                                            </a>
                                        ) : (
                                            <span className="text-sm text-slate-400 italic">No document</span>
                                        )}
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

export default PaperPresentations;

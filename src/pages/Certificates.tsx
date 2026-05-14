import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Result } from '../types';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Medal, FileBadge } from 'lucide-react';
import jsPDF from 'jspdf';

const Certificates = () => {
    const [results, setResults] = useState<Result[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchResults = async () => {
        setLoading(true);
        try {
            const res = await api.get('/results');
            setResults(res.data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch winners" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
    }, []);

    const generateCertificate = (result: Result) => {
        try {
            // Landscape A4: 297 x 210 mm
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const width = doc.internal.pageSize.getWidth();
            const height = doc.internal.pageSize.getHeight();

            // Outer Border (Gold/Blue gradient simulation with thick line)
            doc.setDrawColor(30, 64, 175); // slate-800
            doc.setLineWidth(4);
            doc.rect(10, 10, width - 20, height - 20);

            // Inner Border
            doc.setDrawColor(203, 166, 60); // Gold tone
            doc.setLineWidth(1);
            doc.rect(15, 15, width - 30, height - 30);

            // Corner decorations
            const cornerSize = 15;
            doc.setDrawColor(30, 64, 175);
            doc.setLineWidth(2);
            // Top Left
            doc.line(15, 15 + cornerSize, 15, 15);
            doc.line(15, 15, 15 + cornerSize, 15);
            // Top Right
            doc.line(width - 15 - cornerSize, 15, width - 15, 15);
            doc.line(width - 15, 15, width - 15, 15 + cornerSize);
            // Bottom Left
            doc.line(15, height - 15 - cornerSize, 15, height - 15);
            doc.line(15, height - 15, 15 + cornerSize, height - 15);
            // Bottom Right
            doc.line(width - 15 - cornerSize, height - 15, width - 15, height - 15);
            doc.line(width - 15, height - 15 - cornerSize, width - 15, height - 15);

            // Header Text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(36);
            doc.setTextColor(30, 64, 175); // Blue
            doc.text('CERTIFICATE OF ACHIEVEMENT', width / 2, 50, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(14);
            doc.setTextColor(100, 116, 139); // Slate-500
            doc.text('THIS IS PROUDLY PRESENTED TO', width / 2, 70, { align: 'center' });

            // Participant Name
            doc.setFont('times', 'italic');
            doc.setFontSize(32);
            doc.setTextColor(15, 23, 42); // Slate-900
            doc.text(result.participant?.name || 'Unknown', width / 2, 95, { align: 'center' });

            // Separator Line
            doc.setDrawColor(203, 166, 60);
            doc.setLineWidth(0.5);
            doc.line(width / 2 - 60, 105, width / 2 + 60, 105);

            // Description
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(14);
            doc.setTextColor(71, 85, 105);
            doc.text(`For outstanding performance and securing`, width / 2, 120, { align: 'center' });

            // Position logic for color and suffix
            let positionText = '1st Place';
            let posColor: [number, number, number] = [234, 179, 8]; // Gold
            if (result.position === 2) {
                positionText = '2nd Place';
                posColor = [148, 163, 184]; // Silver
            } else if (result.position === 3) {
                positionText = '3rd Place';
                posColor = [180, 83, 9]; // Bronze
            }

            // Position Text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.setTextColor(...posColor);
            doc.text(positionText, width / 2, 135, { align: 'center' });

            // Event Details
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(14);
            doc.setTextColor(71, 85, 105);
            doc.text(`in the ${result.event?.name} event`, width / 2, 150, { align: 'center' });

            if (result.remarks) {
                doc.setFont('times', 'italic');
                doc.setFontSize(12);
                doc.text(`"${result.remarks}"`, width / 2, 160, { align: 'center' });
            }

            // Signatures
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42);

            // Left Signature
            doc.line(40, 185, 100, 185);
            doc.text('Sports Coordinator', 70, 192, { align: 'center' });

            // Right Signature
            doc.line(width - 100, 185, width - 40, 185);
            doc.text('College Principal', width - 70, 192, { align: 'center' });

            // Date
            let eventDate = 'Unknown Date';
            if (result.event?.date) {
                eventDate = new Date(result.event.date).toLocaleDateString();
            }
            doc.setFontSize(10);
            doc.setTextColor(148, 163, 184);
            doc.text(`Date of Event: ${eventDate}`, width / 2, 195, { align: 'center' });

            // Save PDF
            doc.save(`Certificate_${result.participant_id}_${result.event?.name.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "Downloaded", description: "Certificate generated successfully." });

        } catch (err) {
            console.error(err);
            toast({ variant: "destructive", title: "Generation Failed", description: "An error occurred while generating the PDF." });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Certificates</h1>
                <p className="text-slate-500 mt-1">Generate and download reward certificates for event winners.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="w-[80px] text-center font-semibold">Pos</TableHead>
                            <TableHead className="font-semibold">Participant</TableHead>
                            <TableHead className="font-semibold">Event / Date</TableHead>
                            <TableHead className="text-right font-semibold">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24 text-slate-500">Loading...</TableCell></TableRow>
                        ) : results.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center h-24 text-slate-500">No winners to generate certificates for.</TableCell></TableRow>
                        ) : (
                            results.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center flex-col items-center">
                                            {r.position === 1 ? <Medal className="h-6 w-6 text-yellow-500 mb-1" /> :
                                                r.position === 2 ? <Medal className="h-6 w-6 text-slate-400 mb-1" /> :
                                                    <Medal className="h-6 w-6 text-amber-600 mb-1" />}
                                            <span className="text-xs font-bold text-slate-500">{r.position}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900">{r.participant?.name}</div>
                                        <div className="text-sm text-slate-500">{r.participant?.department} (Year {r.participant?.year})</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-700">{r.event?.name}</div>
                                        <div className="text-sm text-slate-500">{r.event?.date ? new Date(r.event.date).toLocaleDateString() : ''}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button onClick={() => generateCertificate(r)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-none">
                                            <FileBadge className="mr-2 h-4 w-4" /> Download
                                        </Button>
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

export default Certificates;

import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { School, Event } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
    GraduationCap, Search, Download, Award, Users, BookOpen,
    Trophy, Filter, X
} from 'lucide-react';
import jsPDF from 'jspdf';

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

interface CertEntry {
    schoolName: string;
    schoolId: string;
    studentName: string;
    eventName: string;
    eventId: number;
    eventDate?: string;
    position?: 1 | 2 | 3;    // present when this student won
    resultId?: number;
}

const POSITION_COLORS: Record<number, [number, number, number]> = {
    1: [212, 175, 55],   // Gold
    2: [168, 168, 168],  // Silver
    3: [176, 100, 30],   // Bronze
};

const POSITION_LABEL: Record<number, string> = {
    1: '🥇 1st Place',
    2: '🥈 2nd Place',
    3: '🥉 3rd Place',
};

const SchoolCertificates = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [schoolResults, setSchoolResults] = useState<SchoolResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [eventFilter, setEventFilter] = useState<string>('all');
    const { toast } = useToast();

    /* ── Fetch data ───────────────────────────────────────────── */
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [schoolsRes, eventsRes, srRes] = await Promise.all([
                    api.get('/schools'),
                    api.get('/events'),
                    api.get('/school-results'),
                ]);
                setSchools(schoolsRes.data);
                setEvents(eventsRes.data);
                setSchoolResults(srRes.data);
            } catch {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    /* ── Build flat cert list ─────────────────────────────────── */
    const entries = useMemo<CertEntry[]>(() => {
        const evMap: Record<number, Event> = {};
        events.forEach(e => { evMap[Number(e.id)] = e; });

        // Build a lookup: schoolId+eventId+studentName → schoolResult
        const resultLookup = new Map<string, SchoolResult>();
        schoolResults.forEach(r => {
            resultLookup.set(`${r.schoolId}|${r.eventId}|${r.studentName}`, r);
        });

        const list: CertEntry[] = [];
        schools.forEach(school => {
            // per-event student map is the source of truth
            if (school.studentsByEvent) {
                Object.entries(school.studentsByEvent).forEach(([evIdStr, names]) => {
                    const evId = Number(evIdStr);
                    const ev = evMap[evId];
                    if (!ev) return;
                    names.forEach(name => {
                        const sr = resultLookup.get(`${school.id}|${evId}|${name}`);
                        list.push({
                            schoolName: school.name,
                            schoolId: school.id,
                            studentName: name,
                            eventName: ev.name,
                            eventId: evId,
                            eventDate: ev.date,
                            position: sr?.position,
                            resultId: sr?.id,
                        });
                    });
                });
            }
            // Fall back to legacy flat list if studentsByEvent is empty
            else if (school.studentNames?.length && school.registeredEvents?.length) {
                school.registeredEvents.forEach(evId => {
                    const ev = evMap[Number(evId)];
                    if (!ev) return;
                    school.studentNames!.forEach(name => {
                        const sr = resultLookup.get(`${school.id}|${Number(evId)}|${name}`);
                        list.push({
                            schoolName: school.name,
                            schoolId: school.id,
                            studentName: name,
                            eventName: ev.name,
                            eventId: Number(evId),
                            eventDate: ev.date,
                            position: sr?.position,
                            resultId: sr?.id,
                        });
                    });
                });
            }
        });
        return list;
    }, [schools, events, schoolResults]);

    /* ── Distinct events for filter dropdown ──────────────────── */
    const usedEvents = useMemo(() => {
        const seen = new Map<number, string>();
        entries.forEach(e => seen.set(e.eventId, e.eventName));
        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [entries]);

    /* ── Filtered list ────────────────────────────────────────── */
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return entries.filter(e =>
            (eventFilter === 'all' || e.eventId === Number(eventFilter)) &&
            (e.studentName.toLowerCase().includes(q) ||
                e.schoolName.toLowerCase().includes(q) ||
                e.eventName.toLowerCase().includes(q))
        );
    }, [entries, search, eventFilter]);

    const winnersCount = entries.filter(e => e.position != null).length;

    /* ── Generate PDF ─────────────────────────────────────────── */
    const generateCertificate = (entry: CertEntry, type: 'participation' | 'achievement') => {
        try {
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            const W = doc.internal.pageSize.getWidth();
            const H = doc.internal.pageSize.getHeight();

            /* ── Background ──────────────────────────────────── */
            doc.setFillColor(253, 251, 244);
            doc.rect(0, 0, W, H, 'F');

            // Top decorative band
            doc.setFillColor(15, 52, 96);
            doc.rect(0, 0, W, 18, 'F');

            // Bottom decorative band
            doc.setFillColor(15, 52, 96);
            doc.rect(0, H - 14, W, 14, 'F');

            // Gold accent strips
            doc.setFillColor(212, 175, 55);
            doc.rect(0, 17, W, 2.5, 'F');
            doc.rect(0, H - 16.5, W, 2.5, 'F');

            /* ── Outer frame ─────────────────────────────────── */
            doc.setDrawColor(15, 52, 96);
            doc.setLineWidth(3);
            doc.rect(8, 8, W - 16, H - 16);

            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(1);
            doc.rect(12, 12, W - 24, H - 24);

            /* ── Corner ornaments ────────────────────────────── */
            const C = 18;
            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(2);
            [[12, 12], [W - 12, 12], [12, H - 12], [W - 12, H - 12]].forEach(([cx, cy]) => {
                const sx = cx === 12 ? 1 : -1;
                const sy = cy === 12 ? 1 : -1;
                doc.line(cx, cy, cx + sx * C, cy);
                doc.line(cx, cy, cx, cy + sy * C);
            });

            /* ── College name in top band ────────────────────── */
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(212, 175, 55);
            doc.text('SPORTS MEET — COLLEGE EVENTS ADMINISTRATION', W / 2, 11.5, { align: 'center' });

            /* ── Title ───────────────────────────────────────── */
            const isAchievement = type === 'achievement';
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(30);
            doc.setTextColor(15, 52, 96);
            doc.text(
                isAchievement ? 'CERTIFICATE OF ACHIEVEMENT' : 'CERTIFICATE OF PARTICIPATION',
                W / 2, 46, { align: 'center' }
            );

            /* ── Subtitle ────────────────────────────────────── */
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139);
            doc.text('THIS IS TO PROUDLY CERTIFY THAT', W / 2, 62, { align: 'center' });

            /* ── Student name ────────────────────────────────── */
            doc.setFont('times', 'italic');
            doc.setFontSize(36);
            doc.setTextColor(10, 10, 10);
            doc.text(entry.studentName, W / 2, 84, { align: 'center' });

            /* ── Gold underline ──────────────────────────────── */
            const nameWidth = doc.getTextWidth(entry.studentName);
            const lineHalf = Math.min(nameWidth / 2, 70);
            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(0.8);
            doc.line(W / 2 - lineHalf, 90, W / 2 + lineHalf, 90);

            /* ── School label ────────────────────────────────── */
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);
            doc.text('Representing', W / 2, 102, { align: 'center' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            doc.setTextColor(15, 52, 96);
            doc.text(entry.schoolName, W / 2, 114, { align: 'center' });

            /* ── Mid text ────────────────────────────────────── */
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(71, 85, 105);

            if (isAchievement && entry.position) {
                const posMap: Record<number, string> = { 1: '1st Place', 2: '2nd Place', 3: '3rd Place' };
                doc.text(`has achieved outstanding performance, securing`, W / 2, 128, { align: 'center' });

                const posColor = POSITION_COLORS[entry.position] ?? [15, 52, 96];
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(22);
                doc.setTextColor(...posColor);
                doc.text(posMap[entry.position] ?? '', W / 2, 141, { align: 'center' });

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.setTextColor(71, 85, 105);
                doc.text(`in the event`, W / 2, 154, { align: 'center' });
            } else {
                doc.text(`has successfully participated in the event`, W / 2, 130, { align: 'center' });
            }

            /* ── Event name badge-style ───────────────────────── */
            const evY = isAchievement ? 165 : 144;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(17);
            doc.setTextColor(15, 52, 96);
            doc.text(`« ${entry.eventName} »`, W / 2, evY, { align: 'center' });

            /* ── Date line ───────────────────────────────────── */
            const dateStr = entry.eventDate
                ? new Date(entry.eventDate).toLocaleDateString('en-IN', { dateStyle: 'long' })
                : 'N/A';
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(148, 163, 184);
            doc.text(`Date of Event: ${dateStr}`, W / 2, evY + 11, { align: 'center' });

            /* ── Signature lines ─────────────────────────────── */
            doc.setDrawColor(15, 52, 96);
            doc.setLineWidth(0.6);

            doc.line(30, H - 35, 100, H - 35);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(15, 52, 96);
            doc.text('Event Coordinator', 65, H - 29, { align: 'center' });

            doc.line(W - 100, H - 35, W - 30, H - 35);
            doc.text('College Principal', W - 65, H - 29, { align: 'center' });

            // Seal
            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(1);
            doc.circle(W / 2, H - 35, 14);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(212, 175, 55);
            doc.text('OFFICIAL', W / 2, H - 37, { align: 'center' });
            doc.text('SEAL', W / 2, H - 33, { align: 'center' });

            /* ── Bottom band text ────────────────────────────── */
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(180, 180, 180);
            doc.text(`Certificate ID: CERT-${entry.schoolId}-${entry.eventId}-${entry.studentName.replace(/\s+/g, '').toUpperCase().slice(0, 6)}`, W / 2, H - 5, { align: 'center' });

            /* ── Save ────────────────────────────────────────── */
            doc.save(`SchoolCert_${entry.schoolName.replace(/\s+/g, '_')}_${entry.studentName.replace(/\s+/g, '_')}_${entry.eventName.replace(/\s+/g, '_')}.pdf`);
            toast({ title: 'Certificate Downloaded', description: `Generated for ${entry.studentName}` });

        } catch (err) {
            console.error(err);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate certificate.' });
        }
    };

    /* ── Render ───────────────────────────────────────────────── */
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <GraduationCap size={20} className="text-indigo-600" />
                        </div>
                        School Certificates
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 ml-13">
                        Generate participation and achievement certificates for school students
                    </p>
                </div>

                {/* Summary stats */}
                <div className="flex gap-3">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 text-center">
                        <div className="text-2xl font-bold text-indigo-700">{schools.length}</div>
                        <div className="text-xs text-indigo-600 font-medium">Schools</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-center">
                        <div className="text-2xl font-bold text-emerald-700">{entries.length}</div>
                        <div className="text-xs text-emerald-600 font-medium">Students</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 text-center">
                        <div className="text-2xl font-bold text-amber-700">{winnersCount}</div>
                        <div className="text-xs text-amber-600 font-medium">Winners</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-56 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        id="school-cert-search"
                        placeholder="Search student, school, or event..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 bg-white border-slate-200"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <Filter size={14} className="text-slate-400" />
                    <select
                        id="school-cert-event-filter"
                        value={eventFilter}
                        onChange={e => setEventFilter(e.target.value)}
                        className="text-sm text-slate-700 bg-transparent border-none outline-none cursor-pointer"
                    >
                        <option value="all">All Events</option>
                        {usedEvents.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center h-60">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent" />
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-24 text-slate-400 bg-white rounded-2xl border border-slate-100">
                    <GraduationCap size={52} className="mx-auto mb-4 text-slate-200" />
                    <p className="font-semibold text-slate-500 text-lg">No school students found</p>
                    <p className="text-sm mt-1">
                        Schools must register with student names to generate certificates.
                    </p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100">
                    <Search size={40} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-slate-500">No results match your filters.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_1.2fr_1.4fr_auto] gap-4 items-center px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5"><Users size={12} /> Student</div>
                        <div className="flex items-center gap-1.5"><BookOpen size={12} /> School</div>
                        <div className="flex items-center gap-1.5"><Trophy size={12} /> Event &amp; Position</div>
                        <div className="flex items-center gap-1.5"><Award size={12} /> Certificate</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-50">
                        {filtered.map((entry, idx) => (
                            <div
                                key={`${entry.schoolId}-${entry.eventId}-${idx}`}
                                className="grid grid-cols-[1fr_1.2fr_1.4fr_auto] gap-4 items-center px-6 py-4 hover:bg-slate-50/60 transition-colors group"
                            >
                                {/* Student */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm
                                        ${entry.position ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {entry.studentName.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-slate-800 text-sm truncate">{entry.studentName}</span>
                                </div>

                                {/* School */}
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center shrink-0">
                                        <BookOpen size={11} className="text-emerald-600" />
                                    </div>
                                    <span className="text-sm text-slate-600 truncate">{entry.schoolName}</span>
                                </div>

                                {/* Event + Position */}
                                <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        <Trophy size={10} />
                                        {entry.eventName}
                                    </span>
                                    {entry.eventDate && (
                                        <div className="text-xs text-slate-400 ml-0.5">
                                            {new Date(entry.eventDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                        </div>
                                    )}
                                    {entry.position && (
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border
                                                ${entry.position === 1 ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                                                    entry.position === 2 ? 'bg-slate-50 border-slate-300 text-slate-600' :
                                                        'bg-amber-50 border-amber-300 text-amber-700'}`}>
                                                {POSITION_LABEL[entry.position]}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        id={`cert-participation-${idx}`}
                                        size="sm"
                                        onClick={() => generateCertificate(entry, 'participation')}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs h-8 px-3 shadow-sm shadow-indigo-200"
                                    >
                                        <Download size={12} />
                                        Participation
                                    </Button>
                                    {entry.position && (
                                        <Button
                                            id={`cert-achievement-${idx}`}
                                            size="sm"
                                            onClick={() => generateCertificate(entry, 'achievement')}
                                            className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5 text-xs h-8 px-3 shadow-sm shadow-amber-200"
                                        >
                                            <Award size={12} />
                                            Achievement
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer count */}
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
                        Showing {filtered.length} of {entries.length} entries
                        {winnersCount > 0 && <span className="ml-2 text-amber-600 font-medium">· {winnersCount} winner{winnersCount !== 1 ? 's' : ''} eligible for achievement certificates</span>}
                    </div>
                </div>
            )}

            {/* Info callout */}
            {entries.length > 0 && winnersCount === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-3 items-start">
                    <Award size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Tip: Achievement Certificates</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                            To generate achievement certificates for winners, go to <strong>Results → School Students tab</strong> and record winning positions for school students. Achievement certificates include the student's placement (1st, 2nd, or 3rd place).
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolCertificates;

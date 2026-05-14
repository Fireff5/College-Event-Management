import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    School, BookOpen, Mail, Phone, MapPin, CheckCircle, LogIn,
    ShieldCheck, RefreshCw, KeyRound, CalendarDays, Users, Plus, Trash2,
    ArrowRight, Trophy, MapPin as Venue, ChevronRight, User, Lock, Eye, EyeOff
} from 'lucide-react';
import { Event } from '../types';



interface RegistrationSuccess {
    school: {
        id: string;
        name: string;
        email: string;
        username: string;
        password: string;
        registeredEvents?: number[];
        studentNames?: string[];
    };
    simulatedEmail?: { to: string; subject: string; body: string; sentAt: string };
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

const SchoolRegister = () => {
    // Step 1 – School Details
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 2 – Events & Students
    const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
    const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
    // Per-event student names: { [eventId]: string[] }
    const [studentsByEvent, setStudentsByEvent] = useState<Record<number, string[]>>({});
    const [eventsLoading, setEventsLoading] = useState(false);

    // Step 3 – OTP
    const [otpValue, setOtpValue] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);

    // Wizard step: 'form' | 'events' | 'otp'
    const [step, setStep] = useState<'form' | 'events' | 'otp'>('form');

    const [loading, setLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [success, setSuccess] = useState<RegistrationSuccess | null>(null);

    const otpInputRef = useRef<HTMLInputElement>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        if (step === 'otp') setTimeout(() => otpInputRef.current?.focus(), 100);
    }, [step]);

    useEffect(() => {
        if (resendCountdown <= 0) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return;
        }
        countdownRef.current = setInterval(() => {
            setResendCountdown(prev => {
                if (prev <= 1) { clearInterval(countdownRef.current!); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, [resendCountdown]);

    const startCountdown = () => setResendCountdown(RESEND_COOLDOWN);

    // ── Step 1 → Step 2 ─────────────────────────────────────────────────────
    const handleDetailsNext = async (e: React.FormEvent) => {
        e.preventDefault();
        if (username.trim().length < 4) {
            toast({ variant: 'destructive', title: 'Invalid Username', description: 'Username must be at least 4 characters.' });
            return;
        }
        if (password.length < 6) {
            toast({ variant: 'destructive', title: 'Weak Password', description: 'Password must be at least 6 characters.' });
            return;
        }
        if (password !== confirmPassword) {
            toast({ variant: 'destructive', title: 'Passwords Do Not Match', description: 'Please make sure your password and confirmation match.' });
            return;
        }
        setEventsLoading(true);
        try {
            const res = await api.get('/public/events');
            setAvailableEvents(res.data.filter((e: Event) => e.category === 'School Events'));
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load events. Please retry.' });
        } finally {
            setEventsLoading(false);
        }
        setStep('events');
    };

    // ── Step 2 → Step 3 (send OTP) ───────────────────────────────────────────
    const handleSendOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (selectedEvents.length === 0) {
            toast({ variant: 'destructive', title: 'Select Events', description: 'Please select at least one event.' });
            return;
        }
        const filledStudents = Object.values(studentsByEvent).flat().filter(n => n.trim());
        if (filledStudents.length === 0) {
            toast({ variant: 'destructive', title: 'Add Students', description: 'Please add at least one student name for at least one event.' });
            return;
        }
        setLoading(true);
        try {
            // Backend generates OTP, saves to DB, and emails it
            await api.post('/schools/send-otp', { email, schoolName: name });

            setOtpSent(true);
            setOtpValue('');
            setStep('otp');
            startCountdown();
            toast({ title: 'Code Sent', description: `A 6-digit verification code was sent to ${email}.` });
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to Send Code',
                description: err.response?.data || err?.text || 'Something went wrong. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    // ── Step 3: Verify OTP & Register ────────────────────────────────────────
    const handleVerifyAndRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpValue.length !== OTP_LENGTH) {
            toast({ variant: 'destructive', title: 'Invalid Code', description: 'Please enter the 6-digit verification code.' });
            return;
        }
        setVerifyLoading(true);
        try {
            await api.post('/schools/verify-otp', { email, otp: otpValue });
            const res = await api.post('/schools/register', {
                name, email, phone, address,
                username: username.trim(),
                password,
                events: selectedEvents,
                studentsByEvent: Object.fromEntries(
                    Object.entries(studentsByEvent).map(([k, v]) => [k, v.filter(n => n.trim())])
                ),
            });
            setSuccess(res.data);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Verification Failed',
                description: err.response?.data || 'Something went wrong. Please try again.',
            });
        } finally {
            setVerifyLoading(false);
        }
    };

    // ── Event selection helpers ───────────────────────────────────────────────
    const toggleEvent = (id: number) => {
        setSelectedEvents(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
        // Initialise an empty student slot for this event when selected
        setStudentsByEvent(prev => {
            if (prev[id]) return prev; // already has entries, keep them
            return { ...prev, [id]: [''] };
        });
    };

    // ── Per-event student helpers ────────────────────────────────────────────
    const addStudentForEvent = (eventId: number, max: number) => {
        setStudentsByEvent(prev => {
            const current = prev[eventId] || [];
            if (current.length >= max) return prev;
            return { ...prev, [eventId]: [...current, ''] };
        });
    };
    const removeStudentForEvent = (eventId: number, idx: number) => {
        setStudentsByEvent(prev => {
            const current = prev[eventId] || [];
            const next = current.filter((_, i) => i !== idx);
            return { ...prev, [eventId]: next.length > 0 ? next : [''] };
        });
    };
    const updateStudentForEvent = (eventId: number, idx: number, val: string) => {
        setStudentsByEvent(prev => {
            const current = [...(prev[eventId] || [])];
            current[idx] = val;
            return { ...prev, [eventId]: current };
        });
    };


    // Category badge colours
    const categoryColors: Record<string, string> = {
        Track: 'bg-blue-100 text-blue-700',
        Field: 'bg-green-100 text-green-700',
        Swimming: 'bg-cyan-100 text-cyan-700',
        'Team Sport': 'bg-purple-100 text-purple-700',
        'School Events': 'bg-amber-100 text-amber-700',
    };

    // ─── Success Screen ───────────────────────────────────────────────────────
    if (success) {
        const regEvents = availableEvents.filter(e => (success.school.registeredEvents || []).includes(e.id));
        const successStudentsByEvent: Record<number, string[]> = (success.school as any).studentsByEvent || {};
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
                </div>

                <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="text-center pb-4 pt-8">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <CheckCircle size={32} className="text-emerald-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-800">Registration Successful!</CardTitle>
                        <CardDescription className="text-slate-500 mt-1">
                            Your school has been registered. A confirmation email has been sent to <strong>{success.school.email}</strong>.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-5 pb-8">
                        {/* Per-event students summary */}
                        {regEvents.length > 0 && (
                            <div className="space-y-3">
                                {regEvents.map(ev => {
                                    const evStudents = successStudentsByEvent[ev.id] || [];
                                    return (
                                        <div key={ev.id} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                                <Trophy size={13} /> {ev.name}
                                                <span className="ml-auto font-normal normal-case text-indigo-500">{evStudents.length}/{ev.max_participants} participants</span>
                                            </p>
                                            {evStudents.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {evStudents.map((n, i) => (
                                                        <span key={i} className="text-xs bg-white border border-indigo-200 rounded-full px-2.5 py-1 text-indigo-700 font-medium">{n}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-indigo-400 italic">No students added for this event.</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Real email sent notice */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                            <Mail size={18} className="text-emerald-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-800">Confirmation email sent to <strong>{success.school.email}</strong></p>
                                <p className="text-xs text-emerald-600 mt-0.5">Check your inbox (and spam folder) for your registration confirmation.</p>
                            </div>
                        </div>

                        {/* Login hint */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                            <p className="text-sm text-emerald-800 font-medium">You can now log in using the username and password you created during registration.</p>
                        </div>

                        <Button
                            onClick={() => navigate('/school/login')}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all gap-2"
                        >
                            <LogIn size={18} />Go to School Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ─── Step Indicator ───────────────────────────────────────────────────────
    const steps = [
        { key: 'form', label: 'School Details' },
        { key: 'events', label: 'Events & Students' },
        { key: 'otp', label: 'Verify Email' },
    ] as const;
    const stepIndex = steps.findIndex(s => s.key === step);

    // ─── Registration Page ────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-lg space-y-4">
                {/* Step indicator */}
                <div className="flex items-center gap-2 justify-center">
                    {steps.map((s, idx) => (
                        <div key={s.key} className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${idx === stepIndex ? 'text-emerald-600' : idx < stepIndex ? 'text-emerald-500' : 'text-slate-400'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${idx < stepIndex ? 'bg-emerald-500 text-white' : idx === stepIndex ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {idx < stepIndex ? <CheckCircle size={14} /> : idx + 1}
                                </span>
                                {s.label}
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={`h-px w-8 transition-colors ${idx < stepIndex ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-4 items-center pt-8">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner transition-all ${step === 'otp' ? 'bg-teal-100' : step === 'events' ? 'bg-indigo-100' : 'bg-emerald-100'}`}>
                            {step === 'otp' ? <ShieldCheck size={32} className="text-teal-600" />
                                : step === 'events' ? <CalendarDays size={32} className="text-indigo-600" />
                                    : <School size={32} className="text-emerald-600" />}
                        </div>
                        <div className="space-y-1 text-center">
                            <CardTitle className="text-2xl font-bold text-slate-900">
                                {step === 'otp' ? 'Verify Your Email' : step === 'events' ? 'Events & Students' : 'School Registration'}
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                {step === 'otp' ? `We've sent a 6-digit code to ${email}`
                                    : step === 'events' ? 'Select events and add student names'
                                        : 'Register your school for the Sports Meet Portal'}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="pb-8">
                        {/* ── Step 1: School Details Form ── */}
                        {step === 'form' && (
                            <form onSubmit={handleDetailsNext} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="school-name" className="flex items-center gap-2 text-slate-700">
                                        <BookOpen size={14} className="text-emerald-600" />School Name
                                    </Label>
                                    <Input id="school-name" placeholder="e.g., St. Joseph's College" value={name}
                                        onChange={e => setName(e.target.value)} required
                                        className="bg-white border-slate-200 focus:border-emerald-400 focus:ring-emerald-300" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="school-email" className="flex items-center gap-2 text-slate-700">
                                        <Mail size={14} className="text-emerald-600" />School Email
                                    </Label>
                                    <Input id="school-email" type="email" placeholder="principal@school.edu" value={email}
                                        onChange={e => setEmail(e.target.value)} required
                                        className="bg-white border-slate-200 focus:border-emerald-400 focus:ring-emerald-300" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="school-phone" className="flex items-center gap-2 text-slate-700">
                                        <Phone size={14} className="text-emerald-600" />Phone Number
                                    </Label>
                                    <Input id="school-phone" type="tel" placeholder="+91 99999 99999" value={phone}
                                        onChange={e => setPhone(e.target.value)} required
                                        className="bg-white border-slate-200 focus:border-emerald-400 focus:ring-emerald-300" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="school-address" className="flex items-center gap-2 text-slate-700">
                                        <MapPin size={14} className="text-emerald-600" />Address
                                    </Label>
                                    <Input id="school-address" placeholder="123 School Lane, City" value={address}
                                        onChange={e => setAddress(e.target.value)} required
                                        className="bg-white border-slate-200 focus:border-emerald-400 focus:ring-emerald-300" />
                                </div>

                                {/* Divider */}
                                <div className="border-t border-slate-100 pt-1">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Create Login Credentials</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="school-username" className="flex items-center gap-2 text-slate-700">
                                        <User size={14} className="text-emerald-600" />Username
                                    </Label>
                                    <Input id="school-username" placeholder="e.g., stjosephs" value={username}
                                        onChange={e => setUsername(e.target.value)} required minLength={4}
                                        className="bg-white border-slate-200 focus:border-emerald-400 focus:ring-emerald-300" />
                                    <p className="text-xs text-slate-400">Minimum 4 characters. You'll use this to log in.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="school-password" className="flex items-center gap-2 text-slate-700">
                                        <Lock size={14} className="text-emerald-600" />Password
                                    </Label>
                                    <div className="relative">
                                        <Input id="school-password" type={showPassword ? 'text' : 'password'}
                                            placeholder="Min. 6 characters" value={password}
                                            onChange={e => setPassword(e.target.value)} required minLength={6}
                                            className="bg-white border-slate-200 focus:border-emerald-400 focus:ring-emerald-300 pr-10" />
                                        <button type="button" onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="school-confirm-password" className="flex items-center gap-2 text-slate-700">
                                        <Lock size={14} className="text-emerald-600" />Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Input id="school-confirm-password" type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Re-enter your password" value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)} required
                                            className={`bg-white border-slate-200 focus:border-emerald-400 focus:ring-emerald-300 pr-10 ${confirmPassword && confirmPassword !== password ? 'border-red-300 focus:border-red-400' : ''
                                                }`} />
                                        <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {confirmPassword && confirmPassword !== password && (
                                        <p className="text-xs text-red-500">Passwords do not match.</p>
                                    )}
                                </div>

                                <Button type="submit" disabled={eventsLoading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all mt-2 gap-2">
                                    <ArrowRight size={16} />
                                    {eventsLoading ? 'Loading Events...' : 'Next: Select Events'}
                                </Button>
                            </form>
                        )}

                        {/* ── Step 2: Events & Students ── */}
                        {step === 'events' && (
                            <form onSubmit={handleSendOtp} className="space-y-6">
                                {/* Event Selection */}
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                        <Trophy size={15} className="text-indigo-500" />
                                        Select Events to Participate In
                                        <span className="ml-auto text-xs font-normal text-slate-400">{selectedEvents.length} selected</span>
                                    </p>
                                    {availableEvents.length === 0 ? (
                                        <div className="text-center py-6 text-slate-400 text-sm">No School Events available. Ask the admin to add School Events first.</div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                                            {availableEvents.map(ev => {
                                                const isSelected = selectedEvents.includes(ev.id);
                                                return (
                                                    <label
                                                        key={ev.id}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none ${isSelected
                                                            ? 'border-indigo-400 bg-indigo-50'
                                                            : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleEvent(ev.id)}
                                                            className="accent-indigo-600 w-4 h-4 shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-800 leading-tight">{ev.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${categoryColors[ev.category] || 'bg-slate-100 text-slate-600'}`}>
                                                                    {ev.category}
                                                                </span>
                                                                <span className="text-xs text-slate-400 flex items-center gap-0.5">
                                                                    <Venue size={10} />{ev.venue}
                                                                </span>
                                                                <span className="text-xs text-slate-400 flex items-center gap-0.5 ml-auto shrink-0">
                                                                    <Users size={10} />Max {ev.max_participants}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {isSelected && <CheckCircle size={16} className="text-indigo-500 shrink-0" />}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Student Names – per event */}
                                {selectedEvents.length > 0 && (
                                    <div className="space-y-4">
                                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <Users size={15} className="text-emerald-500" />
                                            Add Students per Event
                                        </p>
                                        {selectedEvents.map(evId => {
                                            const ev = availableEvents.find(e => e.id === evId);
                                            if (!ev) return null;
                                            const max = ev.max_participants;
                                            const students = studentsByEvent[evId] || [''];
                                            const filled = students.filter(n => n.trim()).length;
                                            const atLimit = students.length >= max;
                                            return (
                                                <div key={evId} className="border border-slate-200 rounded-xl p-3 bg-white">
                                                    {/* Event header with limit badge */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold text-slate-800 leading-tight">{ev.name}</p>
                                                        </div>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${filled >= max
                                                            ? 'bg-red-100 text-red-600'
                                                            : 'bg-emerald-100 text-emerald-700'
                                                            }`}>
                                                            {filled}/{max} participants
                                                        </span>
                                                    </div>
                                                    {/* Student inputs */}
                                                    <div className="space-y-1.5">
                                                        {students.map((sname, idx) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                                                                    {idx + 1}
                                                                </div>
                                                                <Input
                                                                    placeholder={`Student ${idx + 1} name`}
                                                                    value={sname}
                                                                    onChange={e => updateStudentForEvent(evId, idx, e.target.value)}
                                                                    className="bg-white border-slate-200 focus:border-indigo-400 focus:ring-indigo-300 flex-1 h-8 text-sm"
                                                                />
                                                                {students.length > 1 && (
                                                                    <button type="button" onClick={() => removeStudentForEvent(evId, idx)}
                                                                        className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {!atLimit && (
                                                        <button type="button" onClick={() => addStudentForEvent(evId, max)}
                                                            className="mt-2 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                                                            <Plus size={13} /> Add student
                                                        </button>
                                                    )}
                                                    {atLimit && (
                                                        <p className="mt-1.5 text-xs text-red-500 font-medium">Maximum {max} participants reached for this event.</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Navigation */}
                                <div className="flex gap-3 pt-1">
                                    <Button type="button" variant="outline" onClick={() => setStep('form')}
                                        className="flex-1 border-slate-200 text-slate-600">
                                        ← Back
                                    </Button>
                                    <Button type="submit" disabled={loading}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                                        <ChevronRight size={16} />
                                        {loading ? 'Sending Code...' : 'Continue'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* ── Step 3: OTP Verification ── */}
                        {step === 'otp' && (
                            <div className="space-y-5">
                                {otpSent && (
                                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
                                        <Mail size={18} className="text-teal-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-teal-800">Email sent to <span className="font-bold">{email}</span></p>
                                            <p className="text-xs text-teal-600 mt-0.5">Check your Gmail inbox (and spam folder) for a 6-digit verification code.</p>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleVerifyAndRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="otp-input" className="flex items-center gap-2 text-slate-700">
                                            <KeyRound size={14} className="text-teal-600" />Enter 6-Digit Verification Code
                                        </Label>
                                        <Input
                                            id="otp-input"
                                            ref={otpInputRef}
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={OTP_LENGTH}
                                            placeholder="• • • • • •"
                                            value={otpValue}
                                            onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
                                            className="bg-white border-slate-200 focus:border-teal-400 focus:ring-teal-300 text-center text-2xl tracking-[0.5em] font-mono py-3"
                                            required
                                        />
                                        <p className="text-xs text-slate-400 text-center">Code expires in 5 minutes</p>
                                    </div>
                                    <Button type="submit" disabled={verifyLoading || otpValue.length !== OTP_LENGTH}
                                        className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-md hover:shadow-lg transition-all gap-2">
                                        <ShieldCheck size={16} />
                                        {verifyLoading ? 'Verifying...' : 'Verify & Register School'}
                                    </Button>
                                </form>

                                <div className="flex items-center justify-between text-sm pt-1">
                                    <button type="button" onClick={() => setStep('events')} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        ← Edit events/students
                                    </button>
                                    <button type="button" disabled={resendCountdown > 0 || loading} onClick={() => handleSendOtp()}
                                        className={`flex items-center gap-1 font-medium transition-colors ${resendCountdown > 0 ? 'text-slate-300 cursor-not-allowed' : 'text-emerald-600 hover:text-emerald-700'}`}>
                                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                                        {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <p className="text-center text-sm text-slate-500 mt-6">
                            Already registered?{' '}
                            <Link to="/school/login" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">Log in here</Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SchoolRegister;

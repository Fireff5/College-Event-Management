import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Event } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, ArrowLeft, Trophy, Calendar, MapPin } from 'lucide-react';

const PublicRegistration = () => {
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        id: '', // Roll Number or Registration ID
        name: '',
        email: '',
        phone: '',
        department: '',
        year: 1,
        institute: '',
        events: [] as number[]
    });
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await api.get('/public/events');
                setAllEvents(res.data.filter((e: Event) => e.category !== 'School Events'));
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
        };
        fetchEvents();
    }, []);

    const isPaperPresentationSelected = formData.events.some(id => {
        const ev = allEvents.find(e => e.id === id);
        const name = ev?.name.toLowerCase() || '';
        return name.includes('paper') && name.includes('presentation');
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isPaperPresentationSelected && !documentFile) {
            setErrorMsg('Please upload your Paper Presentation document (PDF/DOCX).');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        try {
            if (isPaperPresentationSelected && documentFile) {
                const formDataToSend = new FormData();
                formDataToSend.append('id', formData.id);
                formDataToSend.append('name', formData.name);
                formDataToSend.append('email', formData.email);
                formDataToSend.append('phone', formData.phone);
                formDataToSend.append('department', formData.department);
                formDataToSend.append('year', formData.year.toString());
                formDataToSend.append('institute', formData.institute);
                formDataToSend.append('events', JSON.stringify(formData.events));
                formDataToSend.append('document', documentFile);

                await api.post('/public/register', formDataToSend);
            } else {
                await api.post('/public/register', formData);
            }
            setSuccess(true);
        } catch (error: any) {
            setErrorMsg(error.response?.data?.msg || error.response?.data || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
                {/* Decorative blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
                </div>

                <div className="sm:mx-auto sm:w-full sm:max-w-md text-center bg-white/80 backdrop-blur-md p-10 rounded-3xl shadow-xl shadow-indigo-100 border border-white relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
                        <img
                            src="/college-logo.png"
                            alt="College Logo"
                            className="h-24 md:h-28 w-auto drop-shadow-md flex-shrink-0"
                        />
                        <div className="text-center flex flex-col items-center justify-center pt-2 md:pt-0">
                            <h1 className="text-2xl md:text-[1.6rem] leading-tight font-bold text-[#0c3c84] drop-shadow-sm font-serif mb-1">Dr. Sivanthi Aditanar College of Engineering</h1>
                            <h2 className="text-sm md:text-base font-bold text-slate-900 tracking-widest mb-2 uppercase">Tiruchendur</h2>
                            <p className="text-xs md:text-sm font-bold text-slate-800">Approved by AICTE, New Delhi, Affiliated to Anna University, Chennai</p>
                            <p className="text-xs md:text-sm font-bold text-slate-800">Accredited by NBA (CSE) and an ISO 9001:2015 Certified Institution</p>
                        </div>
                    </div>
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Registration Successful!</h2>
                    <p className="mt-3 text-lg text-slate-600">Your details have been saved successfully.</p>
                    <div className="mt-8">
                        <Button onClick={() => {
                            setSuccess(false);
                            setFormData({ id: '', name: '', email: '', phone: '', department: '', year: 1, institute: '', events: [] });
                            setDocumentFile(null);
                        }} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl py-6 text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]">
                            Register Another Participant
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-400/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-3xl relative z-10">

                <div className="text-center mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 mb-8">
                        <img
                            src="/college-logo.png"
                            alt="College Logo"
                            className="h-28 md:h-32 w-auto drop-shadow-xl hover:scale-105 transition-transform duration-500 ease-out flex-shrink-0"
                        />
                        <div className="text-center flex flex-col items-center justify-center hover:scale-[1.01] transition-transform duration-500 ease-out pt-2 md:pt-0">
                            <h1 className="text-2xl md:text-4xl font-extrabold text-[#0c3c84] drop-shadow-md font-serif tracking-tight mb-1">Dr. Sivanthi Aditanar College of Engineering</h1>
                            <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-[0.2em] mb-2 uppercase">Tiruchendur</h2>
                            <p className="text-xs md:text-base font-bold text-slate-800">Approved by AICTE, New Delhi, Affiliated to Anna University, Chennai</p>
                            <p className="text-xs md:text-base font-bold text-slate-800">Accredited by NBA (CSE) and an ISO 9001:2015 Certified Institution</p>
                        </div>
                    </div>
                    <h2 className="text-center text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 tracking-tight pb-1">
                        Events Registration
                    </h2>
                    <p className="mt-3 text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed">
                        Join us for an exciting season of sports and athletics. Fill out the form below to register and secure your spot in the upcoming events.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl py-10 px-6 shadow-2xl shadow-indigo-900/5 sm:rounded-3xl sm:px-12 border border-white/60 relative">
                    <form className="space-y-8" onSubmit={handleSubmit}>
                        {errorMsg && (
                            <div className="bg-red-50/80 backdrop-blur flex items-center text-red-700 p-4 rounded-xl text-sm border border-red-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                                <div className="w-1.5 h-full absolute left-0 top-0 bottom-0 bg-red-500 rounded-l-xl"></div>
                                <span className="ml-2 font-medium">{typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}</span>
                            </div>
                        )}

                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3">1</div>
                                Personal Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="id" className="text-slate-700 font-bold tracking-wide text-xs uppercase">Roll Number / ID <span className="text-blue-500">*</span></Label>
                                    <Input id="id" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} required placeholder="Enter uniquely identifying ID" className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all shadow-sm h-12" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="name" className="text-slate-700 font-bold tracking-wide text-xs uppercase">Full Name <span className="text-blue-500">*</span></Label>
                                    <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter your full name" className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all shadow-sm h-12" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="email" className="text-slate-700 font-bold tracking-wide text-xs uppercase">Email <span className="text-blue-500">*</span></Label>
                                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="your.email@example.com" className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all shadow-sm h-12" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="phone" className="text-slate-700 font-bold tracking-wide text-xs uppercase">Phone Number <span className="text-blue-500">*</span></Label>
                                    <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required placeholder="10-digit mobile number" className="bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all shadow-sm h-12" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
                                <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3">2</div>
                                Academic Profile
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2.5 md:col-span-2">
                                    <Label htmlFor="institute" className="text-slate-700 font-bold tracking-wide text-xs uppercase">Institute / College <span className="text-indigo-500">*</span></Label>
                                    <Input id="institute" value={formData.institute} onChange={e => setFormData({ ...formData, institute: e.target.value })} required placeholder="Dr. Sivanthi Aditanar College (or your college)" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl transition-all shadow-sm h-12" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="department" className="text-slate-700 font-bold tracking-wide text-xs uppercase">Department <span className="text-indigo-500">*</span></Label>
                                    <Input id="department" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required placeholder="e.g. IT, CSE, MECH" className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl transition-all shadow-sm h-12" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="year" className="text-slate-700 font-bold tracking-wide text-xs uppercase">Year <span className="text-indigo-500">*</span></Label>
                                    <Input id="year" type="number" min="1" max="5" value={formData.year} onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || 1 })} required className="bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl transition-all shadow-sm h-12" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/50 p-6 rounded-2xl border border-blue-100 shadow-inner bg-gradient-to-b from-blue-50/50 to-transparent">
                            <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
                                <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mr-3">3</div>
                                Select Events
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {allEvents.length === 0 ? (
                                    <p className="text-sm text-slate-500 col-span-2 py-6 text-center bg-white rounded-xl border border-slate-200 border-dashed">No active events found for registration.</p>
                                ) : (
                                    allEvents.map(ev => {
                                        const isChecked = formData.events.includes(ev.id);
                                        return (
                                            <div
                                                key={ev.id}
                                                onClick={() => {
                                                    const newEvents = isChecked
                                                        ? formData.events.filter(id => id !== ev.id)
                                                        : [...formData.events, ev.id];
                                                    setFormData({ ...formData, events: newEvents });
                                                }}
                                                className={`relative flex items-start space-x-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${isChecked
                                                    ? 'bg-blue-50/80 border-blue-500 shadow-md shadow-blue-500/10 scale-[1.02] ring-1 ring-blue-500'
                                                    : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                                                    }`}
                                            >
                                                <div className="flex-shrink-0 mt-1">
                                                    <div className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                                                        {isChecked && <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} />}
                                                    </div>
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center min-w-0 pr-6">
                                                    <Label className="font-bold text-slate-800 cursor-pointer text-base mb-1 truncate block leading-tight">
                                                        {ev.name}
                                                    </Label>
                                                    <div className="flex items-center text-xs text-slate-500 mt-1">
                                                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                                        <span className="font-medium text-slate-600">{new Date(ev.date).toLocaleDateString()}</span>
                                                    </div>
                                                    {ev.venue && (
                                                        <div className="flex items-center text-xs text-slate-500 mt-1 truncate">
                                                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                                                            <span className="truncate">{ev.venue}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {isChecked && (
                                                    <div className="absolute top-2 right-2 p-1.5 animate-in zoom-in fade-in duration-200">
                                                        <Trophy className="h-6 w-6 text-blue-500/40" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {isPaperPresentationSelected && (
                            <div className="bg-white/50 p-6 rounded-2xl border border-indigo-100 shadow-inner bg-gradient-to-b from-indigo-50/50 to-transparent animate-in zoom-in fade-in duration-300">
                                <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
                                    <div className="h-8 w-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center mr-3">4</div>
                                    Document Upload
                                </h3>
                                <div className="space-y-2.5">
                                    <Label htmlFor="document" className="text-slate-700 font-bold tracking-wide text-xs uppercase">
                                        Paper Presentation Document <span className="text-pink-500">*</span>
                                    </Label>
                                    <p className="text-xs text-slate-500 mb-2">Please upload your document in PDF or DOCX format.</p>
                                    <Input
                                        id="document"
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        required={isPaperPresentationSelected}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setDocumentFile(e.target.files[0]);
                                            } else {
                                                setDocumentFile(null);
                                            }
                                        }}
                                        className="bg-white border-slate-200 focus:border-pink-500 focus:ring-pink-500/20 rounded-xl transition-all shadow-sm h-12 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                                    />
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg py-7 rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.01] hover:shadow-indigo-600/30 font-bold tracking-wide"
                            disabled={loading || formData.events.length === 0}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Processing Registration...
                                </span>
                            ) : (
                                `Confirm Registration (${formData.events.length} Event${formData.events.length === 1 ? '' : 's'})`
                            )}
                        </Button>
                    </form>
                </div>

                <div className="text-center mt-8 pb-8 relative z-10">
                    <Link to="/login" className="inline-flex items-center justify-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors bg-white/50 backdrop-blur-sm px-5 py-2.5 rounded-full border border-slate-200/60 shadow-sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Admin Portal Login
                    </Link>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: #94a3b8;
                }
            `}</style>
        </div>
    );
};

export default PublicRegistration;

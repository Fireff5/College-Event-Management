import { Link } from 'react-router-dom';
import { GraduationCap, School, Trophy, ArrowRight, Medal, Users, Calendar } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden font-sans relative">

            {/* ── Ambient background ── */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-blue-700/20 blur-[120px]" />
                <div className="absolute -bottom-60 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-700/20 blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-violet-900/10 blur-[160px]" />
                {/* Subtle grid overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            {/* ── Header ── */}
            <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <img
                        src="/college-logo.png"
                        alt="College Logo"
                        className="h-12 w-auto drop-shadow-lg"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="hidden sm:block">
                        <p className="text-xs font-bold text-blue-300 tracking-widest uppercase leading-none">Dr. Sivanthi Aditanar</p>
                        <p className="text-[11px] text-slate-400 leading-none mt-0.5">College of Engineering · Tiruchendur</p>
                    </div>
                </div>
                <Link
                    to="/login"
                    className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full"
                >
                    Admin Portal
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
            </header>

            {/* ── Hero ── */}
            <main className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-12 md:pt-28 md:pb-16">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
                    <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                    Events Registration
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight max-w-5xl">
                    <span className="text-white">One Stage.</span>{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
                        Endless Glory.
                    </span>
                </h1>

                <p className="mt-6 text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">
                    Welcome to the official registration portal for the{' '}
                    <strong className="text-slate-200">Dr. Sivanthi Aditanar College of Engineering</strong>{' '}
                    Annual Sports Meet. Register your institution and compete for championship glory.
                </p>

                {/* Stats Bar */}
                <div className="flex flex-wrap items-center justify-center gap-8 mt-10 mb-16 text-center">
                    {[
                        { icon: Users, value: '500+', label: 'Participants' },
                        { icon: Calendar, value: 'Apr 2026', label: 'Event Date' },
                        { icon: Medal, value: '20+', label: 'Events' },
                    ].map(({ icon: Icon, value, label }) => (
                        <div key={label} className="flex flex-col items-center gap-1">
                            <Icon className="h-5 w-5 text-blue-400 mb-1" />
                            <span className="text-2xl font-extrabold text-white">{value}</span>
                            <span className="text-xs text-slate-500 uppercase tracking-widest">{label}</span>
                        </div>
                    ))}
                </div>

                {/* ── Registration Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">

                    {/* College Registration Card */}
                    <Link to="/register" className="group relative flex flex-col text-left p-8 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 backdrop-blur-xl shadow-2xl shadow-blue-900/20 transition-all duration-300 hover:scale-[1.02] hover:border-blue-400/40 hover:-translate-y-1 overflow-hidden">
                        {/* Glow accent */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-blue-500/15 blur-2xl group-hover:bg-blue-400/25 transition-colors duration-500" />

                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 group-hover:shadow-blue-500/50 transition-shadow">
                            <GraduationCap className="h-7 w-7 text-white" />
                        </div>

                        <h2 className="text-2xl font-extrabold text-white mb-2 group-hover:text-blue-100 transition-colors">
                            College
                            <br />
                            Registration
                        </h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 group-hover:text-slate-300 transition-colors">
                            For college participants. Register your students for athletics, field events, and the Paper Presentation.
                        </p>

                        {/* Pills */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {['Track & Field', 'Paper Presentation', 'Team Events'].map(tag => (
                                <span key={tag} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="mt-auto flex items-center gap-2 font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                            Register Now
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>

                    {/* School Registration Card */}
                    <Link to="/school/register" className="group relative flex flex-col text-left p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 hover:from-emerald-600/20 hover:to-teal-600/20 backdrop-blur-xl shadow-2xl shadow-emerald-900/20 transition-all duration-300 hover:scale-[1.02] hover:border-emerald-400/40 hover:-translate-y-1 overflow-hidden">
                        {/* Glow accent */}
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="pointer-events-none absolute -top-16 -right-16 w-40 h-40 rounded-full bg-emerald-500/15 blur-2xl group-hover:bg-emerald-400/25 transition-colors duration-500" />

                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 group-hover:shadow-emerald-500/50 transition-shadow">
                            <School className="h-7 w-7 text-white" />
                        </div>

                        <h2 className="text-2xl font-extrabold text-white mb-2 group-hover:text-emerald-100 transition-colors">
                            School
                            <br />
                            Registration
                        </h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6 group-hover:text-slate-300 transition-colors">
                            For school representatives. Register your school institution to participate in the annual sports meet.
                        </p>

                        {/* Pills */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {['School Sports', 'Relay Events', 'Championships'].map(tag => (
                                <span key={tag} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="mt-auto flex items-center gap-2 font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                            Register Now
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>

                {/* Already registered links */}
                <div className="flex flex-wrap gap-6 justify-center mt-8 text-sm text-slate-500">
                    <Link to="/school/login" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        School login
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                    <span className="text-slate-700">·</span>
                    <Link to="/login" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                        Admin login
                        <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </main>

            {/* ── Footer ── */}
            <footer className="relative z-10 text-center py-8 px-6 border-t border-white/5 text-xs text-slate-600">
                <p>
                    Dr. Sivanthi Aditanar College of Engineering · Tiruchendur ·{' '}
                    Affiliated to Anna University, Chennai
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;

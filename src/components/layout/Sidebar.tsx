import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Trophy,
    Medal,
    FileBadge,
    LogOut,
    FileText,
    School,
    GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Participants', path: '/participants', icon: Users },
    { name: 'Events', path: '/events', icon: Trophy },
    { name: 'Results', path: '/results', icon: Medal },
    { name: 'Paper Presentations', path: '/papers', icon: FileText },
    { name: 'Certificates', path: '/certificates', icon: FileBadge },
    { name: 'School Certificates', path: '/school-certificates', icon: GraduationCap },
    { name: 'Schools', path: '/schools', icon: School },
];

export const Sidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    return (
        <div className="flex flex-col w-64 h-screen bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300">
            <div className="flex items-center justify-center h-20 border-b border-slate-800">
                <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                    SPORTS MEET
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-600/20 text-blue-400"
                                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-100"
                            )}
                        >
                            <Icon size={20} className={cn(
                                "transition-colors duration-200",
                                isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                            )} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-slate-800">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-3"
                    onClick={logout}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </Button>
            </div>
        </div>
    );
};

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { School, User, Lock } from 'lucide-react';

const SchoolLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { schoolLogin, isSchoolAuthenticated } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Redirect to dashboard once authentication state is confirmed
    useEffect(() => {
        if (isSchoolAuthenticated) {
            navigate('/school/dashboard', { replace: true });
        }
    }, [isSchoolAuthenticated, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/schools/login', { username, password });
            schoolLogin(res.data.token, res.data.school);
            toast({
                title: 'Login Successful',
                description: `Welcome, ${res.data.school.name}!`,
            });
            // Navigation is handled by the isSchoolAuthenticated useEffect above
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: err.response?.data || 'Invalid credentials. Please check your username and password.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-4 items-center pt-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                        <School size={32} className="text-emerald-600" />
                    </div>
                    <div className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold text-slate-900">School Portal Login</CardTitle>
                        <CardDescription className="text-slate-500">
                            Enter your school credentials to access the portal
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="pb-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="s-username" className="flex items-center gap-2 text-slate-700">
                                <User size={14} className="text-emerald-600" />
                                Username
                            </Label>
                            <Input
                                id="s-username"
                                type="text"
                                placeholder="school_name_1"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="bg-white border-slate-200 focus:border-emerald-400 focus:ring-emerald-300"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="s-password" className="flex items-center gap-2 text-slate-700">
                                <Lock size={14} className="text-emerald-600" />
                                Password
                            </Label>
                            <Input
                                id="s-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white border-slate-200 focus:border-emerald-400 focus:ring-emerald-300"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all mt-2"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        Not registered yet?{' '}
                        <Link to="/school/register" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline">
                            Register your school
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default SchoolLogin;

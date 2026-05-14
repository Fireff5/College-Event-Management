import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { username, password });
            login(response.data.token);
            toast({
                title: "Login Successful",
                description: "Welcome to the Admin Portal",
            });
            navigate('/dashboard');
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: err.response?.data || "Invalid credentials. Try admin / password.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-blue-600/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-slate-50 to-slate-50 -z-10" />

            <Card className="w-full max-w-md shadow-xl border-slate-200">
                <CardHeader className="space-y-4 items-center pt-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2 shadow-inner">
                        <Trophy size={32} />
                    </div>
                    <div className="space-y-2 text-center">
                        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                            Sports Meet Admin
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Enter your credentials to access the portal
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter admin username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                            disabled={loading}
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
                {/* <CardFooter className="flex justify-center pb-8 text-sm text-slate-500">
                    <p>Mock Credentials: <b>admin</b> / <b>password</b></p>
                </CardFooter> */}
            </Card>
        </div>
    );
};

export default Login;

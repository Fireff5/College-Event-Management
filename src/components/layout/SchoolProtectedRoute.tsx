import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const SchoolProtectedRoute = () => {
    const { isSchoolAuthenticated } = useAuth();
    return isSchoolAuthenticated ? <Outlet /> : <Navigate to="/school/login" replace />;
};

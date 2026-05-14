import React, { createContext, useContext, useState, useEffect } from 'react';
import { School } from '../types';

interface AuthContextType {
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    // School session
    schoolToken: string | null;
    schoolData: School | null;
    schoolLogin: (token: string, school: School) => void;
    schoolLogout: () => void;
    isSchoolAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [schoolToken, setSchoolToken] = useState<string | null>(localStorage.getItem('schoolToken'));
    const [schoolData, setSchoolData] = useState<School | null>(() => {
        const raw = localStorage.getItem('schoolData');
        return raw ? JSON.parse(raw) : null;
    });

    useEffect(() => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
    }, [token]);

    useEffect(() => {
        if (schoolToken) localStorage.setItem('schoolToken', schoolToken);
        else localStorage.removeItem('schoolToken');
    }, [schoolToken]);

    useEffect(() => {
        if (schoolData) localStorage.setItem('schoolData', JSON.stringify(schoolData));
        else localStorage.removeItem('schoolData');
    }, [schoolData]);

    const login = (newToken: string) => setToken(newToken);
    const logout = () => setToken(null);

    const schoolLogin = (newToken: string, school: School) => {
        setSchoolToken(newToken);
        setSchoolData(school);
    };
    const schoolLogout = () => {
        setSchoolToken(null);
        setSchoolData(null);
        localStorage.removeItem('schoolToken');
        localStorage.removeItem('schoolId');
        localStorage.removeItem('schoolData');
    };

    return (
        <AuthContext.Provider value={{
            token, login, logout, isAuthenticated: !!token,
            schoolToken, schoolData, schoolLogin, schoolLogout,
            isSchoolAuthenticated: !!schoolToken,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

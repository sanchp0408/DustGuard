import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Detection from './pages/Detection';
import Suppression from './pages/Suppression';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Accountability from './pages/Accountability';
import Login from './pages/Login';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen bg-dark flex items-center justify-center text-white font-black text-4xl animate-pulse">Initializing DustGuard...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

const Layout = ({ children }) => (
    <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-10 max-w-[1600px] mx-auto overflow-x-hidden">
            {children}
        </main>
    </div>
);

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Layout><Dashboard /></Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/detection" element={
                        <ProtectedRoute>
                            <Layout><Detection /></Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/suppression" element={
                        <ProtectedRoute>
                            <Layout><Suppression /></Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/accountability" element={
                        <ProtectedRoute>
                            <Layout><Accountability /></Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                        <ProtectedRoute>
                            <Layout><Reports /></Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                        <ProtectedRoute>
                            <Layout><Settings /></Layout>
                        </ProtectedRoute>
                    } />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;

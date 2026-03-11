import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, LogOut, MessageCircleQuestion, Home as HomeIcon, Bookmark, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import QAFloatModal from './QAFloatModal';

function Layout() {
    const { user, setUser, currentLesson } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isQAModalOpen, setIsQAModalOpen] = useState(false);

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [authError, setAuthError] = useState('');

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setAuthError('');
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPass
            });

            if (error) {
                // Attempt signup if login fails
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: loginEmail,
                    password: loginPass
                });
                if (signUpError) throw signUpError;
                setUser(signUpData.user);
            } else {
                setUser(data.user);
            }
            setIsLoginModalOpen(false);
        } catch (err) {
            setAuthError(err.message);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        navigate('/');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            {/* Navigation Bar */}
            <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '0.75rem 1rem' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <Link to="/" style={{ textDecoration: 'none', flexShrink: 1 }}>
                        <h1 className="gradient-text" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                            <HomeIcon size={20} />
                            <span>Tutor<span style={{ color: 'var(--text-main)' }}>AI</span></span>
                        </h1>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {user && (
                            <Link to="/saved" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}>
                                <Bookmark size={16} />
                                <span className="nav-text">Saved</span>
                            </Link>
                        )}
                        <button
                            onClick={user ? handleLogout : () => setIsLoginModalOpen(true)}
                            className={user ? "btn btn-secondary" : "btn btn-primary"}
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}
                        >
                            {user ? <><LogOut size={16} /> <span className="nav-text">Logout</span></> : <><LogIn size={16} /> Login</>}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Simple Login Modal UI */}
            {isLoginModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card glass animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Login / Signup</h2>
                            <button onClick={() => setIsLoginModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAuthAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    required
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    required
                                    value={loginPass}
                                    onChange={(e) => setLoginPass(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                            {authError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{authError}</p>}
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                Continue
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="container" style={{ flex: 1, padding: '2rem 1.5rem', position: 'relative' }}>
                <Outlet />
            </main>

            {/* Global QA Float Action Button (Available if a lesson is active or logged in) */}
            {user && location.pathname !== '/' && (
                <>
                    <button
                        onClick={() => setIsQAModalOpen(true)}
                        className="btn btn-primary glass"
                        style={{
                            position: 'fixed', bottom: '2rem', right: '2rem',
                            borderRadius: 'var(--radius-full)', padding: '1rem',
                            boxShadow: 'var(--shadow-lg)', zIndex: 100
                        }}
                        title="Ask a Question"
                    >
                        <MessageCircleQuestion size={28} />
                    </button>
                </>
            )}

            {/* Q&A Modal Component */}
            {isQAModalOpen && <QAFloatModal onClose={() => setIsQAModalOpen(false)} />}
        </div>
    );
}

export default Layout;

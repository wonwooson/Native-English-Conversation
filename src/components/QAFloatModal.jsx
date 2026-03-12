import React, { useState, useEffect } from 'react';
import { X, Send, History, MessageCircle } from 'lucide-react';
import { answerContextualQuestion } from '../lib/gemini';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

function QAFloatModal({ onClose }) {
    const { currentLesson, user, qaHistory, fetchQAHistory, addQAHistory } = useAppStore();
    const [question, setQuestion] = useState('');
    const [sessionMessages, setSessionMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'history'

    // Load history once on mount
    useEffect(() => {
        if (user) {
            fetchQAHistory();
        }
    }, [user, fetchQAHistory]);

    // We use currentLesson as the context reference
    const contextRef = currentLesson
        ? `Topic: ${currentLesson.topic}. Situation: ${currentLesson.situation}. Dialogue: ${JSON.stringify(currentLesson.dialogue)}.`
        : 'General English Learning Context. No specific lesson active.';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        const currentQuestion = question;
        setQuestion('');
        const userMsg = { role: 'user', content: currentQuestion };
        setSessionMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const answer = await answerContextualQuestion(currentQuestion, contextRef);
            const aiMsg = { role: 'ai', content: answer };
            setSessionMessages(prev => [...prev, aiMsg]);

            // If logged in, save this QA to Supabase history and update store
            if (user) {
                const { data, error } = await supabase.from('qa_history').insert([{
                    user_id: user.id,
                    lesson_id: currentLesson?.id || null,
                    question: currentQuestion,
                    answer: answer,
                    context_reference: currentLesson ? `Lesson: ${currentLesson.topic}` : 'General'
                }]).select();

                if (data && data[0]) {
                    addQAHistory(data[0]);
                }
            }
        } catch (error) {
            setSessionMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't process your question at this moment." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '1.5rem' }}>
            <div className="card glass animate-fade-in" style={{ width: '100%', maxWidth: '400px', height: '640px', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Native AI Tutor</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', padding: '0.25rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)' }}>
                    <button
                        onClick={() => setActiveTab('chat')}
                        style={{
                            flex: 1, padding: '0.5rem', border: 'none', borderRadius: 'var(--radius-sm)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                            backgroundColor: activeTab === 'chat' ? 'var(--surface)' : 'transparent',
                            color: activeTab === 'chat' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <MessageCircle size={16} /> Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        style={{
                            flex: 1, padding: '0.5rem', border: 'none', borderRadius: 'var(--radius-sm)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                            backgroundColor: activeTab === 'history' ? 'var(--surface)' : 'transparent',
                            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <History size={16} /> History
                    </button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem', paddingRight: '0.5rem' }}>

                    {activeTab === 'chat' ? (
                        <>
                            {sessionMessages.length === 0 && (
                                <div style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', padding: '0 1.5rem' }}>
                                    <div style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                                        <MessageCircle size={24} />
                                    </div>
                                    <p style={{ color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.5rem' }}>Current Session</p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        Ask anything about {currentLesson ? "this lesson" : "learning English"}! I'll consider the context.
                                    </p>
                                </div>
                            )}
                            {sessionMessages.map((msg, idx) => (
                                <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                    <div style={{
                                        padding: '0.75rem 1rem',
                                        borderRadius: '1rem',
                                        borderBottomRightRadius: msg.role === 'user' ? '2px' : '1rem',
                                        borderBottomLeftRadius: msg.role === 'ai' ? '2px' : '1rem',
                                        backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                                        color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        border: msg.role === 'user' ? 'none' : '1px solid var(--border)'
                                    }}>
                                        <p style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div style={{ alignSelf: 'flex-start' }}>
                                    <div style={{ padding: '0.75rem 1rem', borderRadius: '1rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                                        <div className="flex-center" style={{ gap: '4px' }}>
                                            <div className="dot-pulse" style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-muted)' }}></div>
                                            <div className="dot-pulse" style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', animationDelay: '0.2s' }}></div>
                                            <div className="dot-pulse" style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', animationDelay: '0.4s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {qaHistory.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '4rem' }}>No history found yet.</p>
                            ) : (
                                [...qaHistory].reverse().map((item, idx) => (
                                    <div key={item.id || idx} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>
                                                {item.context_reference || 'General'}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>Q: {item.question}</p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>A: {item.answer}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Input Form */}
                {activeTab === 'chat' && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Type your question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                            <Send size={18} />
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
}

export default QAFloatModal;

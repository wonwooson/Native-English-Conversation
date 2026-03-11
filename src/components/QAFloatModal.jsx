import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { answerContextualQuestion } from '../lib/gemini';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

function QAFloatModal({ onClose }) {
    const { currentLesson, user } = useAppStore();
    const [question, setQuestion] = useState('');
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // We use currentLesson as the context reference
    const contextRef = currentLesson
        ? `Topic: ${currentLesson.topic}. Situation: ${currentLesson.situation}. Dialogue: ${JSON.stringify(currentLesson.dialogue)}.`
        : 'General English Learning Context. No specific lesson active.';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        const currentQuestion = question;
        setQuestion('');
        setHistory(prev => [...prev, { role: 'user', content: currentQuestion }]);
        setIsLoading(true);

        try {
            const answer = await answerContextualQuestion(currentQuestion, contextRef);
            setHistory(prev => [...prev, { role: 'ai', content: answer }]);

            // If logged in, save this QA to Supabase history
            if (user) {
                await supabase.from('qa_history').insert([{
                    user_id: user.id,
                    lesson_id: currentLesson?.id || null, // null if it's a general question
                    question: currentQuestion,
                    answer: answer,
                    context_reference: currentLesson ? `Lesson: ${currentLesson.topic}` : 'General'
                }]);
            }
        } catch (error) {
            setHistory(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't process your question at this moment." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '1.5rem' }}>
            <div className="card glass animate-fade-in" style={{ width: '100%', maxWidth: '400px', height: '600px', display: 'flex', flexDirection: 'column', position: 'relative' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ask Native Tutor</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Chat History */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
                    {history.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto', fontSize: '0.9rem' }}>
                            Ask anything about English or the current lesson! I'll consider the context.
                        </p>
                    )}
                    {history.map((msg, idx) => (
                        <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                            <div style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '1rem',
                                backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                                color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                                border: msg.role === 'user' ? 'none' : '1px solid var(--border)'
                            }}>
                                <p style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ alignSelf: 'flex-start' }}>
                            <p className="animate-pulse" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tutor is typing...</p>
                        </div>
                    )}
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Type your question..."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ padding: '0.75rem' }}>
                        <Send size={18} />
                    </button>
                </form>

            </div>
        </div>
    );
}

export default QAFloatModal;

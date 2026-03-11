import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Target } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

function Home() {
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAppStore();
    const navigate = useNavigate();

    const handleStart = async (e) => {
        e.preventDefault();
        console.log("handleStart called with topic:", topic);
        if (!topic.trim()) return;

        if (!user) {
            console.warn("User not logged in. Showing alert.");
            alert("Please login first to start learning.");
            return;
        }

        // Rather than fetching the lesson immediately here, 
        // we'll navigate to the learning dashboard and pass the topic.
        console.log("Navigating to /learn");
        navigate('/learn', { state: { topic: topic } });
    };

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', paddingTop: 'clamp(2rem, 10vh, 4rem)' }}>
            <div className="animate-fade-in">
                <h1 style={{ fontSize: 'clamp(1.75rem, 8vw, 3rem)', marginBottom: '1rem' }}>
                    Master English with <br />
                    <span className="gradient-text">Your Native AI Tutor</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(1rem, 4vw, 1.25rem)', marginBottom: '2.5rem' }}>
                    Input a topic in Korean and get tailored situations, dialogues, OPIc scripts, and visual speaking coaching instantly.
                </p>

                <form onSubmit={handleStart} className="card glass" style={{ padding: 'clamp(1rem, 5vw, 2rem)', marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                        <label htmlFor="topic-input" style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            What do you want to talk about? (주제를 한글로 입력하세요)
                        </label>
                        <div className="responsive-input-group">
                            <input
                                id="topic-input"
                                className="input-field"
                                placeholder="예: 카페에서 아이스 아메리카노 주문하기"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={isLoading}>
                                {isLoading ? 'Loading...' : <><Sparkles size={20} /> Start Lesson</>}
                            </button>
                        </div>
                    </div>
                </form>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', textAlign: 'left' }}>
                    <div className="card glass">
                        <BookOpen size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>Real-world Situations</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Learn with contextual dialogues and key expressions chunked for you.</p>
                    </div>
                    <div className="card glass">
                        <Target size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>OPIc Readiness</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Get tailored 30-60s speaking scripts equipped with vital vocabulary.</p>
                    </div>
                    <div className="card glass">
                        <Sparkles size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>Visual Coaching</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Master linking words, pauses, and stress visually without recording.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;

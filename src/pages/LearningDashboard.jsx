import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, Save, Sparkles, Volume2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { generateLessonContent, generateSpeakingGuide } from '../lib/gemini';

function LearningDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentLesson, setCurrentLesson, saveCurrentLesson, savedLessons } = useAppStore();

    const [activeTab, setActiveTab] = useState('dialogue');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [speakingGuide, setSpeakingGuide] = useState(currentLesson?.speaking_guide || null);
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

    // Sync local speakingGuide state when currentLesson changes (e.g. navigating from Saved)
    useEffect(() => {
        if (currentLesson?.speaking_guide) {
            setSpeakingGuide(currentLesson.speaking_guide);
        } else {
            setSpeakingGuide(null);
        }
    }, [currentLesson]);

    const topicFromState = location.state?.topic;
    const processingTopic = React.useRef(null);

    useEffect(() => {
        // If we have a topic from Home, generate a new lesson
        const loadLesson = async () => {
            if (topicFromState && (!currentLesson || currentLesson.topic !== topicFromState)) {
                // Prevent double execution in Strict Mode
                if (processingTopic.current === topicFromState) return;
                processingTopic.current = topicFromState;
                setIsGenerating(true);
                try {
                    const content = await generateLessonContent(topicFromState);
                    content.topic = topicFromState; // attach topic to the content object

                    // Automatically generate speaking guide as well
                    setIsGeneratingGuide(true);
                    try {
                        const guide = await generateSpeakingGuide(content.opic_script);
                        content.speaking_guide = guide;
                        setSpeakingGuide(guide);
                    } catch (guideErr) {
                        console.error("Failed to auto-generate guide:", guideErr);
                    } finally {
                        setIsGeneratingGuide(false);
                    }

                    setCurrentLesson(content);

                    // Automatically save to Supabase using the fresh content object
                    saveCurrentLesson(content, true);
                } catch (e) {
                    alert('Failed to generate lesson. Ensure API keys are set correctly.');
                    navigate('/');
                } finally {
                    setIsGenerating(false);
                }
            } else if (!currentLesson) {
                // No lesson in state, redirect to home
                navigate('/');
            }
        };
        loadLesson();
    }, [topicFromState]);

    const handleSave = async () => {
        setIsSaving(true);
        await saveCurrentLesson();
        setIsSaving(false);
    };

    const isSaved = currentLesson && savedLessons.some(l => l.topic === currentLesson.topic);

    // Tab 3: Request visual speaking guide
    const handleGenerateGuide = async () => {
        if (!currentLesson?.opic_script) return;
        setIsGeneratingGuide(true);
        try {
            const guide = await generateSpeakingGuide(currentLesson.opic_script);
            setSpeakingGuide(guide);
            // Update the current lesson in store so it can be saved with the guide
            setCurrentLesson({ ...currentLesson, speaking_guide: guide });
        } catch (e) {
            alert("Failed to generate speaking guide.");
        } finally {
            setIsGeneratingGuide(false);
        }
    };

    if (isGenerating) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
                <Sparkles size={48} color="var(--primary)" className="animate-pulse" />
                <h2 className="gradient-text animate-pulse">Designing your custom lesson...</h2>
                <p style={{ color: 'var(--text-muted)' }}>AI is creating a situation, dialogue, and OPIc script.</p>
            </div>
        );
    }

    if (!currentLesson) return null;

    return (
        <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Topic: {currentLesson.topic}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{currentLesson.situation}</p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                {['dialogue', 'opic', 'coach'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: activeTab === tab ? 'var(--primary)' : 'transparent',
                            color: activeTab === tab ? 'white' : 'var(--text-muted)',
                            border: 'none',
                            borderRadius: 'var(--radius-lg)',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'dialogue' && '1. Dialogue & Chunks'}
                        {tab === 'opic' && '2. OPIc & Vocab'}
                        {tab === 'coach' && '3. Visual Coach'}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="card glass">

                {/* Tab 1: Dialogue & Chunks */}
                {activeTab === 'dialogue' && (
                    <div className="animate-fade-in">
                        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Situation Dialogue</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            {currentLesson.dialogue?.map((line, i) => (
                                <div key={i} className="responsive-dialogue" style={{
                                    backgroundColor: line.speaker === 'A' ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                                    borderRadius: 'var(--radius-md)', display: 'flex', gap: '1rem', padding: '1rem'
                                }}>
                                    <div className="dialogue-top-row">
                                        <div style={{ fontWeight: 'bold', color: 'var(--primary)', minWidth: '30px' }}>{line.speaker}</div>
                                        <button
                                            onClick={() => {
                                                const utterance = new SpeechSynthesisUtterance(line.text);
                                                utterance.lang = 'en-US';
                                                utterance.rate = 0.9;
                                                window.speechSynthesis.speak(utterance);
                                            }}
                                            className="btn btn-secondary"
                                            style={{ padding: '0.4rem', borderRadius: '50%', minWidth: '36px', height: '36px' }}
                                        >
                                            <Volume2 size={18} />
                                        </button>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>{line.text}</p>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{line.translation}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Key Expression Chunks</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                            {currentLesson.key_expressions?.map((exp, i) => (
                                <div key={i} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '0.5rem' }}>{exp.expression}</p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{exp.meaning}</p>
                                    <p style={{ fontSize: '0.9rem', fontStyle: 'italic', backgroundColor: 'var(--background)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>"{exp.example}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab 2: OPIc & Vocab */}
                {activeTab === 'opic' && (
                    <div className="animate-fade-in">
                        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>OPIc Speaking Script (30-60s)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                                <button
                                    onClick={() => {
                                        const utterance = new SpeechSynthesisUtterance(currentLesson.opic_script);
                                        utterance.lang = 'en-US';
                                        utterance.rate = 0.9;
                                        window.speechSynthesis.speak(utterance);
                                    }}
                                    className="btn btn-secondary"
                                    style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
                                >
                                    <Volume2 size={24} />
                                </button>
                            </div>
                            <div className="responsive-script-container" style={{ backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.6', paddingRight: '4rem' }}>
                                {currentLesson.opic_script}
                            </div>
                        </div>

                        <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Essential Vocabulary</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {currentLesson.vocabulary?.map((v, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-sm)' }}>
                                    <span style={{ fontWeight: 'bold' }}>{v.word} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({v.part_of_speech})</span></span>
                                    <span style={{ color: 'var(--text-muted)' }}>{v.meaning}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab 3: Visual Speaking Coach */}
                {activeTab === 'coach' && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <h3 style={{ margin: 0, color: 'var(--primary)' }}>Visual Speaking Coach</h3>
                                {currentLesson?.opic_script && (
                                    <button
                                        onClick={() => {
                                            const utterance = new SpeechSynthesisUtterance(currentLesson.opic_script);
                                            utterance.lang = 'en-US';
                                            utterance.rate = 0.9;
                                            window.speechSynthesis.speak(utterance);
                                        }}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.4rem', borderRadius: '50%', width: '40px', height: '40px' }}
                                        title="Listen to script"
                                    >
                                        <Volume2 size={24} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {!speakingGuide && !isGeneratingGuide && (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                <Volume2 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>Preparation is complete. You can view the speaking analysis below.</p>
                            </div>
                        )}

                        {isGeneratingGuide && (
                            <div className="flex-center" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem' }}>
                                <div className="animate-pulse" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>Analyzing phonetics and stress patterns...</div>
                            </div>
                        )}

                        {speakingGuide && (
                            <div className="animate-fade-in">
                                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <span className="chunk-pause">/</span> Pause here
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <span className="linking-word">link-these</span> Linked sounds
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <span className="stress-word">STRESS</span> Word stress
                                    </div>
                                </div>

                                <div
                                    className="speaking-coach-script"
                                    style={{ backgroundColor: 'var(--background)', padding: 'clamp(1rem, 5vw, 2rem)', borderRadius: 'var(--radius-md)', lineHeight: '2' }}
                                    dangerouslySetInnerHTML={{ __html: speakingGuide.guided_text }}
                                />

                                <div style={{ marginTop: '2rem' }}>
                                    <h4 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Coaching Tips</h4>
                                    <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
                                        {speakingGuide.tips?.map((tip, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{tip}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}

export default LearningDashboard;

import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Trash2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function SavedLessons() {
    const { savedLessons, fetchSavedLessons, deleteLessons, setCurrentLesson, user } = useAppStore();
    const [selectedIds, setSelectedIds] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetchSavedLessons();
        }
    }, [user, fetchSavedLessons]);

    const handleToggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        await deleteLessons(selectedIds);
        setSelectedIds([]);
        setShowConfirm(false);
    };

    const handleReview = (lesson) => {
        setCurrentLesson(lesson);
        // Navigate via state so it doesn't trigger a new generation
        // since we already set currentLesson
        navigate('/learn');
    };

    if (!user) {
        return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Please log in to view saved lessons.</div>;
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem' }}>Saved Lessons</h2>
                <button
                    onClick={handleDelete}
                    disabled={selectedIds.length === 0}
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 1rem' }}
                >
                    <Trash2 size={18} />
                    Delete Selected ({selectedIds.length})
                </button>
            </div>

            {/* Custom Confirmation Modal */}
            {showConfirm && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.25rem' }}>
                    <div className="card glass animate-fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Delete Lessons?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Are you sure you want to delete {selectedIds.length} selected lesson(s)?
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setShowConfirm(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={confirmDelete} className="btn btn-danger">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {savedLessons.length === 0 ? (
                <div className="card glass flex-center" style={{ minHeight: '30vh', color: 'var(--text-muted)' }}>
                    <p>No saved lessons yet. Go create some!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {savedLessons.map(lesson => (
                        <div key={lesson.id} className="card glass saved-lesson-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(lesson.id)}
                                    onChange={() => handleToggleSelect(lesson.id)}
                                    style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer', flexShrink: 0 }}
                                />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.25rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lesson.topic}</h3>
                                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
                                        {new Date(lesson.created_at).toLocaleDateString()} • {lesson.situation.substring(0, 80)}...
                                    </p>
                                </div>
                            </div>

                            <button onClick={() => handleReview(lesson)} className="btn btn-secondary review-btn" style={{ padding: '0.5rem 1rem', flexShrink: 0 }}>
                                <ExternalLink size={18} />
                                Review
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SavedLessons;

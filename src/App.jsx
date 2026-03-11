import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import LearningDashboard from './pages/LearningDashboard';
import SavedLessons from './pages/SavedLessons';

function App() {
  const { checkAuth, isAuthLoading } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isAuthLoading) {
    return (
      <div className="flex-center min-h-screen" style={{ minHeight: '100vh' }}>
        <p className="animate-pulse gradient-text" style={{ fontSize: '1.5rem', fontWeight: "bold" }}>Validating English Tutor...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="learn" element={<LearningDashboard />} />
          <Route path="saved" element={<SavedLessons />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

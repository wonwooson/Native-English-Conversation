import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAppStore = create((set, get) => ({
    user: null,
    isAuthLoading: true,
    currentLesson: null,
    savedLessons: [],
    qaHistory: [],

    // Set the current lesson being viewed (e.g. newly generated or selected from saved)
    setCurrentLesson: (lesson) => set({ currentLesson: lesson }),

    // Auth actions
    setUser: (user) => set({ user }),
    checkAuth: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            set({ user: session?.user || null, isAuthLoading: false });
        } catch (e) {
            set({ isAuthLoading: false });
        }
    },

    // Save lesson to Supabase
    saveCurrentLesson: async (lessonData = null, silent = false) => {
        const { user, currentLesson } = get();
        const lessonToSave = lessonData || currentLesson;

        if (!lessonToSave || !user) {
            if (!silent) alert("No lesson or user found to save.");
            return;
        }

        try {
            const { data, error } = await supabase.from('lessons').insert([{
                user_id: user.id,
                topic: lessonToSave.topic,
                situation: lessonToSave.situation,
                dialogue: lessonToSave.dialogue,
                key_expressions: lessonToSave.key_expressions,
                opic_script: lessonToSave.opic_script,
                vocabulary: lessonToSave.vocabulary,
                speaking_guide: lessonToSave.speaking_guide || null
            }]).select();

            if (error) {
                console.error("Supabase Save Error:", error);
                if (!silent) alert(`Error saving lesson: ${error.message}`);
                throw error;
            }
            if (data) {
                console.log("Successfully saved lesson:", data[0]);
                set({ savedLessons: [data[0], ...get().savedLessons] });
                if (!silent) alert("Lesson saved successfully!");
            }
        } catch (err) {
            console.error("Catch block Save Error:", err);
        }
    },

    // Fetch saved lessons
    fetchSavedLessons: async () => {
        const { user } = get();
        console.log("Fetching lessons for user:", user?.id);
        if (!user) return;
        try {
            const { data, error } = await supabase.from('lessons').select('*').order('created_at', { ascending: false });
            if (error) {
                console.error("Supabase Fetch Error:", error);
                alert(`Error fetching lessons: ${error.message}`);
                throw error;
            }
            console.log("Fetched lessons count:", data?.length);
            set({ savedLessons: data || [] });
        } catch (err) {
            console.error("Catch block Fetch Error:", err);
        }
    },

    // QA History actions
    fetchQAHistory: async (lessonId = null) => {
        const { user } = get();
        if (!user) return;
        try {
            let query = supabase.from('qa_history').select('*').order('created_at', { ascending: true });

            // If lessonId is provided, we can either filter by it or show all.
            // For now, let's just fetch all global history for the user, 
            // or we could filter by lessonId if we want contextual history.
            // Let's go with global for now as "history" usually means everything.
            if (lessonId) {
                // Optional: filter by lessonId
                // query = query.eq('lesson_id', lessonId);
            }

            const { data, error } = await query;
            if (error) throw error;
            set({ qaHistory: data || [] });
        } catch (err) {
            console.error("Error fetching QA history:", err);
        }
    },

    addQAHistory: (qa) => {
        set({ qaHistory: [...get().qaHistory, qa] });
    },

    // Delete lessons (bulk or single)
    deleteLessons: async (ids) => {
        const { user } = get();
        if (!user) return;
        try {
            const { error } = await supabase.from('lessons').delete().in('id', ids);
            if (error) throw error;
            set({ savedLessons: get().savedLessons.filter(l => !ids.includes(l.id)) });
        } catch (err) {
            console.error("Error deleting lessons:", err);
        }
    }
}));

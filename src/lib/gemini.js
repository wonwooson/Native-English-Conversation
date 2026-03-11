import { GoogleGenAI } from '@google/genai';

// Initialize the API with Vite environment variable
// Make sure to add VITE_GEMINI_API_KEY in your .env file
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY' });

export const generateLessonContent = async (topic) => {
  const prompt = `
    You are an expert native English tutor and OPIc examiner.
    The user wants to learn about the following topic: "${topic}".
    Do not use markdown blocks like \`\`\`json in the response, just return raw JSON string.
    Return exactly a JSON object with this exact structure, nothing else:
    {
      "situation": "A short, engaging English description of the situation related to the topic.",
      "dialogue": [
        {"speaker": "A", "text": "...", "translation": "..."},
        {"speaker": "B", "text": "...", "translation": "..."}
      ],
      "key_expressions": [
        {"expression": "...", "meaning": "...", "example": "..."}
      ],
      "opic_script": "A 30-60 second natural English script on this topic suitable for an OPIc exam level IM-AL.",
      "vocabulary": [
        {"word": "...", "meaning": "...", "part_of_speech": "..."}
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const text = response.text;
    // Strip markdown formatting if the model still includes it
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating lesson:", error);
    throw new Error("Failed to generate lesson content from AI.");
  }
};

export const generateSpeakingGuide = async (text) => {
  const prompt = `
    Take the following English text and provide pronunciation coaching guides for Korean learners.
    Text: "${text}"
    Do not use markdown blocks like \`\`\`json in the response, just return raw JSON string.

    Return exactly a JSON object with this exact structure:
    {
      "guided_text": "The original text annotated with HTML span tags. Use <span class='chunk-pause'>/</span> for pauses, add <span class='linking-word'>underscore or dash</span> between linked words, and use <span class='stress-word'>bolded caps</span> for stressed syllables.",
      "tips": ["Tip 1 in Korean", "Tip 2 in Korean"]
    }
    Please provide the "tips" in Korean (한국어로 작성해주세요).
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const result = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(result);
  } catch (error) {
    console.error("Error generating guide:", error);
    throw new Error("Failed to generate speaking guide.");
  }
};

export const answerContextualQuestion = async (question, contextRef) => {
  const prompt = `
    You are a friendly, expert native English tutor.
    The user is currently studying this context: "${contextRef}".
    They have asked the following question: "${question}".
    Provide a natural, encouraging answer focusing on native-like expression polishing if applicable.
    Keep it concise and clear. Do not return JSON, just the text answer.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error answering QA:", error);
    throw new Error("Failed to answer question.");
  }
};

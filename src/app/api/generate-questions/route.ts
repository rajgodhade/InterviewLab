import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { getFallbackQuestions } from '@/lib/questionBank';

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(req: Request) {
  try {
    const { interviewId, technology, difficulty, numQuestions } = await req.json();

    if (!interviewId || !technology || !difficulty || !numQuestions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let questionsToInsert;

    try {
      if (!ai) {
        console.error('GEMINI_API_KEY is not configured.');
        throw new Error('No GEMINI_API_KEY configured.');
      }

      const prompt = `You are an expert technical interviewer. Generate exactly ${numQuestions} interview questions for a ${difficulty} level candidate in ${technology}.

Return ONLY a valid JSON array. Each object must have:
- "question" (string)
- "type" (one of: "mcq", "true_false", "short_answer", "long_answer")
- "options" (array of 4 strings, ONLY for "mcq" type, omit for others)
- "answer" (string, the correct/expected answer)

Do not include markdown code blocks. Just the raw JSON array.`;

      console.log('Requesting Gemini API:', { technology, difficulty, numQuestions });

      // @google/genai v1.50+ uses ai.models.generateContent()
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });

      const text = response.text;

      console.log('AI Response received. Length:', text?.length);

      if (!text) throw new Error('AI returned an empty response.');

      // Robust JSON extraction - find the array brackets
      let cleanText = text.trim();
      const startIdx = cleanText.indexOf('[');
      const endIdx = cleanText.lastIndexOf(']');
      
      if (startIdx === -1 || endIdx === -1) {
        console.error('Failed to find JSON array in response:', text);
        throw new Error('AI response did not contain a valid JSON array.');
      }
      
      cleanText = cleanText.substring(startIdx, endIdx + 1);
      const questionsArray = JSON.parse(cleanText);

      questionsToInsert = questionsArray.map((q: any, i: number) => ({
        interview_id: interviewId,
        question_text: q.question,
        question_type: q.type || 'short_answer',
        options: q.options || null,
        expected_answer: q.answer,
        order_index: i
      }));

      console.log(`AI generated ${questionsToInsert.length} questions successfully.`);
    } catch (aiError: any) {
      console.error('AI GENERATION FAILURE:', aiError.message);

      const fallback = getFallbackQuestions(technology, difficulty, numQuestions);
      questionsToInsert = fallback.map((q, i) => ({
        interview_id: interviewId,
        question_text: q.question,
        question_type: q.type,
        options: q.options || null,
        expected_answer: q.answer,
        order_index: i
      }));
    }

    const { error: insertError } = await supabase.from('questions').insert(questionsToInsert);
    if (insertError) throw insertError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error in generate-questions route:', error);
    const msg = error?.message || JSON.stringify(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

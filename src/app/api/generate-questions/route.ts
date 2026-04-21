import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';
import { getFallbackQuestions } from '@/lib/questionBank';

// Initialize the Gen AI client
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { interviewId, technology, difficulty, numQuestions } = body;

    console.log('--- Generation Request Start ---');
    console.log(`Interview ID: ${interviewId}`);
    console.log(`Topic: ${technology}, Difficulty: ${difficulty}, Count: ${numQuestions}`);

    if (!interviewId || !technology || !difficulty || !numQuestions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let questionsToInsert: any[] = [];
    let generationMethod = 'AI';

    try {
      if (!genAI) {
        throw new Error('GEMINI_API_KEY is not configured in .env.local');
      }

      const prompt = `You are an expert technical interviewer. Generate exactly ${numQuestions} interview questions for a ${difficulty} level candidate in ${technology}.

Return ONLY a valid JSON array. Each object in the array MUST have exactly these keys:
- "question": (string) The full question text.
- "type": (string) One of: "mcq", "true_false", "short_answer", "long_answer", "coding".
- "options": (array of 4 strings) ONLY if type is "mcq", otherwise omit or null.
- "answer": (string) The correct answer or expected explanation.

DO NOT include markdown code blocks (like \`\`\`json). Just the raw JSON array.
If multiple topics are provided, distribute questions across them.`;

      console.log('Calling Google Gen AI...');
      
      // Attempting with Gemini 2.0 Flash (latest)
      // The new unified SDK uses this structure
      const result = await genAI.models.generateContent({
        model: 'gemini-1.5-flash', // More stable default
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const responseText = result.text;
      console.log('AI Response received. Length:', responseText?.length);

      if (!responseText) {
        throw new Error('AI returned an empty response.');
      }

      // Robust JSON extraction
      let jsonStr = responseText.trim();
      
      // Remove potential markdown wrappers
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      // Find actual array boundaries to ignore any preamble/postamble
      const firstBracket = jsonStr.indexOf('[');
      const lastBracket = jsonStr.lastIndexOf(']');
      
      if (firstBracket === -1 || lastBracket === -1) {
        console.error('Raw AI response:', responseText);
        throw new Error('AI response did not contain a valid JSON array structure.');
      }
      
      jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
      
      const parsedQuestions = JSON.parse(jsonStr);
      
      if (!Array.isArray(parsedQuestions)) {
        throw new Error('AI response is not an array.');
      }

      questionsToInsert = parsedQuestions.map((q: any, i: number) => ({
        interview_id: interviewId,
        question_text: q.question || q.question_text || 'Untitled Question',
        question_type: q.type || q.question_type || 'short_answer',
        options: q.options || null,
        expected_answer: q.answer || q.expected_answer || 'No answer provided',
        order_index: i
      }));

      console.log(`Successfully generated ${questionsToInsert.length} AI questions.`);

    } catch (aiError: any) {
      console.error('AI GENERATION ERROR:', aiError.message);
      console.log('Switching to Fallback Question Bank...');
      generationMethod = 'Fallback';

      const fallback = getFallbackQuestions(technology, difficulty, numQuestions);
      questionsToInsert = fallback.map((q, i) => ({
        interview_id: interviewId,
        question_text: q.question,
        question_type: q.type,
        options: q.options || null,
        expected_answer: q.answer,
        order_index: i
      }));

      if (questionsToInsert.length === 0) {
        throw new Error(`Failed to generate AI questions and no fallback questions found for "${technology}".`);
      }
      
      console.log(`Loaded ${questionsToInsert.length} fallback questions.`);
    }

    // Insert into Supabase
    console.log(`Inserting ${questionsToInsert.length} questions into DB...`);
    const { error: insertError } = await supabase.from('questions').insert(questionsToInsert);
    
    if (insertError) {
      console.error('SUPABASE INSERT ERROR:', insertError);
      throw insertError;
    }

    console.log('--- Generation Request Complete (Success) ---');
    return NextResponse.json({ 
      success: true, 
      count: questionsToInsert.length,
      method: generationMethod 
    });

  } catch (error: any) {
    console.error('CRITICAL GENERATION FAILURE:', error);
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred during question generation' 
    }, { status: 500 });
  }
}

import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { OpenAI } from 'openai';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { projectId, docId, text } = await req.json();

    if (!projectId || !docId || !text || text.length < 50) {
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
      });
    }

    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(docId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid project or document ID' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const project = await Project.findOne({
      _id: projectId,
      userId: session.user.id,
    });

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    const document = project.documents.find(
      (doc) => doc._id.toString() === docId
    );

    if (!document) {
      return new Response(
        JSON.stringify({ error: 'Document not found in project' }),
        { status: 404 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // **Step 1: Combined GPT-3.5-turbo Request (Depth Score + Generalized Feedback)**
    const scoreAndFeedbackResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Analyze the following text in terms of its depth and effectiveness in storytelling. Provide:
          1. A score from 1-100 in each of these categories:
             - Sensory Details
             - Deep POV
             - Emotional Resonance
             - Conflict
          2. Brief feedback for each category, explaining areas of improvement.

          Return the result in this JSON format:
          {
            "sensoryDetails": { "score": X, "feedback": "Your feedback here" },
            "deepPOV": { "score": X, "feedback": "Your feedback here" },
            "emotionalResonance": { "score": X, "feedback": "Your feedback here" },
            "conflict": { "score": X, "feedback": "Your feedback here" }
          }`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    let structuredScoreFeedback = {};
    try {
      structuredScoreFeedback = JSON.parse(
        scoreAndFeedbackResponse.choices[0]?.message?.content || '{}'
      );
    } catch (error) {
      console.error('Error parsing Depth Score & Feedback:', error);
    }

    // **Step 2: GPT-4o Request for Inline Feedback**
    const inlineResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Identify specific words, phrases, or sentences that could be improved in these four areas:
          1. Sensory Details
          2. Deep POV
          3. Emotional Resonance
          4. Conflict
    
          Return an array of objects formatted like this:
          [
            {
              "text": "Original excerpt needing improvement",
              "category": "Sensory Details",
              "suggestion": "Improve by adding more tactile sensations."
            }
          ]
    
          Do NOT return anything except valid JSON.`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 600,
      temperature: 0.6,
    });

    // **Safely parse Inline Feedback**
    let structuredHighlights = [];

    try {
      const rawResponse = inlineResponse.choices[0]?.message?.content || '';
      console.log('🔹 RAW INLINE RESPONSE:', rawResponse); // 🔍 Log response

      // Ensure response is only JSON (GPT sometimes adds explanations)
      const jsonMatch = rawResponse.match(/\[.*\]/s); // Extract JSON from response
      if (jsonMatch) {
        structuredHighlights = JSON.parse(jsonMatch[0]); // Parse extracted JSON
      } else {
        console.warn(
          '⚠️ Could not extract valid JSON from response:',
          rawResponse
        );
      }
    } catch (error) {
      console.error('❌ Error parsing inline feedback:', error);
    }

    // Convert highlights to key-value format
    const highlights = {};
    structuredHighlights.forEach((item, index) => {
      highlights[`highlight_${index}`] = {
        text: item.text,
        suggestions: [{ category: item.category, advice: item.suggestion }],
      };
    });

    // **Update document with new analysis results**
    document.analysisData = {
      sensoryDetails: structuredScoreFeedback.sensoryDetails?.feedback || '',
      povDepth: structuredScoreFeedback.deepPOV?.feedback || '',
      emotionalResonance:
        structuredScoreFeedback.emotionalResonance?.feedback || '',
      conflict: structuredScoreFeedback.conflict?.feedback || '',
    };

    document.analysisScore = {
      depthScores: {
        sensory: structuredScoreFeedback.sensoryDetails?.score || 0,
        pov: structuredScoreFeedback.deepPOV?.score || 0,
        emotional: structuredScoreFeedback.emotionalResonance?.score || 0,
        conflict: structuredScoreFeedback.conflict?.score || 0,
      },
    };

    document.highlights = highlights || {};
    document.updatedAt = new Date();
    await project.save();

    return new Response(
      JSON.stringify({
        message: 'Analysis completed successfully',
        analysisData: document.analysisData || {},
        analysisScore: document.analysisScore || {},
        highlights: document.highlights || {},
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error analyzing text:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

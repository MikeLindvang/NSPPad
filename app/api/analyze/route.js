import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { OpenAI } from 'openai';

export async function POST(req) {
  try {
    console.log('✅ Received Analysis Request');

    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('❌ Unauthorized Access');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { projectId, docId, text } = await req.json();
    console.log('🔍 Request Data:', {
      projectId,
      docId,
      textLength: text?.length,
    });

    // ✅ Validate Input
    if (!projectId || !docId || !text || text.length < 50) {
      console.log('❌ Invalid Input Data');
      return new Response(JSON.stringify({ error: 'Invalid input data' }), {
        status: 400,
      });
    }

    // ✅ Convert IDs to ObjectId
    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(docId)) {
      console.log('❌ Invalid ObjectId for projectId or docId');
      return new Response(
        JSON.stringify({ error: 'Invalid project or document ID' }),
        { status: 400 }
      );
    }

    const convertedProjectId = new ObjectId(projectId);
    const convertedDocId = new ObjectId(docId);

    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // ✅ Fetch Project
    const project = await Project.findOne({
      _id: convertedProjectId,
      userId: session.user.id,
    });

    if (!project) {
      console.log('❌ Project Not Found');
      return new Response(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    // ✅ Fetch Document from Project
    const document = project.documents.find((doc) =>
      doc._id.equals(convertedDocId)
    );

    if (!document) {
      console.log('❌ Document Not Found in Project');
      return new Response(
        JSON.stringify({ error: 'Document not found in project' }),
        { status: 404 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // **Step 1: Depth Score & General Feedback**
    console.log('🔍 Sending Depth Score Analysis Request...');
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

          Return JSON like this:
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
      console.error('❌ Error Parsing Depth Score Feedback:', error);
    }

    // **Step 2: Inline Feedback (GPT-4o)**
    console.log('🔍 Sending Inline Feedback Request...');
    const inlineResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Identify words, phrases, or sentences that need improvement in these areas:
          1. Sensory Details
          2. Deep POV
          3. Emotional Resonance
          4. Conflict

          Return JSON like:
          [
            {
              "text": "Original excerpt needing improvement",
              "category": "Sensory Details",
              "suggestion": "Improve by adding more tactile sensations."
            }
          ]`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 600,
      temperature: 0.6,
    });

    // **Safely Parse Inline Feedback**
    let structuredHighlights = [];
    try {
      const rawResponse = inlineResponse.choices[0]?.message?.content || '';
      console.log('🔹 RAW INLINE RESPONSE:', rawResponse);

      const jsonMatch = rawResponse.match(/\[.*\]/s); // Extract JSON array
      if (jsonMatch) {
        structuredHighlights = JSON.parse(jsonMatch[0]);
      } else {
        console.warn(
          '⚠️ Could not extract valid JSON from response:',
          rawResponse
        );
      }
    } catch (error) {
      console.error('❌ Error Parsing Inline Feedback:', error);
    }

    // **Convert Highlights to Object**
    const highlights = {};
    structuredHighlights.forEach((item, index) => {
      highlights[`highlight_${index}`] = {
        text: item.text,
        suggestions: [{ category: item.category, advice: item.suggestion }],
      };
    });

    // **Update Document with Analysis**
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

    document.highlights = highlights;
    document.updatedAt = new Date();
    await project.save();
    console.log('✅ Analysis Data Saved!');

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
    console.error('❌ Error in Analysis Route:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

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

    const convertedProjectId = new ObjectId(projectId);
    const convertedDocId = new ObjectId(docId);

    await dbConnect();

    const project = await Project.findOne({
      _id: convertedProjectId,
      userId: session.user.id,
    });

    if (!project) {
      return new Response(
        JSON.stringify({ error: 'Project not found or unauthorized' }),
        { status: 404 }
      );
    }

    const document = project.documents.find((doc) =>
      doc._id.equals(convertedDocId)
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

    console.log('🔍 Sending Depth Analysis Request...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Provide highly specific and actionable advice on improving the following storytelling depth categories:
          1. Sensory Details
          2. Deep POV
          3. Emotional Resonance
          4. Conflict
          
          The advice should include:
          - Specific examples based on the provided text.
          - Concrete techniques or prompts the writer can use.
          - Targeted questions to deepen the scene.

          Return the response formatted as HTML, using the following structure:

          <div class="analysis-section">
            <h3 class="analysis-title">Sensory Details</h3>
            <p class="analysis-content">[Your advice here]</p>
            <ul>
              <li><strong>Example:</strong> [Provide a specific example or rewrite of a sentence]</li>
              <li><strong>Technique:</strong> [Describe a writing technique like "Show, Don't Tell"]</li>
              <li><strong>Question:</strong> [Ask a question that prompts deeper thinking]</li>
            </ul>
          </div>

          <div class="analysis-section">
            <h3 class="analysis-title">Deep POV</h3>
            <p class="analysis-content">[Your advice here]</p>
            <ul>
              <li><strong>Example:</strong> [Provide a specific example or rewrite of a sentence]</li>
              <li><strong>Technique:</strong> [Describe a writing technique like "Internal Monologue"]</li>
              <li><strong>Question:</strong> [Ask a question that prompts deeper thinking]</li>
            </ul>
          </div>

          <div class="analysis-section">
            <h3 class="analysis-title">Emotional Resonance</h3>
            <p class="analysis-content">[Your advice here]</p>
            <ul>
              <li><strong>Example:</strong> [Provide a specific example or rewrite of a sentence]</li>
              <li><strong>Technique:</strong> [Describe a writing technique like "Flashback"]</li>
              <li><strong>Question:</strong> [Ask a question that prompts deeper thinking]</li>
            </ul>
          </div>

          <div class="analysis-section">
            <h3 class="analysis-title">Conflict</h3>
            <p class="analysis-content">[Your advice here]</p>
            <ul>
              <li><strong>Example:</strong> [Provide a specific example or rewrite of a sentence]</li>
              <li><strong>Technique:</strong> [Describe a writing technique like "Add a ticking clock"]</li>
              <li><strong>Question:</strong> [Ask a question that prompts deeper thinking]</li>
            </ul>
          </div>

          Ensure the output is valid HTML with no additional markdown or code formatting.
          `,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 1000,
    });

    const analysisHtml = response.choices[0]?.message?.content?.trim() || '';

    document.analysisData = {
      analysisHtml,
    };

    document.updatedAt = new Date();
    await project.save();
    console.log('✅ Analysis Data Saved!');

    return new Response(
      JSON.stringify({
        message: 'Analysis completed successfully',
        analysisHtml,
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

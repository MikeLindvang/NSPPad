import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../../lib/dbConnect';
import AuthorStyle from '../../../../models/AuthorStyle';
import { authOptions } from '../../auth/[...nextauth]/route';
import { optionDescriptions } from '../../../../lib/authorStyleOptions';

// 📌 GET all author styles for the logged-in user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    await dbConnect();

    const authorStyles = await AuthorStyle.find({
      userId: session.user.id,
    }).lean();

    // ✅ Attach default values & ensure correct format
    const enrichedAuthorStyles = authorStyles.map((style) => ({
      ...style,
      narrativeVoice: style.narrativeVoice || 'Third-person limited',
      sentenceStructure: style.sentenceStructure || 'Balanced',
      formality: style.formality || 'Neutral',
      useOfMetaphors: style.useOfMetaphors || 'Medium',
      pacingPreference: style.pacingPreference || 'Moderate',
      dialogueStyle: style.dialogueStyle || 'Realistic',
      writingRhythm: style.writingRhythm || 'Flowing',
      wordChoice: style.wordChoice || 'Varied',
      emotionalDepth: style.emotionalDepth || 'Moderate',
      humorStyle: style.humorStyle || 'None',
      descriptiveLevel: style.descriptiveLevel ?? 5, // Ensures it's a number
      themes: Array.isArray(style.themes)
        ? style.themes
        : (style.themes || '').split(',').map((t) => t.trim()), // Always an array
    }));

    return new Response(JSON.stringify(enrichedAuthorStyles), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error fetching Author Styles:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// 📌 POST: Create a new author style
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      narrativeVoice,
      sentenceStructure,
      formality,
      useOfMetaphors,
      pacingPreference,
      dialogueStyle,
      descriptiveLevel,
      writingRhythm,
      wordChoice,
      emotionalDepth,
      humorStyle,
      defaultStyle,
    } = await req.json();

    if (
      !name ||
      !narrativeVoice ||
      !sentenceStructure ||
      !formality ||
      !useOfMetaphors ||
      !pacingPreference ||
      !dialogueStyle ||
      !descriptiveLevel ||
      !writingRhythm ||
      !wordChoice ||
      !emotionalDepth ||
      !humorStyle
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await dbConnect();

    const newAuthorStyle = await AuthorStyle.create({
      userId: session.user.id,
      name,
      narrativeVoice,
      sentenceStructure,
      formality,
      useOfMetaphors,
      pacingPreference,
      dialogueStyle,
      descriptiveLevel,
      writingRhythm,
      wordChoice,
      emotionalDepth,
      humorStyle,
      defaultStyle,
    });

    return new Response(JSON.stringify(newAuthorStyle), { status: 201 });
  } catch (error) {
    console.error('❌ Error creating Author Style:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// 📌 PUT: Update an existing author style
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const {
      _id,
      name,
      narrativeVoice,
      sentenceStructure,
      formality,
      useOfMetaphors,
      pacingPreference,
      dialogueStyle,
      descriptiveLevel,
      writingRhythm,
      wordChoice,
      emotionalDepth,
      humorStyle,
      defaultStyle = false, // Ensure it's always defined
    } = await req.json();

    if (!_id || !name || !narrativeVoice || !sentenceStructure) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const updatedAuthorStyle = await AuthorStyle.findByIdAndUpdate(
      _id, // ✅ _id is enough (no need for userId in query)
      {
        name,
        narrativeVoice,
        sentenceStructure,
        formality,
        useOfMetaphors,
        pacingPreference,
        dialogueStyle,
        descriptiveLevel: descriptiveLevel ?? 5, // ✅ Ensure it's a number
        writingRhythm,
        wordChoice,
        emotionalDepth,
        humorStyle,
        defaultStyle,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedAuthorStyle) {
      return new Response(JSON.stringify({ error: 'Author style not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(updatedAuthorStyle), { status: 200 });
  } catch (error) {
    console.error('❌ Error updating Author Style:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing Author Style ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    const deletedAuthorStyle = await AuthorStyle.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!deletedAuthorStyle) {
      return NextResponse.json(
        { error: 'Author style not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Author style deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting Author Style:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

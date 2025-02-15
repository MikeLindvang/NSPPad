import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../../lib/dbConnect';
import BookStyle from '../../../../models/BookStyle';
import { authOptions } from '../../auth/[...nextauth]/route';
import { optionDescriptions } from '../../../../lib/bookStyleOptions'; // ✅ Import the descriptions

// 📌 GET all book styles for the logged-in user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    await dbConnect();

    const bookStyles = await BookStyle.find({ userId: session.user.id }).lean();

    // ✅ Attach descriptions and ensure fields are properly set
    const enrichedBookStyles = bookStyles.map((style) => ({
      ...style,
      tone: style.tone || 'Balanced',
      worldBuildingDepth: style.worldBuildingDepth || 'Moderate',
      characterFocus: style.characterFocus || 'Balanced',
      plotComplexity: style.plotComplexity || 'Moderate Complexity',
      themes: Array.isArray(style.themes)
        ? style.themes
        : (style.themes || '').split(',').map((t) => t.trim()), // Ensure themes is always an array
    }));

    return new Response(JSON.stringify(enrichedBookStyles), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error fetching Book Styles:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// 📌 POST: Create a new book style
// 📌 POST: Create a new book style
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const {
      name,
      genre,
      themes = [],
      tone,
      pacing = 'Moderate', // ✅ Default value added
      worldBuildingDepth = 'Moderate',
      characterFocus = 'Balanced',
      plotComplexity = 'Moderate Complexity',
    } = await req.json();

    if (!name || !genre || !tone || !pacing) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const newBookStyle = await BookStyle.create({
      userId: session.user.id,
      name,
      genre,
      themes: Array.isArray(themes)
        ? themes
        : themes.split(',').map((t) => t.trim()),
      tone,
      pacing, // ✅ Ensure pacing is saved
      worldBuildingDepth,
      characterFocus,
      plotComplexity,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return new Response(JSON.stringify(newBookStyle), { status: 201 });
  } catch (error) {
    console.error('❌ Error creating Book Style:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// 📌 PUT: Update an existing book style
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
      genre,
      themes = [],
      tone,
      pacing = 'Moderate', // ✅ Ensure pacing is handled
      worldBuildingDepth,
      characterFocus,
      plotComplexity,
    } = await req.json();

    if (!_id || !name || !genre || !tone || !pacing) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    await dbConnect();

    const updatedBookStyle = await BookStyle.findOneAndUpdate(
      { _id, userId: session.user.id },
      {
        name,
        genre,
        themes: Array.isArray(themes)
          ? themes
          : themes.split(',').map((t) => t.trim()),
        tone,
        pacing, // ✅ Ensure pacing is saved
        worldBuildingDepth,
        characterFocus,
        plotComplexity,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedBookStyle) {
      return new Response(
        JSON.stringify({ error: 'Book Style not found or unauthorized' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(updatedBookStyle), { status: 200 });
  } catch (error) {
    console.error('❌ Error updating Book Style:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}

// 📌 DELETE: Remove a book style
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing Book Style ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    const deletedBookStyle = await BookStyle.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!deletedBookStyle) {
      return NextResponse.json(
        { error: 'Book Style not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Book style deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting Book Style:', error);
    return NextResponse.json(
      { error: 'Failed to delete book style' },
      { status: 500 }
    );
  }
}

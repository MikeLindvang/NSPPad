import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../../lib/dbConnect';
import AuthorStyle from '../../../../models/AuthorStyle';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const authorStyles = await AuthorStyle.find({ userId: session.user.id });
    return NextResponse.json(authorStyles, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch author styles' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const newAuthorStyle = new AuthorStyle({
      ...body,
      userId: session.user.id,
    });
    await newAuthorStyle.save();
    return NextResponse.json(newAuthorStyle, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create author style' },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (updateData.defaultStyle) {
      // Remove default from all other styles
      await AuthorStyle.updateMany(
        { userId: session.user.id },
        { $set: { defaultStyle: false } }
      );
    }

    // Update selected style
    const updatedStyle = await AuthorStyle.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json(updatedStyle, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update author style' },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    await AuthorStyle.findOneAndDelete({ _id: id, userId: session.user.id });

    return NextResponse.json(
      { message: 'Author style deleted' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete author style' },
      { status: 500 }
    );
  }
}

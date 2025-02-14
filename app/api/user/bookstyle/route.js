import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '../../../../lib/dbConnect';
import BookStyle from '../../../../models/BookStyle';
import { authOptions } from '../../auth/[...nextauth]/route'; // Adjust based on your auth setup

// 📌 GET all book styles for the logged-in user
export async function GET(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const bookStyles = await BookStyle.find({ userId: session.user.id });
    return NextResponse.json(bookStyles, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch book styles' },
      { status: 500 }
    );
  }
}

// 📌 POST: Create a new book style
export async function POST(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const newBookStyle = new BookStyle({ ...body, userId: session.user.id });
    await newBookStyle.save();
    return NextResponse.json(newBookStyle, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create book style' },
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
      // Remove default from all other book styles
      await BookStyle.updateMany(
        { userId: session.user.id },
        { $set: { defaultStyle: false } }
      );
    }

    // Update selected book style
    const updatedStyle = await BookStyle.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json(updatedStyle, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update book style' },
      { status: 500 }
    );
  }
}

// 📌 DELETE: Remove a book style
export async function DELETE(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    await BookStyle.findOneAndDelete({ _id: id, userId: session.user.id });

    return NextResponse.json(
      { message: 'Book style deleted' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete book style' },
      { status: 500 }
    );
  }
}

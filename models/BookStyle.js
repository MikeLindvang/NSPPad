import mongoose from 'mongoose';

const BookStyleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  genre: { type: String, required: true },
  themes: { type: [String], required: true },
  tone: { type: String, required: true },
  pacing: { type: String, required: true },
  worldBuildingDepth: { type: String, required: true },
  characterFocus: { type: String, required: true },
  plotComplexity: { type: String, required: true },
  defaultStyle: { type: Boolean, default: false }, // New field for default
});

export default mongoose.models.BookStyle ||
  mongoose.model('BookStyle', BookStyleSchema);

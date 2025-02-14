import mongoose from 'mongoose';

const AuthorStyleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  narrativeVoice: { type: String, required: true },
  sentenceStructure: { type: String, required: true },
  formality: { type: String, required: true },
  useOfMetaphors: { type: String, required: true },
  pacingPreference: { type: String, required: true },
  dialogueStyle: { type: String, required: true },
  descriptiveLevel: { type: Number, required: true },
  writingRhythm: { type: String, required: true },
  wordChoice: { type: String, required: true },
  emotionalDepth: { type: String, required: true },
  humorStyle: { type: String, required: true },
  defaultStyle: { type: Boolean, default: false }, // New field for default
});

export default mongoose.models.AuthorStyle ||
  mongoose.model('AuthorStyle', AuthorStyleSchema);

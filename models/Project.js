import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Ensure MongoDB handles IDs
  title: { type: String, required: true },
  content: { type: String, required: true },
  analysisData: {
    sensoryDetails: { type: String, default: '' },
    povDepth: { type: String, default: '' },
    emotionalResonance: { type: String, default: '' },
    conflict: { type: String, default: '' }, // ✅ Now just "conflict"
  },
  analysisScore: {
    depthScores: {
      sensory: { type: Number, default: 0 },
      pov: { type: Number, default: 0 },
      emotional: { type: Number, default: 0 },
      conflict: { type: Number, default: 0 },
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  userId: { type: String, required: true }, // User's ID (from auth)
  documents: [DocumentSchema], // Array of document subdocuments
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Project ||
  mongoose.model('Project', ProjectSchema);

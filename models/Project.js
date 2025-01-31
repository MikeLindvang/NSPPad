import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  analysisData: {
    sensoryDetails: { type: String, default: '' },
    povDepth: { type: String, default: '' },
    emotionalResonance: { type: String, default: '' },
    conflictAndTension: { type: String, default: '' },
  },
  analysisScore: {
    type: Number,
    default: 0,
    depthScores: {
      sensory: { type: Number, default: 0 },
      pov: { type: Number, default: 0 },
      emotional: { type: Number, default: 0 },
      conflict: { type: Number, default: 0 },
    },
  }, // Placeholder for score
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

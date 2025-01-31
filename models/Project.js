import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Ensure MongoDB handles IDs
  title: { type: String, required: true },
  content: { type: String, required: true },

  // Sidebar Analysis Data
  analysisData: {
    sensoryDetails: { type: String, default: '' },
    povDepth: { type: String, default: '' },
    emotionalResonance: { type: String, default: '' },
    conflict: { type: String, default: '' }, // ✅ Now just "conflict"
  },

  // Depth Scores
  analysisScore: {
    depthScores: {
      sensory: { type: Number, default: 0 },
      pov: { type: Number, default: 0 },
      emotional: { type: Number, default: 0 },
      conflict: { type: Number, default: 0 },
    },
  },

  // 🔹 **New Field: Inline Feedback Highlights**
  highlights: {
    type: Map,
    of: new mongoose.Schema({
      text: { type: String, required: true }, // The highlighted text
      suggestions: [
        {
          category: { type: String, required: true }, // Sensory, POV, etc.
          advice: { type: String, required: true }, // Suggested improvement
        },
      ],
    }),
    default: {},
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

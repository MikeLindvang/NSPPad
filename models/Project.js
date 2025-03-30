import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  title: { type: String, required: true },
  content: { type: String, required: true },

  // 🔹 NEW: Outline guidance for nonfiction
  outlineNotes: { type: String, default: '' },

  analysisData: {
    sensoryDetails: { type: String, default: '' },
    povDepth: { type: String, default: '' },
    emotionalResonance: { type: String, default: '' },
    conflict: { type: String, default: '' },
  },

  analysisScore: {
    depthScores: {
      sensory: { type: Number, default: 0 },
      pov: { type: Number, default: 0 },
      emotional: { type: Number, default: 0 },
      conflict: { type: Number, default: 0 },
    },
  },

  highlights: {
    type: Map,
    of: new mongoose.Schema({
      text: { type: String, required: true },
      suggestions: [
        {
          category: { type: String, required: true },
          advice: { type: String, required: true },
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
  userId: { type: String, required: true },
  documents: [DocumentSchema],

  projectType: {
    type: String,
    enum: ['fiction', 'nonfiction'],
    default: 'fiction',
  },

  metadata: {
    bookSetup: {
      length: {
        type: String,
        enum: ['short', 'standard', 'advanced'],
        default: 'standard',
      },
      template: {
        type: String,
        enum: [
          'problem-buster',
          'how-to',
          'checklist',
          'case-study',
          'listicle',
        ],
        default: 'problem-buster',
      },
      tone: {
        type: String,
        enum: ['friendly', 'professional', 'motivational', 'calm'],
        default: 'friendly',
      },
      audience: {
        type: String,
        default: '',
      },
    },

    // ✅ NEW: Outline field to store topic + sections
    outline: {
      topic: { type: String, default: '' },
      sections: [
        {
          title: { type: String, required: true },
          notes: { type: String, default: '' },
        },
      ],
    },
  },

  bookStyleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookStyle',
    default: null,
  },
  authorStyleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuthorStyle',
    default: null,
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Project ||
  mongoose.model('Project', ProjectSchema);

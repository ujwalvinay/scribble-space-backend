import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled Document",
    },

    // ✅ What everyone sees
    publishedContent: {
      type: Object,
      default: {
        type: "doc",
        content: [],
      },
    },

    // ✅ Private edits (per user)
    drafts: [
      {
        userId: {
          type: String,
          required: true,
        },
        content: {
          type: Object,
          default: {
            type: "doc",
            content: [],
          },
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    projectId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
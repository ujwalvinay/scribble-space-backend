import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled Document",
    },
    content: {
      type: Object, // ✅ store TipTap JSON
      default: {
        type: "doc",
        content: [],
      },
    },
    projectId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
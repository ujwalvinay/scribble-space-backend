import Document from "../models/Document.js";
import { pool } from "../config/postgres.js";

// Create document
export const createDocument = async (req, res) => {
  try {
    const { title, content, projectId } = req.body;

    // ✅ 1. Validate projectId exists
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    const projectCheck = await pool.query(
      "SELECT * FROM projects WHERE id = $1",
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    // ✅ 2. Create document
    const doc = await Document.create({
      title,
      content,
      projectId,
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get document
export const getDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update document
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Document.findById(id);

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // ✅ Check user role in project
    const roleCheck = await pool.query(
      `SELECT role FROM project_members 
       WHERE project_id = $1 AND user_id = $2`,
      [doc.projectId, req.user.userId]
    );

    if (roleCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    const role = roleCheck.rows[0].role;

    // 🔴 BLOCK viewers
    if (role === "viewer") {
      return res.status(403).json({ error: "Viewers cannot edit documents" });
    }

    // ✅ Allow editor + owner
    const updated = await Document.findByIdAndUpdate(
      id,
      {
        content: req.body.content,
        title: req.body.title,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Get document via projecID
export const getDocumentsByProject = async (req, res) => {
  try {
    const docs = await Document.find({
      projectId: req.params.projectId,
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
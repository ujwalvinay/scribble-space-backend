import { pool } from "../config/postgres.js";
import Document from "../models/Document.js";


// Create project
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    // 1. Create project
    const projectResult = await pool.query(
      "INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );

    const project = projectResult.rows[0];

    // 2. Add creator as owner
    await pool.query(
      "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)",
      [project.id, req.user.userId, "owner"]
    );

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all projects
export const getProjects = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT p.*
      FROM projects p
      JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $1`,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProjectWithDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ Check if user is part of project
    const accessCheck = await pool.query(
      `SELECT * FROM project_members 
      WHERE project_id = $1 AND user_id = $2`,
      [id, req.user.userId]
    );

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // ✅ Fetch project
    const projectResult = await pool.query(
      "SELECT * FROM projects WHERE id = $1",
      [id]
    );
    // ✅ Fetch members
    const membersResult = await pool.query(
      `SELECT u.email, pm.role
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $1`,
      [id]
    );

    const members = membersResult.rows;

    const project = projectResult.rows[0];

    // ✅ Fetch documents
    const documents = await Document.find({ projectId: id });

    res.json({ project, documents, members });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add project member
export const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;

    // find user
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // add member
    await pool.query(
      "INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)",
      [projectId, userId, role]
    );

    res.json({ message: "User added to project" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit project members.
export const updateProjectMemberRole = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;

    // find user
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // update role
    const result = await pool.query(
      `UPDATE project_members 
       SET role = $1 
       WHERE project_id = $2 AND user_id = $3 
       RETURNING *`,
      [role, projectId, userId]
    );

    res.json({ message: "Role updated", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


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
    const result = await pool.query("SELECT * FROM projects");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProjectWithDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ 1. Get project from Postgres
    const projectResult = await pool.query(
      "SELECT * FROM projects WHERE id = $1",
      [id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }

    const project = projectResult.rows[0];

    // ✅ 2. Get documents from Mongo
    const documents = await Document.find({ projectId: id });

    // ✅ 3. Combine response
    res.json({
      project,
      documents,
    });
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
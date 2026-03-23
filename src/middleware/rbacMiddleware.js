import { pool } from "../config/postgres.js";

export const checkProjectRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.projectId;

      const result = await pool.query(
        "SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2",
        [projectId, req.user.userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({ error: "Access denied" });
      }

      const userRole = result.rows[0].role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};
import express from "express";
import {
  createProject,
  getProjects,
  getProjectWithDocuments,
  addProjectMember,
  updateProjectMemberRole
} from "../controllers/projectController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { checkProjectRole } from "../middleware/rbacMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createProject);
router.get("/", verifyToken, getProjects);
router.get("/:id/details", verifyToken, getProjectWithDocuments);
router.post(
  "/:projectId/members",
  verifyToken,
  checkProjectRole(["owner"]),
  addProjectMember
);
router.patch(
  "/:projectId/members",
  verifyToken,
  checkProjectRole(["owner"]),
  updateProjectMemberRole
);
export default router;
import express from "express";
import {
  createDocument,
  getDocument,
  updateDocument,
  getDocumentsByProject,
} from "../controllers/documentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { checkProjectRole } from "../middleware/rbacMiddleware.js";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  checkProjectRole(["owner", "editor"]),
  createDocument
);
router.get("/:id", verifyToken, getDocument);
router.patch("/:id", verifyToken, updateDocument);
router.get(
  "/project/:projectId",
  verifyToken,
  checkProjectRole(["owner", "editor", "viewer"]),
  getDocumentsByProject
);

export default router;
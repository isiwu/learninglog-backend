import express from "express";
import * as userControllers from "../controllers/usersController";
import { validateUser } from "../validators";

const router = express.Router();

router.get("/", userControllers.index, userControllers.respondJSON);
router.post("/new", validateUser, userControllers.create, userControllers.respondJSON);
router.post("/verify/email", userControllers.activate, userControllers.respondJSON);


export default router;
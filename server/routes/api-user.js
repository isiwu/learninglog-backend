import express from "express";
import * as userControllers from "../controllers/usersController";

const router = express.Router();

router.get("/", userControllers.index, userControllers.respondJSON);


export default router;
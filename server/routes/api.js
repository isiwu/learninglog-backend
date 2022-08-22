import express from "express";
import apiUserRouter from "./api-user";
import apiTopicRouter from "./api-topic";

const router = express.Router();

router.use("/users", apiUserRouter);
router.use("/topics", apiTopicRouter);

export default router;
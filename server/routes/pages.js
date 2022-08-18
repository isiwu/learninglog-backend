import express from 'express';
import * as pagesController from '../controllers/pagesController';

const router = express.Router();

/* GET home page. */
router.get('/', pagesController.home);
router.get('/:author/topics', pagesController.publicTopics, pagesController.publicTopicsView);
router.get('/:author/topics/:id', pagesController.showPublicTopic, pagesController.showPublicTopicView);

export default router;
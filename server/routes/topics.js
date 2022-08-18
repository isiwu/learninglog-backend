import express from 'express';
import * as topicsController from '../controllers/topicsController';
import * as entriesController from '../controllers/entriesController';
import { validateEntry, validateTopic } from '../validators';

const router = express.Router();


//router.get('/', topicsController.index, topicsController.indexView);
router.route('/new')
  .get(topicsController.newTopic)
  .post(validateTopic, topicsController.validateTopicInput,
    topicsController.create, topicsController.redirectView);
router.get('/:id', topicsController.show, topicsController.showView);
router.route('/:id/entries/new')
  .get(entriesController.newEntry)
  .post(validateEntry, entriesController.validateEntryInput, entriesController.create);
router.route('/:topicId/entries/:entryId/edit')
  .get(entriesController.edit)
  .put(validateEntry, entriesController.validateEntryInput, entriesController.update);
router.delete('/:topicId/entries/:entryId/delete', entriesController.deleteEntry);
router.delete('/:id/delete', topicsController.deleteTopic);

export default router;
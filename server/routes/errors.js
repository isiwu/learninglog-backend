import express from 'express';
import * as errorsController from '../controllers/errorController';

const router = express.Router();

router.use(errorsController.pageNotFoundError);
router.use(errorsController.serverError);

export default router;
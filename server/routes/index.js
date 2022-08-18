import express from 'express';
import homeRouter from './pages';
import usersRouter from './users';
import topicsRouter from './topics';
//import entriesRouter from './entries';
import errorsRouter from './errors';

const router = express.Router();

/* GET home page. */
router.use('/', homeRouter);
router.use('/users', usersRouter);
router.use('/topics', topicsRouter);
//router.use('/entries', entriesRouter);
router.use(errorsRouter);

export default router;

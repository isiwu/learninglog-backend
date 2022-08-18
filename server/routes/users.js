import express from 'express';
import multer from 'multer';
import path from 'path';
import {index as topicIndex} from '../controllers/topicsController';
import * as usersController from '../controllers/usersController';
import { validateUser } from '../validators';

const router = express.Router(),
storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); 
  }
}),
upload = multer({storage});

/* GET users listing. */
router.get('/', usersController.index, usersController.indexView);
router.get('/register', usersController.newUser);
router.post('/create', validateUser, usersController.validateUserInput, 
  usersController.create, usersController.redirectView);
router.get('/activate/:token', usersController.activate, 
  usersController.redirectView);
router.route('/login')
  .get(usersController.login)
  .post(usersController.authenticate);
router.get('/logout', usersController.logout);

//router.get('/resend-link', usersController.resendLinkForm);
router.route('/resend-link')
  .get(usersController.resendLinkForm)
  .post(usersController.resendLink, usersController.redirectView);
router.route('/forget-password')
  .get(usersController.forgetPasswordForm)
  .post(usersController.forgetPasswordToken, usersController.redirectView);
router.get('/forget-password/:token', usersController.forgetPassword, 
  usersController.redirectView);
router.route('/reset-password')
  .get(usersController.resetPasswordForm)
  .post(usersController.resetPassword, usersController.redirectView);
router.route('/change-password')
  .get(usersController.changePasswordForm)
  .post(usersController.changePassword);
router.get('/:id', usersController.show, usersController.showView);
router.get('/:id/topics-account', topicIndex('public'), usersController.account);
router.route('/:id/profile-edit')
  .get(usersController.profileEdit)
  .post(upload.single('image'), usersController.uploadImage);
router.get('/:id/show-image', usersController.showImage);
router.get('/:id/edit', usersController.edit);
router.put('/:id/update', usersController.update, 
  usersController.redirectView);
router.delete('/:id/delete', usersController.deleteUser);

export default router;

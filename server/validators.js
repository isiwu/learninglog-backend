import {body} from 'express-validator';

const validateUser = [
  body('email')
    .normalizeEmail()
    .exists({checkFalsy: true}).withMessage('Email field should not be empty.').bail()
    .isEmail().withMessage('Invalid email.'),  
  body('username')
    .exists({checkFalsy: true}).withMessage('Username field is empty')
    .trim()
    .escape()
],
validateTopic = body('title')
  .exists({checkFalsy: true}).withMessage('Topic can not be empty!').bail()
  .trim()
  .escape()
  .isString()
,
validateEntry = body('body')
  .escape()
  .trim()
  .exists({checkFalsy: true}).withMessage('Entry must not be empty!');

export {validateUser, validateTopic, validateEntry};
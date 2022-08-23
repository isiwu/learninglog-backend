import passport from "passport";
import crypto from "crypto";
import fs from 'fs';
import {validationResult} from 'express-validator';
import { getData, sendMail } from "../helpers";
import User from "../models/user";
import VerifyToken from "../models/verify-token";
import ForgetPasswordToken from "../models/forget-password";
import Topic from "../models/topic";

const index = (req, res, next) => {
  // const user = req.user;
  // if (!user) {
  //   return next(new Error('Sorry, web page not available.'));
  // }

  // if (user && user.username !== process.env.ADMIN) {
  //   return next(new Error('Sorry, web page not available'));
  // }

  User.find({}).populate('topics').exec()
  .then(users => {
    res.locals.users = users;
    next();
  })
  .catch(error => {
    console.log(`Error fetching users from database: ${error.message}`);
    next(error);
  });
},
indexView = (req, res) => {
  res.render('users/index', {layout: 'custom-layout'});
},
newUser = (req, res) => {
  res.render('users/new');
},
create = (req, res, next) => {
  if (req.hasErrors) return next();

  let newUser,
  userData = getData(req.body);

  new Promise((resolve, reject) => {
    //Does username exist
    User.findOne(userData).exec()
    .then(user => {
      if (user) return reject('username not available');

      //user public topics url
      userData.pubTopicURL = `${req.protocol}://${req.headers.host}/${userData.username}/topics`;

      //Then register the user
      User.register(userData, req.body.password, (error, user) => {
        if (error) {
          return reject();
        }
  
        newUser = user;
        resolve(newUser);
      });
    });
  })
  .then(user => {
    return VerifyToken.create({_id: user._id, token: crypto.randomBytes(16).toString('hex')});
  })
  .then(token => {
    //Sendmail parameters
    const subject = 'Track Your Topic.',
    button = `<a href='${req.protocol}://${req.headers.host}/users/activate/${token.token}' 
    style='background-color: #008CBA;color: white;padding: 15px;text-decoration: none;
    text-align: center;cursor: pointer;font-size: 18px;border: none;
    border-radius: 4px;'>Confirm</a>`,
    firstP = 'To complete your registration, we need to confirm your email address!',
    secondP = 'Click the following button to confirm!';

    //Send confirmation mail here
    return sendMail(req, subject, button, firstP, secondP);
  })
  .then(mailSent => {
    if (!mailSent) { //Return Promise that reject
      return new Promise((resolve, reject) => {
        User.deleteOne({_id: newUser._id}).exec()
        .then(() => {
          reject('user deleted');
        });
      });
    }

    req.flash('success', 'Successful. Check your mail box to confirm your email!');
    res.locals.redirect = '/';
    next();
  })
  .catch((error) => {
    if (error === 'username exists') req.flash('username', `${req.body.username} not available`);
    else req.flash('error', 'Request not successful. Try again later!');
    res.locals.redirect = '/users/register';
    next();
  });
},
redirectView = (req, res, next) => {
  const redirectPath = res.locals.redirect;

  if (redirectPath) {
    return res.redirect(redirectPath);
  }
  next();
},
account = (req, res) => {
  res.render('users/account', {layout: 'custom-layout'});
},
show = (req, res, next) => {
  const userId = req.params.id,
  currUser = req.user;

  if (!currUser) {
    req.flash('error', 'Please login to complete your action');
    return res.redirect('/users/login');
  }

  User.findById(userId).exec()
  .then(user => {
    if (user.email !== currUser.email) {
      req.flash('error', 'Server busy, try again.');
      req.logout();
      return res.redirect('/');
    }
    res.locals.user = user;
    return Topic.find({author: user._id}).exec();
  })
  .then(topics => {
    if (!topics) {
      req.flash('error', 'Server busy, try again.');
      return res.redirect('/');
    }
    res.locals.topics = topics;
    next();
  })
  .catch(error => {
    console.log(`Error fetching user data from database: ${error.message}`);
    next(error);
  });
},
showView = (req, res) => {
  res.render('users/show', {layout: 'custom-layout'});
},
profileEdit = (req, res) => {
  res.render('users/profile');
},
uploadImage = (req, res) => {
  const user = req.user,
  file = req.file;

  User.findByIdAndUpdate(user, {$set: {'image.data': fs.readFileSync(file.path), 'image.contentType': file.mimetype}}).exec()
  .then(() => {
    fs.rmSync(file.path);
    res.redirect(`/users/${user._id}`);
  })
  .catch(() => {
    req.flash('error', 'Upload unsuccessfull. Please try again');
    res.redirect(`/users/${user._id}/profile-edit`);
  });
},
showImage = (req, res) => {
  const id = req.params.id;

  User.findById(id).exec()
  .then(user => {
    if (user.image.contentType) {
      res.type(user.image.contentType);
      res.send(user.image.data);
    }

  });
},
edit = (req, res, next) => {
  const userId = req.params.id;

  User.findById(userId).exec()
  .then(() => {
    res.render('users/edit');
  })
  .catch(error => {
    console.log(`Error fetching user from database by ID: ${error.message}`);
    next(error);
  });
},
update = (req, res, next) => {
  const userId = req.params.id,
  userData = getData(req.body);

  User.findByIdAndUpdate(userId, userData).exec()
  .then(user => {
    res.locals.redirect = `/users/${user._id}`;
    next();
  })
  .catch(error => {
    console.log(`Error updating user data by ID: ${error.message}`);
    res.locals.redirect = `/users/${userId}/edit`;
    next();
  });
},
activate = (req, res, next) => {
  //const token = req.params.token;

  VerifyToken.findOne({token: req.params.token}).exec()
  .then(token => {
    if (!token) {
      req.flash('error', 'invalid or expired link');
      res.locals.redirect = '/users/resend-link';
      next();
      return Promise.reject();
    }

    return User.findById(token).exec();
  })
  .then(user => {
    if (!user) {
      req.flash('error', 'user does not exist! please sign up.');
      res.locals.redirect = '/users/register';
      return next();
    }

    if (user.isVerified) {
      req.flash('success', 'account already verified');
      res.locals.redirect = '/users/login';
      return next();
    }

    //Verify user 
    user.isVerified = true;
    return user.save();
  })
  .then((user) => {
    
    req.login(user, (error) => {
      if (error) {
        req.flash('success', 'Email confirmed. Please login');
        res.locals.redirect = '/users/login';
        return next();
      }

      req.flash('success', 'Email confirmed.');
      res.locals.redirect = `/users/${user._id}`;
      next();
    });
  })
  .catch(error => {
    if (!error) {
      console.log('Promise rejection without reason');
      return;
    }

    console.log(`Error due to: ${error.message}`);
    req.flash('error', 'server busy. try again.');
    next(error);
  });
},
resendLinkForm = (req, res) => {
  res.render('users/resendlink');
},
resendLink = (req, res, next) => {
  let currUser;

  User.findOne({email: req.body.email}).exec()
  .then(user => {
    if (!user) {
      return Promise.reject('no user');
    }

    currUser = user;
    return VerifyToken.create({_id: currUser._id, token: crypto.randomBytes(16).toString('hex')});
  })
  .then(token => {
    //Sendmail parameters
    const subject = 'Track Your Topic.',
    button = `<a href='${req.protocol}://${req.headers.host}/users/activate/${token.token}' 
    style='background-color: #008CBA;color: white;padding: 15px;text-decoration: none;
    text-align: center;cursor: pointer;font-size: 18px;border: none;
    border-radius: 4px;'>Confirm</a>`,
    firstP = 'To complete your registration, we need to confirm your email address.',
    secondP = 'Click the following button to confirm!';

    return sendMail(req, subject, button, firstP, secondP);
  })
  .then(mailSent => {
    if (!mailSent) {
      return new Promise((resolve, reject) => {
        VerifyToken.findByIdAndDelete(currUser).exec()
        .then(() => {
          reject('mail not sent');
        });
      });
    }

    req.flash('success', 'Check mail box to confirm account.');
    res.locals.redirect = '/';
    next();
  })
  .catch((error) => {
    if (error === 'no user') {
      req.flash('error', 'user does not exist! please register for an account.');
      res.locals.redirect = '/users/register';
      return next();
    } else if (error === 'mail not sent') {
      req.flash('error', 'server busy! try again.');
      res.locals.redirect = '/users/resend-link';
      return next();
    }

    console.log(`Error due to: ${error.message}`);
    next(error);
  });
},
login = (req, res) => {
  res.render('users/login');
},
authenticate = (req, res, next) => {
  passport.authenticate('local', (error, user) => {
    if (error) {
      res.flash('error', 'Login failed! Try again.');
      res.redirect('/users/login');
    }

    if (!user) {
      new Promise((resolve) => {
        User.findOne({email: req.body.email}).exec()
        .then(currUser => {
          if (!currUser) {
            return resolve('/users/register');
          }

          currUser.authenticate(req.body.password)
          .then(model => {
            if (!model.user) {
              res.locals.error = model.error;
              return resolve('/users/login');
            }
          })
          .catch(error => {
            req.flash('error', error.message);
            return resolve('/users/login');
          });
        })
        .catch(error => {
          console.log(`Error finding user by email due to: ${error.message}`);
          return next(error);
        });
      })
      .then((redirectPath) => {
        if (res.locals.error) {
          req.flash('error', res.locals.error.message);
          return res.redirect(redirectPath);
        }

        req.flash('error', 'Username does not exist. Please register to login.');
        return res.redirect(redirectPath);
      });
    } else if (user) {
      //Is user account verified
      if (!user.isVerified) {
        req.logout();
        req.flash('error', 'please confirm your email address to login correctly!');
        return res.redirect('/');
      }

      req.login(user, (error) => {
        if (error) {
          console.log(`user unable to login: ${error.message}`);
          req.flash('error', 'Login failed. Try again later!');
          return res.redirect('/users/login');
        }

        req.flash('success', `Welcome ${user.email}`);
        console.log(user._id, user.username, user.email);
        req.flash('user', user);
        res.redirect(`/users/${user._id}`);
      });
    }
  })(req, res, next);
},
logout = (req, res) => {
  req.logout();
  req.flash('success', 'Your are logged out!');
  res.redirect('/users/login');
},
forgetPasswordForm = (req, res) => {
  res.render('users/forget-password');
},
forgetPasswordToken = (req, res, next) => {
  let currUser;

  User.findOne({email: req.body.email}).exec()
  .then(user => {
    if (!user) {
      return Promise.reject('no user');
    }

    currUser = user;
    return ForgetPasswordToken.create({_id: currUser._id, token: crypto.randomBytes(16).toString('hex')});
  })
  .then(token => {
    //Sendmail parameters
    const subject = 'Track Your Topic.',
    button = `<a href='${req.protocol}://${req.headers.host}/users/forget-password/${token.token}' 
    style='background-color: #008CBA;color: white;padding: 15px;text-decoration: none;
    text-align: center;cursor: pointer;font-size: 18px;border: none;
    border-radius: 4px;'>Reset Password</a>`,
    firstP = `Your recieve this mail because you or someone request to reset your password. 
    If you didn't initiate this process yourself, 
    kindly ignore and your account password will be intack.`,
    secondP = 'To reset your password, click the button below!';

    return sendMail(req, subject, button, firstP, secondP);
  })
  .then(mailSent => {
    if (!mailSent) {
      return new Promise((resolve, reject) => {
        ForgetPasswordToken.findByIdAndUpdate(currUser).exec()
        .then(() => {
          reject('mail not sent');
        });
      });
    }

    req.flash('success', 'Link to reset your password has been sent to your mail box.');
    res.locals.redirect = '/';
    next();
  })
  .catch(error => {
    if (error === 'no user') {
      req.flash('error', 'user does not exist. please register for an account.');
      res.locals.redirect = '/users/register';
      return next();
    } else if (error === 'mail not sent') {
      req.flash('error', 'server busy. try again later!');
      req.flash('user', currUser);
      res.locals.redirect = '/users/forget-password';
      return next();
    }

    console.log(`Error due to: ${error.message}`);
    next(error);
  });
},
forgetPassword = (req, res, next) => {
  let currUser;

  ForgetPasswordToken.findOne({token: req.params.token}).exec()
  .then(token => {
    if (!token) {
      return Promise.reject('no token');
    }

    return User.findById(token).exec();
  })
  .then(user => {
    if (!user) {
      return Promise.reject('no user');
    }

    currUser = user;
    req.flash('success', 'please enter new password to reset your account password');
    req.session.currUser = currUser;
    res.locals.redirect = '/users/reset-password';
    next();
  })
  .catch(error => {
    if (error === 'no token') {
      req.flash('error', 'invalid or expired link. please enter your email to send you new link.');
      req.flash('user', currUser);
      res.locals.redirect = '/users/forget-password';
      return next();
    } else if (error === 'no user') {
      req.flash('error', 'user does not exist. please register to login correctly.');
      res.locals.redirect = '/users/register';
      return next();
    }

    console.log(`Error due to: ${error.message}`);
    next(error);
  });
},
resetPasswordForm = (req, res) => {
  res.render('users/reset-password', {currUser: req.session.currUser});
},
resetPassword = (req, res, next) => {
  const {newPassword, confirmPassword, email} = req.body;

  if (newPassword !== confirmPassword) {
    req.flash('error', 'sorry, password did not match');
    req.flash('confirm', 'password did not match!');
    res.locals.redirect = '/users/reset-password';
    return next();
  }

  let currUser;
  User.findOne({email}).exec()
  .then(user => {
    currUser = user;

    return new Promise((resolve, reject) => {
      user.setPassword(newPassword)
      .then(() => {
        return user.save();
      })
      .then(() => {
        resolve(user);
      })
      .catch(() => {
        reject('not resetted');
      });
    });
  })
  .then(user => {
    req.login(user, (error) => {
      if (error) {
        req.flash('error', 'server busy. try again later!');
        req.flash('user', user);
        res.locals.redirect = '/users/reset-password';
        return next();
        //return Promise.reject('not login');
      }

      req.flash('success', 'password reset successfully!');
      res.locals.redirect = `/users/${user._id}`;
      next();
    });
  })
  .catch(error => {
    if (error === 'not resetted') {
      req.flash('error', 'server busy. try again later!');
      req.flash('user', currUser);
      res.locals.redirect = '/users/reset-password';
      return next();
    }

    console.log(`Error due to: ${error.message}`);
    next(error);
  });
},
changePasswordForm = (req, res) => {
  res.render('users/change-password');
},
changePassword = (req, res) => {
  const user = req.user;

  if (!user) {
    req.flash('error', 'please login to change your password');
    return res.redirect('/users/login');
  }

  user.changePassword(req.body.oldPassword, req.body.newPassword)
  .then(() => {
    req.flash('success', 'password change successfull');
    res.redirect(`/users/${user._id}`);
  })
  .catch(() => {
    req.flash('error', 'Server busy, try again');
    res.redirect('/users/change-password');
  });
},
deleteUser = (req, res) => {
  const id = req.params.id,
  user = req.user;

  if (!user) {
    req.flash('error', 'Please login to complete this operation');
    return res.redirect('/users/login');
  }

  if (user && user.username !== process.env.ADMIN) {
    req.flash('error', 'Server busy, try again');
    return res.redirect('/');
  } 

  User.deleteOne({_id: id}).exec()
  .then(() => {
    req.flash('success', 'A user deleted');
    res.redirect('/users');
  })
  .catch(error => {
    console.log(`Error deleting a user due to: ${error.message}`);
    req.flash('error', 'Unable to delete user, try again.');
    res.redirect('/users');
  });
},
validateUserInput = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    let messages = errors.array().map(err => err.msg);
    req.flash('error', messages.join(' and '));
    req.flash('userInput', {email: req.body.email, username: req.body.username});
    req.hasErrors = true;
    res.locals.redirect = '/users/register';
    return next();
  }

  next();
},
respondJSON = (req, res) => {
  console.log("!!");
  res.status(200).json({
    success: true,
    data: res.locals
  });
};

export {index, indexView, newUser, create, redirectView, account, show, 
  showView, profileEdit, uploadImage, showImage, edit, update, activate, 
  resendLinkForm, resendLink, login, logout, authenticate, forgetPasswordForm, 
  forgetPasswordToken, forgetPassword, resetPasswordForm, resetPassword, 
  changePasswordForm, changePassword, deleteUser, validateUserInput, respondJSON};
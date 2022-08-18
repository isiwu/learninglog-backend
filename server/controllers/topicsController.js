import {validationResult} from 'express-validator';
import { getData } from "../helpers";
import Topic from "../models/topic";

const index = (topicFilter='all') => (req, res, next) => {
  if (topicFilter === 'all') {
    Topic.find({}).exec()
    .then(topics => {
      res.locals.topics = topics;
      next();
    })
    .catch(error => {
      console.log(`Error fetching topics fro Db: ${error.message}`);
      next(error);
    });
  } else {
    //Query for topics-account
    Topic.find({}).exec()
    .then(topics => {
      res.locals.topics = topics;
      res.locals.pubTopics = topics.filter((topic => {
        return topic.public === true;
      }));
      res.locals.privTopics = topics.filter((topic => {
        return topic.public === false;
      }));

      next();
    })
    .catch(error => {
      console.log(`Error fetching ${topicFilter} topics due to: ${error.message}`);
      next(error);
    });
  }
},
indexView = (req, res) => {
  res.render('topics/index');
},
newTopic = (req, res) => {
  res.render('topics/new');
},
create = (req, res, next) => {
  if (req.hasErrors) return next();

  const data = getData(req.body),
  user = req.user,
  topicData = {...data, author: user._id};

  new Promise((resolve, reject) => {
    if (!user) {
      return reject('not logged in');
    }

    //Does topic exist under the current user 
    Topic.findOne(topicData).exec()
    .then(topic => {
      if (topic) {
        return reject('topic exist');
      }

      //Then create the topic for the current user
      return Topic.create(topicData);
    })
    .then(topic => {
      return resolve(topic);
    })
    .catch(error => {
      console.log(`Error creating new topic: ${error.message}`);
      reject(error);
    });
  })
  .then(topic => {
    req.flash('success', 'new topic added');
    res.locals.topic = topic;
    res.locals.redirect = `/users/${user._id}`;
    next();
  })
  .catch(error => {
    if (error === 'not logged in') {
      req.flash('error', 'please login to complete this action');
      res.locals.redirect = '/users/login';
      return next();
    }

    if (error === 'topic exist') {
      req.flash('error', `${data.title} already exist under your account!`);
      res.locals.redirect = `/users/${user._id}`;
      return next();
    }

    next(error);
  });
},
redirectView = (req, res, next) => {
  let redirectPath = res.locals.redirect;

  if (redirectPath) return res.redirect(redirectPath);
  next();
},
show = (req, res, next) => {
  const topicId = req.params.id,
  user = req.user;

  if (!user) {
    req.flash('error', 'Please login to complete this operation.');
    return res.redirect('/users/login');
  }

  Topic.findOne({_id: topicId, author: user._id}).populate({path: 'entries', options: {sort: {createdAt: -1}}}).exec()
  .then(topic => {
    if (!topic) return res.redirect(`/users/${user._id}`);
    
    res.locals.topic = topic;
    next();
  })
  .catch(error => {
    console.log(`Error fetching topic by ID: ${error.message}`);
    next(error);
  });
},
showView = (req, res) => {
  res.render('topics/show');
},
deleteTopic = (req, res, next) => {
  const topicId = req.params.id,
  user = req.user;

  if (!user) {
    req.flash('error', 'Please login to complete this action.');
    return res.redirect('/users/login');
  }

  Topic.deleteOne({_id: topicId, author: user._id}).exec()
  .then(() => {
    req.flash('success', 'Topic deleted');
    res.redirect(`/users/${user._id}`);
  })
  .catch(error => {
    console.log(`Error deleting topic by ID: ${error.message}`);
    next(error);
  });
},
validateTopicInput = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map(err => err.msg);

    req.flash('error', messages.join(' and '));
    req.flash('topic', {title: req.body.title});
    req.hasErrors = true;
    res.locals.redirect = '/topics/new';
    return next();
  }
  next();
};

export {index, indexView, newTopic, create, redirectView, 
  show, showView, deleteTopic, validateTopicInput};
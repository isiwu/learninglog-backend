import {validationResult} from 'express-validator';
import { getData } from "../helpers";
import Entry from "../models/entry";
import Topic from "../models/topic";


const newEntry = (req, res, next) => {
  const topicId = req.params.id;
  Topic.findById(topicId).exec()
  .then(topic => {
    res.render('entries/new', {topic});
  })
  .catch(error => {
    console.log(`Error fetching topic for new entry: ${error.message}`);
    next(error);
  });
},
create = (req, res) => {
  let entryData = getData(req.body),
  topicId = req.params.id;

  Entry.create(entryData)
  .then(entry => {
    const splits = entry.body.split('\r\n');
    splits.forEach(split => {
      if (split) entry.paragraphs.push(split);
    });

    return entry.save();
  })
  .then(entry => {
    return Topic.findByIdAndUpdate(topicId, {$addToSet: {entries: entry._id}}).exec();
  })
  .then(topic => {
    req.flash('success', 'New entry added!');
    res.redirect(`/topics/${topic._id}`);
  })
  .catch(error => {
    console.log(`Error adding entry: ${error.message}`);
    req.flash('error', 'Server busy.Try again.');
    res.redirect(`/topics/${topicId}/entries/new`);
  });
},
edit = (req, res, next) => {
  const topicId = req.params.topicId,
  entryId = req.params.entryId,
  user = req.user;

  if (!user) {
    req.flash('error', 'Please login to complete this action!');
    res.redirect('/users/login');
  }

  Topic.findOne({_id: topicId, author: user._id}).exec()
  .then(topic => {
    if (!topic) return res.redirect(`/topics/${topicId}`);

    res.locals.topic = topic;
    return Entry.findById(entryId).exec();
  })
  .then(entry => {
    res.locals.entry = entry;
    res.render('entries/edit');
  })
  .catch(error => {
    console.log(`Error fetching entry by ID: ${error.message}`);
    next(error);
  });
},
update = (req, res) => {
  let entryData = getData(req.body),
  {topicId, entryId} = req.params,
  user = req.user;

  if (!user) {
    req.flash('error', 'Please login to complete this action!');
    res.redirect('/users/login');
  }
  
  new Promise((resolve, reject) => {
    Topic.findOne({_id: topicId, author: user._id, entries: entryId}).exec()
    .then(topic => {
      if (!topic) return reject('no topic');

      resolve();
    });
  })
  .then(() => {
    return Entry.findByIdAndUpdate(entryId, entryData).exec();
  })
  .then(entry => {
    entry.paragraphs = [];
    const splits = entry.body.split('\r\n');
    splits.forEach(split => {
      if (split) entry.paragraphs.push(split);
    });

    return entry.save();
  })
  .then(entry => {
    res.locals.entry = entry;
    req.flash('success', 'Entry updated');
    res.redirect(`/topics/${topicId}`);
  })
  .catch(error => {
    if (error === 'no topic') {
      req.flash('error', 'Server busy, try again.');
      return res.redirect(`/topics/${topicId}`);
    }

    console.log(`Error updating entry By ID: ${error.message}`);
    req.flash('error', 'server busy, try again');
    res.redirect(`/topics/${topicId}/entries/${res.locals.entry._id}/edit`);
  });
},
deleteEntry = (req, res) => {
  let {topicId, entryId} = req.params,
  user = req.user;

  if (!user) {
    req.flash('error', 'Please login to complete this action!');
    res.redirect('/users/login');
  }

  new Promise((resolve, reject) => {
    Topic.findOne({_id: topicId, author: user._id, entries: entryId}).exec()
    .then(topic => {
      if (!topic) return reject('no topic');

      resolve();
    });
  })
  .then(() => {
    return Entry.findByIdAndDelete(entryId).exec();
  })
  .then(entry => {
    res.locals.entry = entry;
    return Topic.findOne({_id: topicId, author: user._id}).exec();
  })
  .then(topic => {
    const index = topic.entries.indexOf(res.locals.entry._id);
    topic.entries.splice(index, 1);
    return topic.save();
  })
  .then(() => {
    req.flash('success', 'Entry deleted');
    res.redirect(`/topics/${topicId}`);
  })
  .catch(error => {
    if (error === 'no topic') {
      req.flash('error', 'Server busy, try again.');
      return res.redirect(`/topics/${topicId}`);
    }
    
    console.log(`Error deleting entry by ID: ${error.message}`);
    req.flash('error', 'action not successful. server busy, try again');
    res. redirect(`/topics/${topicId}`);
  });
},
validateEntryInput = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty) {
    const messages = errors.array().map(err => err.message);

    req.flash('error', messages.join(' and '));
    req.flash('entry', {body: req.body.body});
    
    if (req.params.entryId) {
      return res.redirect(`/topics/${req.params.topicId}/entries/${req.params.entryId}/edit`);
    }

    return res.redirect(`/topics/${req.params.id}/entries/new`);
  }
  next();
};

export {newEntry, create, edit, update, deleteEntry, validateEntryInput};
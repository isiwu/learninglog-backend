import Topic from "../models/topic";
import User from "../models/user";


const home = (req, res) => {
  res.render('pages/home');
},
publicTopics = (req, res, next) => {
  const author = req.params.author;

  User.findOne({username: author}).exec()
  .then(author => {
    res.locals.author = author;
    return Topic.find({author, public: true}).exec();
  })
  .then(topics => {
    res.locals.topics = topics;

    next();
  })
  .catch(error => {
    console.log(`Error fetching public topics from due to: ${error.message}`);
    next(error);
  });
},
publicTopicsView = (req, res) => {
  res.render('pages/public-topics', {layout: 'custom-layout'});
},
showPublicTopic = (req, res, next) => {
  const id = req.params.id,
  author = req.params.author;

  Topic.findOne({_id: id, public: true}).populate('author', '-image').populate({path: 'entries', options: {sort: {createdAt: -1}}}).exec()
  .then(topic => {
    if (topic.author.username !== author) {
      return next(new Error('page not available! try again later'));
    }
    res.locals.topic = topic;
    next();
  })
  .catch(error => {
    console.log(`Error fetching public topic due to: ${error.message}`);
    next(error);
  });
},
showPublicTopicView = (req, res) => {
  res.render('pages/public-topic');
};

export {home, publicTopics, publicTopicsView, showPublicTopic, showPublicTopicView};
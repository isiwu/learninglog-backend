import mongoose from 'mongoose';
import Entry from './entry';

const {Schema} = mongoose,
topicSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  public: {
    type: Boolean,
    default: false,
  },
  author: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  entries: [{type: Schema.Types.ObjectId, ref: 'Entry'}]
}, {timestamps: true});

topicSchema.pre('deleteOne', {document: true, query: false}, function(next) {
  const topic = this,
  commands = [];

  topic.entries.forEach(entry => {
    commands.push(Entry.findByIdAndDelete(entry).exec());
  });

  Promise.all(commands)
  .then(() => {
    console.log('Topic entries deleted!');
    next();
  })
  .catch(error => {
    console.log(`Error deleting entries under ${topic} due to: ${error.message}`);
    next(error);
  });
});

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
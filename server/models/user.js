import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
import Topic from './topic';
import VerifyToken from './verify-token';

const {Schema} = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  pubTopicURL: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    data: Buffer,
    contentType: String
  },
  isVerified: {
    type: Boolean,
    default: false,
  }
});
userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email'
});

userSchema.pre('deleteOne', {document: true, query: false}, function(next) {
  const user = this;

  VerifyToken.findByIdAndDelete(user).exec()
  .then(() => {
    next();
  })
  .catch(error => {
    console.log(`Error deleting user's token: ${error.message}`);
    next(error);
  });
});

userSchema.pre('deleteOne', {document: true, query: false}, function(next) {
  const user = this;

  Topic.remove({author: user._id}).exec()
  .then(() => {
    next();
  })
  .catch(error => {
    console.log(`Error deleting user's topics due to: ${error.message}`);
    next(error);
  });
});
userSchema.virtual('topics', {
  ref: 'Topic',
  localField: '_id',
  foreignField: 'author',
});

const User = mongoose.model('User', userSchema);

export default User;
import mongoose from 'mongoose';

const {Schema} = mongoose,

entrySchema = new Schema({
  body: {type: String, required: true},
  paragraphs: [String],
}, {timestamps: true}),

Entry = mongoose.model('Entry', entrySchema);

export default Entry;
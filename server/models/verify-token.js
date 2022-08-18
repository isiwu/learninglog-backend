import mongoose from 'mongoose';

const {Schema} = mongoose,
verifyTokenSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, ref: 'User'},
  token: {type: String, required: true, unique: true},
  createdAt: {type: Date,  default: Date.now(), expires: '1d'}
}),

VerifyToken = mongoose.model('VerifyToken', verifyTokenSchema);

export default VerifyToken;
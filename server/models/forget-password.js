import mongoose from 'mongoose';

const {Schema} = mongoose,
forgetPasswordSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, ref: 'User'},
  token: {type: String, required: true},
  createdAt: {type: Date, default: Date.now(), expires: '1d'}
}),

ForgetPassword = mongoose.model('ForgetPasswword', forgetPasswordSchema);

export default ForgetPassword;
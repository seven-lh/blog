const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/config').get(process.env.NODE_ENV);
const SALT_ = 10;

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: 1
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: Number,
    defult: 0
  },
  token: {
    type: String
  }
});

userSchema.pre('save',function(next){
  let user = this;
  if (user.isModified('password')){
    bcrypt.genSalt(SALT_, function(err,salt){
      if(err) return next();
      bcrypt.hash(user.password,salt,function(err,hash){
        user.password = hash;
        next();
      });
    })
  } else {
    next();
  }
});

userSchema.methods.comparePassword = function(candidatePassword,cb){
  bcrypt.compare(candidatePassword,this.password,function(err,isMatch){
    if(err) return cb(err);
    cb(null, isMatch);
  });
}
userSchema.methods.generateToken = function(cb){
  let user = this;
  let token = jwt.sign(user._id.toHexString(),config.SECRET);
  user.token = token;
  user.save(function(err, user){
    if(err) return cb(err);
    cb(null,user);
  });
}
userSchema.methods.deleteToke = function(token){
  let user = this;
  user.update({ $unset: { token: 1 }},(err,user)=>{
    if (err) return cb(err);
    cb(null,user);
  });
}
userSchema.statics.findByToken = (token,cb)=>{
  console.log(token);
  jwt.verify(token, config.SECRET, function(err, decode){
    User.findOne({"_id": decode,"token":token},function(err, user){
      if(err) return cb(err);
      cb(null, user);
    });
  });
}

const User = mongoose.model('User',userSchema);
module.exports = { User };
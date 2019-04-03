const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const config = require('./config/config').get(process.env.NODE_ENV);

const app = express();

mongoose.Promise = global.Promise;
mongoose.connect(config.DATABASE,{ useNewUrlParser: true ,autoIndex: false });
const { User } = require('./models/user');
const { Article } = require('./models/article');
const { auth } = require('./middleware/auth');
app.use(bodyParser.json());
app.use(cookieParser());

const endpoint = '/api';
app.get(`${endpoint}/article`,(req,res)=>{
  const _id = req.query.id;
  Article.findById(_id,(err,article)=>{
    if(err) {res.status(200).json({get: false})}
    res.status(200).json({
      get: true,
      article 
    });
  });
});
app.get(`${endpoint}/articles`,(req,res)=>{
  //?skip=3&limit=2&order=asc||desc
  let skip = parseInt(req.query.skip);
  let limit = parseInt(req.query.limit);
  let order = req.query.order;
  Article.find().skip(skip).sort({ _id: order }).limit(limit).exec((err,doc)=>{
    if(err) return res.status(400).send(err);
    res.send(doc);
  });
});
//post 
app.post(`${endpoint}/article`,(req,res)=>{
  const article = new Article(req.body);
  article.save((err,doc)=>{
    if (err) {res.status(200).json({error: err})}
    res.status(200).json({
      post: true,
      id: doc._id,
    });
  });
});
//update
app.post(`${endpoint}/articleUpdate`,(req,res)=>{
  Article.findByIdAndUpdate(req.body._id, req.body ,{new: true},(err,doc)=>{
    res.status(200).json({
      put: true,
      article: doc
    })
  });
});
//delete 
app.delete(`${endpoint}/delete_article`,(req,res)=>{
  let id = req.query.id
  Article.findByIdAndRemove(id,(err, doc)=>{
    if(err) return res.status(400).send(err);
    res.status(200).json({delete: true});
  });
});

app.post(`${endpoint}/register`,(req,res)=>{
  const user = new User(req.body);
  user.save((err,doc)=>{
    if (err) return res.json({ message: false });
    res.status(200).json({ user: doc });
  });
});
app.get(`${endpoint}/auth`,auth,( req, res )=>{
  res.json({
    isAuth: true,
    id: req.user._id,
    email: req.user.email
  });
});
app.get(`${endpoint}/logout`,auth,( req, res )=>{
  req.user.deleteToken(req.token,(err, user)=>{
    if (err) return res.json({ message: false });
    res.status(200).json({
      message: `${user.email} has logout successsly1`
    });
  });
});
app.post(`${endpoint}/login`,(req,res)=>{
    User.findOne({ 'email': req.body.email },(err, user)=>{
    if(!user) return res.json({
      isAuth: false, 
      message: 'user not found!'
    });
    user.comparePassword(req.body.password,(err, isMatch)=>{
      console.log(req.body,isMatch);
      if(!isMatch) return res.json({
        isAuth: false, 
        message: 'password not currect'
      });
      user.generateToken((err,user)=>{
        if(err) return res.status(400).send(err);
        res.cookie('auth',user.token).json({
          isAuth: true,
          id: user._id,
          email: user.email, 
          message: 'successly',
        });
      });
    });
  });
});

app.get(`${endpoint}/getReviewer`,(req,res)=>{
  let id = req.query.id;
  User.findById(id, (err,doc)=>{
    if(err) return res.status(400).send(err);
    res.json({
      name: doc.name,
    })
  });
});
app.get(`${endpoint}/users`,(req,res)=>{
  User.find({},(err,users)=>{
    if(err) return res.status(400).send(err);
    res.json(users);
  });
});

app.get(`${endpoint}/usersPosts`,(req,res)=>{
  Article.find({ownerId: req.query.user}).exec((err,docs)=>{
    if(err) return res.status(400).send(err);
    res.json(docs);
  });
});
app.listen(config.PORT, function () {
  console.log(`Example app listening on port ${config.PORT}!`);
});
//import createError from 'http-errors';
import express from 'express';
import { join } from 'path';
//import cookieParser from 'cookie-parser';
import logger from 'morgan';
import dotEnv from 'dotenv';
import methodOverride from 'method-override';
import mongoose from 'mongoose';
import session from 'express-session';
import flash from 'connect-flash';
import expressEjsLayouts from 'express-ejs-layouts';
import connectMongoDBSession from 'connect-mongodb-session';
import passport from 'passport';

import User from './models/user';
import router from './routes/index';
//import usersRouter from './routes/users';

import "core-js/stable";
import "regenerator-runtime/runtime";

dotEnv.config();

const app = express(),
DB_URI = process.env.MONGODB_URI;

console.log(process.env.COOKIE_SECRET);

mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('database connected');
})
.catch(error => {
  console.log(`database connection error: ${error.message}`);
});

mongoose.set("returnOriginal", false);

const MongoDBStore = connectMongoDBSession(session),
store = new MongoDBStore({
  uri: DB_URI,
  databaseName: 'metalog_db',
  collection: 'session',
  expires: 1000*60*60*24,
  connectionOptions: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
}, error => {
  if (error) {
    return console.log(`Error connecting to database for session model: ${error}`);
  }

  console.log("Session database connected!");
});

console.log(process.env.COOKIE_SECRET);

const sessOptions = {
  secret: "mysecret",
  cookie: {secure: false},
  name: 'cookieName',
  resave: false,
  saveUninitialized: false,
  store
};

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  sessOptions.cookie.secure = true;
}

// view engine setup
app.set('views', join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.use(expressEjsLayouts);
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//app.use(cookieParser());
app.use(express.static(join(__dirname, '../public')));
app.use(methodOverride('_method', {methods: ['GET', 'POST']}));

//Session and flash setting
app.use(session(sessOptions));
app.use(flash());

//Passport setting
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.successMessage = req.flash('success')[0];
  res.locals.errorMessage = req.flash('error')[0];
  res.locals.confirmMessage = req.flash('confirm')[0] ?? '';
  res.locals.user = req.isAuthenticated()? req.user : {email: '', _id: '', image: {data: '', contentType: ''}};
  res.locals.usernameMessage = req.flash('username')[0] ?? '';
  res.locals.userInput = req.flash('userInput')[0]??{email: '', username: ''};
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.admin = req.user?req.user.username === process.env.ADMIN?'admin':'':'';
  res.locals.topic = req.flash('topic')[0]??{title: ''};
  res.locals.entry = req.flash('entry')[0]??{body: ''};

  next();
});
app.use('/', router);

export default app;

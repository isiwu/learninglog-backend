import createError from 'http-errors';

// catch 404 and forward to error handler
const pageNotFoundError = (req, res, next) => {
  next(createError(404));
},
serverError = (error, req, res, next) => { // error handler
  // set locals, only providing error in development
  res.locals.message = error.message;
  res.locals.error = req.app.get('env') === 'development' ? error : {};

  // render the error page
  if (req.app.get('env') === 'development') {
    res.status(error.status || 500);
    res.render('error');
  } else {
    if (error.status === 404) {
      res.status(error.status);
      res.send(`${error.status} | Page not available`);
    } else {
      res.status(error.status || 500);
      res.send(`${error.status || 500} | Sorry, our application is expriencing a problem!`);
    }
  }
};

export {pageNotFoundError, serverError};
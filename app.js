var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Configure database

var dbConfig = require('./db');
var mongoose = require('mongoose');


// Connect to DB
mongoose.connect(dbConfig.url);

var app = express();
var hbs = require('hbs');
var port = process.env.PORT || 8080;
var io = require('socket.io').listen(app.listen(port));


// View engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', hbs.__express);

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configuring Passport

var passport = require('passport');
var expressSession = require('express-session');

// TODO - Why Do we need this key ?

app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());

 // Using the flash middleware provided by connect-flash to store messages in session
 // and displaying in templates

var flash = require('connect-flash');
app.use(flash());

// Initialize Passport

var initPassport = require('./passport/init');
initPassport(passport);

var routes = require('./routes/index')(passport,io);
app.use('/', routes);

/// catch 404 and forward to error handler

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

module.exports = app;

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    io.emit('chat message', { message: msg, time: (new Date).getTime()});
  });
});
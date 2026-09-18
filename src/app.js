const cookieParser=require("cookie-parser");
const path=require("path");
const authroutes=require('./route/auth.routes');
const musicRoutes=require('./route/music.routes');
const pageRoutes=require('./route/page.routes');
const authMiddleware=require('./middlewares/auth.middleware');
 
const express=require('express');
 
const app=express();
 
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // needed for the EJS forms
app.use(cookieParser());
 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public'))); // serves /style.css
 
app.use('/api/auth',authroutes);
app.use('/api/music', musicRoutes);
app.use('/', authMiddleware.attachUser, pageRoutes);
 
module.exports=app;
 
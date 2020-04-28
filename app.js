const path = require('path');
const fs=require('fs');
//const https=require('https');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session=require('express-session');
const MongoDBStore=require('connect-mongodb-session')(session);
const csrf=require('csurf');
const flash=require('connect-flash');
const multer=require('multer');
const helmet=require('helmet');
const compression=require('compression');
const morgan=require('morgan');

const errorController = require('./controllers/error');
const User = require('./models/user');
//console.log(process.env.NODE_ENV);

//'mongodb://root:admin@cluster0-shard-00-00-rztzf.mongodb.net:27017,cluster0-shard-00-01-rztzf.mongodb.net:27017,cluster0-shard-00-02-rztzf.mongodb.net:27017/shop?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority'
//'mongodb+srv://root:admin@cluster0-rztzf.mongodb.net/shop?retryWrites=true&w=majority'

const MONGODB_URI=`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-shard-00-00-rztzf.mongodb.net:27017,cluster0-shard-00-01-rztzf.mongodb.net:27017,cluster0-shard-00-02-rztzf.mongodb.net:27017/${process.env.MONGO_DEFAULT_DATABASE}?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority`;
    
const app = express();
const store = new MongoDBStore({
    uri:MONGODB_URI,
    collection:'sessions'
});
const csrfProtection=csrf();

//const privateKey=fs.readFileSync('server.key');
//const certificate=fs.readFileSync('server.cert');

const fileStorage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'images');
    },
    filename:(req,file,cb)=>{
        cb(null,'amit'+'-'+file.originalname);
    }
})

const fileFilter=(req,file,cb)=>{
    if(file.mimetype==='image/png' || file.mimetype==='image/jpg' ||file.mimetype==='image/jpeg')
    {
        cb(null,true)
    } else {
        cb(null,false)
    }
}

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const accessLogStream=fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'})
app.use(helmet());
app.use(compression());
app.use(morgan('combined',{stream:accessLogStream}));
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(multer({dest:'images'}).single('image'));
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(session({secret:'my secret',reset:false,saveUninitialized:false,store:store}));
app.use(csrfProtection);
app.use(flash());

app.use((req,res,next)=>{
    res.locals.isAuthenticated=req.session.isLoggedIn;
    res.locals.csrfToken=req.csrfToken();
    next();
})

app.use((req,res,next)=>{
    //throw new Error('sync Dummy');
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user._id).then(user=>{
        //throw new Error('Dummy');
        if(!user)
        {
            next();
        }
        req.user=user;
        next();
    }).catch(err=>{
        //throw new Error(err);
        next(new Error(err));
    });
});



app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500',errorController.get500);
app.use(errorController.get404);
app.use((err,req,res,next)=>{
    console.log(err);
    res.status(500).render('500', { pageTitle: 'Error', path: '/404',isAuthenticated:req.session.isLoggedIn });
});

mongoose.connect(MONGODB_URI).then(result=>{
    //https.createServer({key:privateKey,cert:certificate},app)
    app.listen( process.env.PORT || 3000);
}).catch(err=>console.log(err));


/*



*/
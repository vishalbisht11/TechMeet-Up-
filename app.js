var express = require("express");
var app = express();
var ejs = require("ejs");
var bodyParser = require("body-parser");	//parses the JSON, buffer, string and URL encoded data submitted using HTTP POST request.
											//extract the entire body portion of an incoming request stream and exposes it on req.body
var mongoose = require("mongoose");			//Mongoose is an object data modeling (ODM) library.
											//Allows you to define objects with a strongly-typed schema that is mapped to a MongoDB document.			
var passport = require("passport");			//Passport is authentication middleware for Node.
var LocalStrategy = require("passport-local")	//
var passportLocalMongoose = require("passport-local-mongoose");	//User-authentiactionw with passport.js and mongodb

var Meetup = require("./models/meet");		
var Comment = require("./models/comments");
var seedDB = require("./seeds");	
var User = require("./models/user");
seedDB();

mongoose.connect("mongodb://localhost/techmeet");	//yelpcamp is the database name

app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");		//allows us to write ejs files as abc instead of abc.ejs
app.use(express.static("public"));	//tells public folder is accessible.

//PASSPORT CONFIGURATION
app.use(require("express-session")({			//including express-session in  its methods giving 3 parameters
	secret:"Rusty is the best and cutest dog",
	resave:false,
	saveUninitialized:false
}));

app.use(passport.initialize());			//tells express to use passport 
app.use(passport.session());			// " "			""	   session

passport.use(new LocalStrategy(User.authenticate()));
//Reading the session,taking the data from the session and encoding and decoding it
passport.serializeUser(User.serializeUser());		//For encoding
passport.deserializeUser(User.deserializeUser());	//For decoding

app.use(function(req,res,next){
	res.locals.currentUser = req.user;	//Passes req.user as currentUser to all routes so to undesrtand whether user is logged in or not
										// and accordingly change the navbar as sign up,login OR logout
	next();
});

app.get("/", function(req,res){
	//res.send("this is landing page");
	res.redirect("/landing");
});

app.get("/landing", function(req,res){
	res.render("meetups/landing");
});

//SHOW all meetups
app.get("/meetup",function(req,res){

Meetup.find({}, function(err, allMeetups){		//Get all campgrounds from DB
	if(err){
		console.log(err);
	}
	else{
		res.render("meetups/index",{meetups:allMeetups});
			//req.user contains info (username and id) of all users who are currently logged in.
	}
});
});

app.post("/meetup",isLoggedIn, function(req,res){
	var name = req.body.name;
	var image = req.body.image;
	var description = req.body.description;
	var newMeet = {name: name,image: image,description:description};
	//campgrounds.push(newCamp);
	Meetup.create(newMeet, function(err,newlyCreated){	//here create is a mongoose method on variable Campground
		if(err){
			console.log(err);
		}
		else{
			res.redirect("/meetup");
		}
	});
});

app.get("/meetup/new",function(req,res){
	res.render("meetups/new");
});

//shows more info about one campground with the given id
app.get("/meetup/:id", function(req, res){
	//find the campground with given id
	Meetup.findById(req.params.id).populate("comments").exec(function(err, foundMeet){
		if(err){
			console.log(err);
		}
		else{
			//render show template with that campground
			res.render("meetups/show", {meetup: foundMeet});
		}
	});
});

//===============
//COMMENT ROUTES
//===============

//NEW- show form to create new comment
app.get("/meetups/:id/comments/new",isLoggedIn,function(req,res){
	//find campground by id 
	Meetup.findById(req.params.id,function(err,meetup){
		if(err){
			console.log(err);
		}
		else{
			res.render("comments/new",{	meetup:meetup});
		}
	});
});

//POST /submit new comment to server
app.post("/meetups/:id/comments",isLoggedIn,function(req,res){
	
	Meetup.findById(req.params.id, function(err,meetup){
		if(err){
			console.log(err);
			res.redirect("/meetups");
		}
		else{
			Comment.create(req.body.comment, function(err,comment){
				if(err){
					console.log(err);
				}
				else{
					meetup.comments.push(comment);
					meetup.save();
					res.redirect("/meetup/"+meetup._id);
				}

			});
		}

		
	});
});


//---------------------
//AUTH ROUTES
//---------------------

//show register form
app.get("/register",function(req,res){
	res.render("register");
});

//Handle Signup logic
app.post("/register",function(req,res){
	var newUser = new User({ username:req.body.username});
	User.register(newUser, req.body.password,function(err,user){
		//User object(having username) and password is send to User.register() method which hashes the password and if everything goes well
		//then user will be send containg the username along with its hashed password else an error /err is send.
		//This is required because we don't store the passwords as at is in the database instead we stores hashed passwords.
		if(err){
			console.log(err);
			return res.render("register");
		}
		passport.authenticate("local")(req,res,function(){		//if no err then authenticate the user to log in 
			res.redirect("/meetup");			//when the user is logged in , he is allowed to enter the secret page
		});
	
	});
});

//show login form 
app.get("/login",function(req,res){
res.render("login");
});

//Hanling login logic
//Login logic: passport.authenticate() automatically tries to login/authenticate the user
app.post("/login",passport.authenticate("local",{		//passport.authenticate(...) is a middleware since it is called immediately
	successRedirect:"/meetup",							//after a route is called but before the callback function
	failurerRedirect:"/login"
}), function(req,res){

});


//Logout route
app.get("/logout",function(req,res){
	req.logout();	//Passport will destroy all user data from the session
	res.redirect("/meetup");
});



function isLoggedIn(req,res,next){
	if(req.isAuthenticated()){			//if user is logged in return next,means call the callback function this helps to keep secret	
		return next();					//page secret ie make it available onlyw hen user is logged in ie sessions is avaiable for it 
	}
	res.redirect("/login");
};


app.listen(3000,function(){
	console.log("The project has started");
})
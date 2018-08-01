var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

 var UserSchema = new mongoose.Schema({
 	username:String,
 	password:String
 });

UserSchema.plugin(passportLocalMongoose);	// Provides methods/functions of passportLocalMongoose to the userSchema variable

 module.exports = mongoose.model("User",UserSchema);
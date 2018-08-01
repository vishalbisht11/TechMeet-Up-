
var mongoose = require("mongoose");

//SETUP SCHEMA
var meetupSchema = new mongoose.Schema(
	{
		name : String,
		image: String,
		description: String,
		comments:[
			{
			type : mongoose.Schema.Types.ObjectId,
			ref : "Comment"
			}	
		]
});

module.exports = mongoose.model("Meetup",meetupSchema);

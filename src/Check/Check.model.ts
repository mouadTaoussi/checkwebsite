import mongoose,{ Schema, model } from "mongoose";

const WebsiteLogSchema = new Schema({
	user_id     : { type: String, required: true }, // a reference to the user
	website_id  : { type: String, required: true }, // a reference to the website
	status_code : { type: Number, required: true }, // Status code where the website got down
	explanation : { type: String, required: true }, // Status code description
	whenitdown  : { type: String, required: true }, // when it occurs?
	log_id      : { type: String, required: true }  // a given id to fetch a specific log
});

// websitesResponsesTimeInDay
	// website_id
	// user_id
	// response_times_melliseconds [23,25,25]
const websitesResponsesTimeInDaySchema = new Schema({
	website_id   : { type: String, required: true },
	user_id      : { type: String, required: true },
	response_times_melliseconds : [mongoose.Schema.Types.Mixed]
});

// websiteAverageTimeInDay 
	// website_id
	// website_name
	// user_id
	// website_speed_last_ten_days
		// [{ date: "20/12/2020",average_melliseconds: 121  }]
const websiteAverageTimeInDaySchema = new Schema({
	website_id   : { type: String, required: true },
	website_name : { type: String, required: true },
	user_id      : { type: String, required: true },
	website_speed_last_ten_days: [{ date: String, average_melliseconds: Number }]
});

const WebsiteLogModel            
					= model("websiteslog",  WebsiteLogSchema);
					
const websitesResponsesTimeInDayModel
					= model("websitesResponsesTimeInDay",  websitesResponsesTimeInDaySchema);

const websiteAverageTimeInDayModel   
					= model("websiteAverageTimeInDay",  websiteAverageTimeInDaySchema);

export { 
	WebsiteLogModel, websitesResponsesTimeInDayModel, websiteAverageTimeInDayModel 
};

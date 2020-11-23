import CheckWebsitesService from './Check.service';
import { CheckWebsiteControllerInterface, handlePushAndEmailOptions } from './Check.interface';
import { websiteType, subscriptionObject } from '.././Authentication/Authentication.interface';
import axios, { AxiosResponse } from 'axios';
import webpush, { sendNotification, generateVAPIDKeys,setVapidDetails } from 'web-push';
import { Request, Response } from 'express';
import { createTransport } from 'nodemailer';
import AuthenticationService from '.././Authentication/Authentication.service';
import application_config from '.././main.config';

const websiteService = new CheckWebsitesService();
const userService = new AuthenticationService();

class CheckWebsiteController implements CheckWebsiteControllerInterface {

	private websitesLogService : any;
	private vapidPublicKey : string | undefined = application_config.vapid_public_key; 
	private vapidPrivateKey: string | undefined = application_config.vapid_private_key;


	constructor(){
		webpush.setGCMAPIKey('<Your GCM API Key Here>');
		webpush.setVapidDetails(
		  'mailto:example@yourdomain.org',
		  this.vapidPublicKey,
		  this.vapidPrivateKey
		);
	}

	public async addWebsite(request:any,response:Response):Promise<void> {
		// Get body data along side owner
		const website: websiteType = request.body;
		// Get the user by its token
		const user: { 
			iat:string, email:string, id:string } = request.user;

		// Service
		const saving = await websiteService.addWebsite(user.id,website);
		
		// Send the response back
		response.status(saving.status).send({
			message : saving.message,
			website : saving.data
		})
	}

	public async deleteWebsite(request:any,response:Response):Promise<void> {
		// Get user
		const user: { 
			iat:string, email:string, id:string } = request.user;

		// Get website id
		const {website_id} = request.query;

		// Service
		const deleting = await websiteService.deleteWebsite(user.id, website_id);

		// Send the response back
		response.status(deleting.status).send({
			message : deleting.message,
		})		
	}
	public async websiteLogs(request:any,response:Response):Promise<void> {
		// Get user id to show thier websites logs<Token>
		const user: { 
			iat:string, email:string, id:string } = request.user;

		// Service
		const logs = await websiteService.getLogs(user.id);	

		// Send the response back
		response.status(logs.status).send({
			logs : logs.data,
		});
	}
	public async deleteWebsiteLogs(request:any,response:Response):Promise<void> {
		// Get user id to delete thier websites logs<Token>
		const user: { 
			iat:string, email:string, id:string } = request.user;
		// Service
		const deleting = await websiteService.deleteLogs(user.id, undefined);
		// Send the response back
		response.status(deleting.status).send({
			message : deleting.message
		});	
	}
	public async handlePushAndEmail(registeration:subscriptionObject,options:handlePushAndEmailOptions)
	: Promise<void> {
		//  // init payload
		const payload : { title: string, url: string } = {
			title: options.message,
			url  : options.url
		}
		//  // send a notification and email
		sendNotification(
			registeration,JSON.stringify(payload)
		) 
		// nodemailer
		// Create transporter object with credentials
		var transporter = createTransport({
			service :'gmail',
			auth: { user: application_config.email, pass: application_config.password }
		});
		// Check the language the user set in the app to send the email appropriated to his language
		// let mailTemplate;

		// send it!
		transporter.sendMail({
			from: '"WebCheck Team" <mouadtaoussi0@gmail.com>',
		    to: options.user_email,
		    subject: 'Something went wrong!',
		    text: options.message, 
		    // html: mailTemplate
		});
		// 	// push a log to the database 
		const push = await websiteService.pushLog(options.status_code,options.user_id,options.website_id); 
	}
	public async checkEveryWebsiteExists():Promise<void> {
		// console.log('Hello');
		// Get all users
		const users = await userService.findUser({id:undefined,email:undefined});
		// Loop
		for (let i = 0; i < users.user.length ; i++) {
			// Loop
			for (let o = 0; o < users.user[i].websites.length; o++) {

				// Check if the already is down by checking website[i].active
				if ( users.user[i].websites[o].active ) {
					
					// axios 
					try {
						const checking : AxiosResponse = await axios({
						method : 'GET',
						url : users.user[i].websites[o].website,
						headers : {
							// 'Content-Type': 'text-html',
							"access-control-allow-origin": "*",
						}
						})
					}
					// // if one of the websites is down
					catch (error){
						if (error.response) {
						// set website[i].active to false
						users.user[i].websites[o].active = false;
						// Save that active in the database
						await users.user[i].save();

						new CheckWebsiteController().handlePushAndEmail(users.user[i].pushRegisteration,
						{
							message: "Your website is currently down!",
							url    : users.user[i].websites[o].website,
							status_code: error.response.status,
							user_id    : users.user[i]._id,
							user_email : users.user[i].email,
							website_id : users.user[i].websites[o]._id
						})
						}
						else {

						if (error.message.includes('ENOTFOUND')) {
							// set website[i].active to false
							users.user[i].websites[o].active = false;
							// Save that active in the database
							await users.user[i].save();

							new CheckWebsiteController().handlePushAndEmail(users.user[i].pushRegisteration,
							{
								message: "Might be you entered a wrong website url!",
								url    : users.user[i].websites[o].website,
								status_code: 404,
								user_id    : users.user[i]._id,
								user_email : users.user[i].email,
								website_id : users.user[i].websites[o]._id
							})
						}
						else if (error.message.includes('ECONNREFUSED')) {
							// set website[i].active to false
							users.user[i].websites[o].active = false;
							// Save that active in the database
							await users.user[i].save();

							new CheckWebsiteController().handlePushAndEmail(users.user[i].pushRegisteration,
							{
								message: "Your website is currently down!",
								url    : users.user[i].websites[o].website,
								status_code: 500,
								user_id    : users.user[i]._id,
								user_email : users.user[i].email,
								website_id : users.user[i].websites[o]._id
							})
						}

						}
					}
				} /* if website[i].active is false */ else {
					// axios
					try {
						const checking : AxiosResponse = await axios({
							method : 'GET',
							url : users.user[i].websites[o].website,
							headers : {
								// 'Content-Type': 'text-html',
								"access-control-allow-origin": "*",
							}
						})
						//  // set website[i].active to false
						users.user[i].websites[o].active = true;
						// Save that active in the database
						await users.user[i].save();
					}
					catch (error){ continue; }
				}
			}
		}
	}
}

// Run <checkEveryWebsiteExists> Job every 2 minutes
const checkWebsitesJob = new CheckWebsiteController().checkEveryWebsiteExists;

setInterval(checkWebsitesJob,60000);
// 60000
export default CheckWebsiteController;
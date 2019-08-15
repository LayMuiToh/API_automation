const login  = require('../api/identity-manager.js').login;
const logout  = require('../api/identity-manager.js').logout;
const startSession  = require('../api/session-manager.js').startSession;
const close  = require('../api/session-manager.js').close;
const startChat = require('../api/conversation-router.js').startChat;
const endChat = require('../api/conversation-router.js').endChat;
const sendToWss = require('../api/wss.js').sendToWss;
const utility = require('../helpers/utility');
const getPath = require('../helpers/websocket-server').getPath;
const fs = require('fs')

const chai = require('chai');
const expect = chai.expect;

describe("User speaks to the app 'I NEED A TOOL'", async function () {
		let loginResponse;
		let startSessionResponse;
		let authToken;
		let clientId;
		let sessionToken;
		let conversationId;
		let input;
		let startChatResponse;
		let endChatResponse;
		let closeResponse;
		let logoutResponse;
		let mode = "VOICE";
		let rpt = "wss-voice.csv";
		
    it("voice query test case to login, startSession startChat, sendToWss, endChat, closeSession, logout", async function() {
			input = 'Speaker1/f.wav';
			loginResponse = await login()
			.then(function(loginResponse) {
				clientId = loginResponse.data.clientInfo.clientId;
				authToken = loginResponse.data.authToken;
				expect(loginResponse.status).to.be.equal(200);
				expect(loginResponse.data).to.have.property('authToken');
				expect(loginResponse.data.clientInfo).to.have.property('clientId');
			
			});
		
			startSessionResponse = await startSession(clientId, authToken)
			.then(function(startSessionResponse) {
				expect(startSessionResponse.status).to.be.equal(200);
				expect(startSessionResponse.data).to.have.property('token');
				expect(startSessionResponse.data).to.have.property('clientId');
				expect(startSessionResponse.data).to.have.property('expiry');
				sessionToken = startSessionResponse.data.token;
				console.log('sessionToken:', sessionToken);
			});

			startChatResponse = await startChat(clientId, sessionToken)
			.then(function(startChatResponse) {
				expect(startChatResponse.status).to.be.equal(200);
				expect(startChatResponse.data).to.have.property('conversationId')
				conversationId = startChatResponse.data.conversationId;
				console.log('conversationId:', startChatResponse.data.conversationId);
			});
		
			let filePath = getPath(rpt, 'Report');
			console.log('FilePath:', filePath);
			fs.access(filePath, fs.F_OK, (err) => {
				if(err) {
					console.error(err);
				} else {
					console.log('File exists');
					fs.unlinkSync(filePath);	
				}
			});
			
			await sendToWss(clientId, sessionToken, conversationId, mode, input, rpt);
			
			endChatResponse = await endChat(clientId, sessionToken, conversationId, '')
			.then(function(endChatResponse) {
				expect(endChatResponse.status).to.be.equal(200);
			});

			closeResponse = await close(sessionToken)
			.then(function(closeResponse){
				expect(closeResponse.status).to.be.equal(200);
			});

			logoutResponse = await logout(authToken, process.env.USER_TENANT_ID)
			.then(function(logoutResponse) {
				expect(logoutResponse.status).to.be.equal(200);
			});
	});
});


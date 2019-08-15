const axios = require('axios');
const dotenv = require('dotenv');
const utility = require('../helpers/utility');

dotenv.config({path: './.env'});

const env = process.env.ENV;
const host = env == "k8s.dev" ? process.env.HOST_K8s : process.env.HOST;
const host_port_identity_manager  = host + process.env.PORT_IDENTITY_MANAGER;

const login = async function(){

    const data = {
          "clientInfo": {},
           "userId": process.env.USER_ID,
           "pass": process.env.USER_PASSWORD,
           "tenantId": process.env.USER_TENANT_ID
    }

     let url = host_port_identity_manager  + '/v2/login';
     console.log('To login to', url)
     const loginResponse = await axios.post(url,data)
     return loginResponse;
}

const logout = async function(authToken, tenantId){
     let url = host_port_identity_manager  + '/v2/logout';
     const data = {
            authToken,
            tenantId
     }

     console.log('To logout to', url, data)
     const logoutResponse = await axios.post(url,data)
     return logoutResponse;

} 

const invite = async function(sessionId) {
    let url = host_port_identity_manager + '/v2/invitation/new';
    let userId = process.env.USER_ID 
    let appId = process.env.APP_ID 
    let orgId = process.env.ORG_ID 
    let tenantId = process.env.USER_TENANT_ID
    let deploymentId = process.env.DEPLOYMENT_ID
    let stackId = process.env.STACK_ID
    let appInstallURL = process.env.APP_INSTALL_URL
    let deepLinkingRegisterURL = process.env.DEEP_LINKING_REGISTER
    let email = process.env.USER_EMAIL
    let greetingName = process.env.GREETING_NAME
    let selfRegistration = process.env.SELF_REGISTRAION
        
    const data = {
         organizationId: orgId,
         deploymentId: deploymentId,
         tenantId: tenantId,
         stackId : stackId,
         appId : appId,
         appInstallURL: appInstallURL,
         deepLinkingRegisterURL: deeplinkingRegisterURL,
         userId: userId,
         email: email,
         greetingName: greetingName,
         selfRegistration: selfRegistration
     }

     console.log('To invite user to', url, data)

     const inviteResponse = await axios.post(url, data, {
           method: 'post',
           headers: {
                forceNew: false,
 		'Authorization': sessionToken,
                'SESSION_DATA': utility.buildSessionData(sessionId, userId, appId, orgId, tenantId)
     	   }
     }).catch(function (inviteResponse) {
            //handle error
            console.log(inviteResponse);
     })
     return inviteResponse;
}

exports.login = login;
exports.logout = logout;
exports.invite = invite;

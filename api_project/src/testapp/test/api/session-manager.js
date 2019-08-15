const axios = require('axios');
const dotenv = require('dotenv');
const utility = require('../helpers/utility');

dotenv.config({path: './.env'});

const env = process.env.ENV;
const host = env == "k8s.dev" ? process.env.HOST_K8s : process.env.HOST;
const host_port_session_manager  = host + process.env.PORT_SESSION_MANAGER;
const agent_dialog = process.env.AGENT_DIALOG;

const startSession = async function(clientId, authToken){
  let userId = process.env.USER_ID 
  let appId = process.env.APP_ID 
  let orgId = process.env.ORG_ID 
  let tenantId = process.env.USER_TENANT_ID

    const data = {
      "app": {
          "apiKey": "API_KEY_1",
          "appId": appId || "APP_ANDROID_EMU",
          "organizationId": orgId || "ORG_ID_1",
          "workspaceId": "WORKSPACE_ID_1",
          "tenantId": tenantId
      },
      "client": {
          "clientId": clientId,
          "clientType": "test",
          "clientVersion": "1.0"
      },
      "user": {
          "authToken": authToken,
          "userId": userId
      }
  }

  let url = host_port_session_manager  + '/v2/start';
  console.log('To start session to', url, 'with', JSON.stringify(data))
  const startSessionResponse = await axios.post(url, data)
  return startSessionResponse;
}

const touchSession = async function(sessionToken){
    let url = host_port_session_manager + '/v2/touch';
    console.log('To touch session to', url)
    let data = {}
    const touchSessionResponse = await axios.post(url, data, {
      method: 'post',
      headers: {
          'Authorization': sessionToken
      }
    })
    return touchSessionResponse;
} 

const isValidSession = async function(sessionToken){
    let url = host_port_session_manager  + '/v2/isValid';
    console.log('To validate session to', url)
    let data = {}
    const isValidResponse = await axios.post(url, data, {
      method: 'post',
      headers: {
        'Authorization': sessionToken
      }
    }).catch(function (isValidResponse) {
      //handle error
      console.log(isValidResponse);
  })
  return isValidResponse;
} 

const decode = async function(sessionToken){
  let url = host_port_session_manager  + '/v2/decode';
  console.log('To decode session to', url)
  let data = {}
  const isValidResponse = await axios.post(url, data, {
    method: 'post',
    headers: {
      'Authorization': sessionToken
    }
  })
  return isValidResponse;
} 

const getSessionData = async function(sessionToken, key){
  let url = host_port_session_manager  + '/v2/getSessionData';
  let data = {
    key,
    conversationId : "",
    requestId: utility.getNextRequestId()
  }
  console.log('To call getSessionData to', url, JSON.stringify(data))
  const isValidResponse = await axios.post(url, data, {
    method: 'post',
    headers: {
      'Authorization': sessionToken
    }
  })
  return isValidResponse;
} 


const close = async function(sessionToken){
  let url = host_port_session_manager  + '/v2/close';
  console.log('To close session to', url)
  let data = {}
  const closeResponse = await axios.post(url, data, {
    method: 'post',
    headers: {
      'Authorization': sessionToken
    }
  })
  return closeResponse;
} 


exports.startSession = startSession;
exports.touchSession = touchSession;
exports.isValidSession = isValidSession;
exports.getSessionData = getSessionData;
exports.decode = decode;
exports.close = close;

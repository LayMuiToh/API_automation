const axios = require('axios');
const WebSocket = require('ws')
const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv');
const getGrpFromWavFile = require('../helpers/websocket-server').getGrpFromWavFile;
const getASROutput = require('../helpers/websocket-server').getASROutput;
const getASRVendor = require('../helpers/websocket-server').getASRVendor;
const getIDFromWavFile = require('../helpers/websocket-server').getIDFromWavFile;
const wavfileMapToUtterance = require('../helpers/websocket-server').wavfileMapToUtterance;
const checkResponse = require('../helpers/websocket-server').checkResponse;
const getPath = require('../helpers/utility').getPath;
const writeToFileVoice = require('../helpers/websocket-server').writeToFileVoice;
const writeToFileText = require('../helpers/websocket-server').writeToFileText;
const websocket = require('../helpers/websocket-server');

const sendToWss = async function(clientId, sessionToken, conversationId, mode, input, rptFile) {
  rptFile = getPath(rptFile, 'Report');
  input = getPath(input, 'wav');
  const WSS = new websocket.WSS_API()
  await WSS.connect(clientId, sessionToken)
  WSS.initReceivePromise()
  WSS.sendHeartbeat()
  console.log('Heartbeat sent')
  let response = await WSS.receive()
  console.log('Heartbeat response is ', response)
  let i = response.split(";");
  let j = i[0].split(':');
  let key = j[0];
  let length = j[1];
  let seq = j[2];
  console.log('Key = ' + key + ' length = ' + length + ' seq = ' + seq)
  WSS.ack(seq)

  WSS.startChat(clientId, conversationId, sessionToken)
  if (mode == "VOICE") {
      WSS.startAudio(clientId, conversationId)
      let fileBuffer = fs.readFileSync(input)
      console.log('Sending ', fileBuffer.length)
      WSS.sendAudio(fileBuffer)
      WSS.endAudio(clientId, conversationId)
  }
  else {
      WSS.sendText(conversationId, input);
  }

  WSS.initReceivePromise()
  console.log('Before await receive')
  response = await WSS.receive()

  if (mode == "VOICE") {
    console.log('ASR Response', response)
    let utterance;
    let asrOutput;
    let asrVendor;

    try {
      utterance = wavfileMapToUtterance(input, getGrpFromWavFile(input))
    } catch(e)
    {
      console.log('Error caught at wavfileMapToUtterance')
    }

    try {
      asrOutput = getASROutput(response);
    } catch(e)
    {
      console.log('Error caught at getASROutput')
    }
    
    try {
      asrVendor = getASRVendor(response);
    } catch(e)
    {
      console.log('Error caught at getASRVendor')
    }

    let asr_result = 'FAIL';
    // Strip off punctuation and double spacing
    let replaced_utterance = utterance.replace(/-/g, ' ').replace(/[^A-Za-z0-9_\s\']/g,"").replace(/\s+/g, " ").toUpperCase();
    
    console.log('UTTERANCE FROM MAPPING FILE: ', utterance);
    console.log('UTTERANCE: ', replaced_utterance);
    console.log('ASROUTPUT: ', asrOutput);
    console.log('VENDOR ', asrVendor);
    if (replaced_utterance.trim() === asrOutput.trim()) {
        asr_result = 'PASS';
    }

    console.log('ASR result: ', asr_result)

    let cr_result = 'FAIL';
    
    WSS.nextReceivePromise();
    response = await WSS.receive()
    console.log('CR Response: ', response);
    cr_result = checkResponse(utterance, response);
    console.log('CR result: ', cr_result, 'for', utterance);

    let getSpeakerDir = path.basename(path.dirname(input));
    let getwavDir = path.basename(path.dirname(path.dirname(input)));
    let dir = getwavDir.concat('/').concat(getSpeakerDir).concat('/')
    let wavFileFullPath = dir.concat(path.basename(input));
    await writeToFileVoice(getIDFromWavFile(input), wavFileFullPath, 
                    rptFile, replaced_utterance, 
                    asrOutput, asrVendor, asr_result, cr_result);
  }
  else {
      console.log('CR Response', response)
      let result = checkResponse(input, response);
      console.log('CR result: ', result, 'for', input)
      await writeToFileText(input, rptFile, result);
  }
}

exports.sendToWss = sendToWss;

const axios = require('axios');
const WebSocket = require('ws')
const path = require('path')
const dotenv = require('dotenv');
const XLSX = require('xlsx')
const fs = require('fs')

function WSS_API(config, clientId, sessionToken) {
  var o = {}
  o.config = config
  o.result = ''
  o.ws = null;
  o.connectPromise = new Promise(function (resolve, reject) {
      o.resolveConnect = resolve
  });

  o.nextReceivePromise = function() {
      let that = this;
      this.receivePromise = new Promise(function (resolve, reject) {
          console.log("!! Set a receive result promise")
          that.resolveReceive = resolve
      });
      return this.receivePromise
  }

  o.sendPromise = new Promise(function (resolve, reject) {
      o.resolveSend = resolve
  });

  o.closePromise = new Promise(function (resolve, reject) {
      o.resolveClose = resolve
  });

  o.initReceivePromise = function() {
      let that = this;
      this.receivePromise = new Promise(function (resolve, reject) {
          console.log("!! Set a receive promise")
          that.resolveReceive = resolve
      });
      return this.receivePromise
  }

  o.connect = async function(clientId, sessionToken) {
      let host =  process.env.HOST
      host = host.replace(/http/, 'ws')
      host = host.split(':')[0] + ':' + host.split(':')[1];
      let url = host + ':' + process.env.PORT_WEBSOCKET_SERVER

      console.log('to connect wss ' + url)

      this.initReceivePromise()
      let resolveConnect = this.resolveConnect

      this.ws = new WebSocket(url);

      this.ws.onopen = (evt) => {
          console.log('Connection opened, sending connect msg ');
          this.sendConnect(clientId, sessionToken)
          resolveConnect()
      };

      
      this.ws.onmessage = (evt) => {
          let resolveReceive = this.resolveReceive
           console.log('Received Message: ' + evt.data);
          let array = evt.data.split('\n')
          if (array.length < 2) {
              throw new Error('Invalid WSS Response')
          }
          let jsonString = ''
          for (let i = 1; i<array.length; i++) {
              jsonString += array[i]
              jsonString += '\n'
          }
          let json = JSON.parse(jsonString)
          if (json.errorCode != null && json.errorText != null) {
              throw Error('Error found: ' + json.errorText)
          }
          console.log('json is', json)
          resolveReceive(evt.data)
      };

      this.ws.onclose = (evt) => {
          let resolveClose = this.resolveClose
          console.log('Connection closed.');
          resolveClose()
      };

      return this.connectPromise
  }

  o.sendText = function(conversationId, text) {
      let msg = JSON.stringify({
          messageType: "chat",
          target: "stella.conversation",
          event: "dialog",
          message: {
              type: "text",
              source: "chat",
              language: "en-us",
              content: text
          },
          conversationId: conversationId
      })
      console.log('Sending chat text message : ' + msg)
      this.sendData(msg)
     
  }

  o.sendReset = function(conversationId) {
      let msg = JSON.stringify({
          messageType: "chat",
          target: "stella.conversation",
          event: "dialog",
          message: {
              type: "regex",
              source: "chat",
              language: "en-us",
              content: "/reset"
          },
          conversationId: conversationId
      })
      console.log('Sending chat text message : ' + msg)
      this.sendData(msg)
     
  }


  o.sendConnect = function(clientId, sessionToken) {
      let msg = JSON.stringify({
          messageType: "connect",
          clientId: clientId,
          session: sessionToken,
          requestId: 7
      })
      console.log('Sending connect message : ' + msg)
      this.sendData(msg)
  }

  o.receive= async function () {
      return this.receivePromise
  }

  o.sendData = function (data) {
      let ws = this.ws
      if (ws == null) {
          console.error('WS is not inited!')
          throw new Error("ws is null!")
      }

      ws.send(data);
  }

  o.sendHeartbeat = function() {
      let ts = new Date().getTime()
      let data = `{"messageType":"heartbeat","timestamp": ${ts}}`
      return this.sendData(data)
  }

  o.ack = function(seq) {
      let data = `{"messageType":"chat-ack","sequence":${seq}}`
      this.sendData(data)
  }

  o.startChat = function(clientId, conversationId, sessionToken) {
      let data = `{"messageType":"chat-start","clientId":"${clientId}","conversationId":"${conversationId}", "session":"${sessionToken}"}`
      this.sendData(data)
  }

  o.startAudio = function(clientId, conversationId) {
      let data = `{"messageType":"audio-start","clientId":"${clientId}","conversationId":"${conversationId}"}`
      this.sendData(data)
  }

  o.sendAudio = function(data) {
      this.sendData(data)
  }

  o.endAudio = function(clientId, conversationId) {
      let data = `{"messageType":"audio-end","clientId":"${clientId}","conversationId":"${conversationId}"}`
      this.sendData(data)
  }

  o.endChat = function(clientId, conversationId) {
      let data = `{"messageType":"chat-end","clientId":"${clientId}","conversationId":"${conversationId}"}`
      this.sendData(data)
  }

  o.close = function() {
      this.ws.close()
      return this.closePromise
  }
  return o
}

function getIDFromWavFile(wavFilePath)
{
    let wavFile = wavFilePath.replace(/^.*[\\\/]/, '');
    return wavFile.substr(0, wavFile.lastIndexOf('.')).substring(1);
}

function getASROutput(response)
{
    let regex = /^.*;/g;
    let res = response.replace(regex, '');
    try {
        let obj = JSON.parse(res);
        let ASR_output = obj.result.r0;
        return ASR_output;
    } catch(e)
    {
        console.log('Error at Response');
    }
    return "";
}

function getASRVendor(response)
{
    let regex = /^.*;/g;
    let res = response.replace(regex, '');
    try {
        let obj = JSON.parse(res);
        let ASR_vendor = obj.vendor;
        return ASR_vendor;
    } catch(e)
    {
        console.log('Error at Response');
    }
    return "";
}

function getGrpFromWavFile(wavFilePath)
{
    let wavFile = wavFilePath.replace(/^.*[\\\/]/, '');
    let grp = wavFile.substr(0, 2);
    switch(grp) {
        case 'f1':
            return 'query';
        case 'f2': 
            return 'other';
        case 'f3':
            return 'gen_nav';
        case 'f4':
            return 'library';
        case 'f5':
            return 'tech_info';
        default:
            return '';
    }
}

function wavfileMapToUtterance(wavFilePath, group)
{   
    let getID = getIDFromWavFile(wavFilePath);
    let currentPath = process.cwd()
    let file = currentPath + path.sep + 'scripts' + path.sep + 'mapping.xlsx'
    const workbook = XLSX.readFile(file);
    const xlLibrary = XLSX.utils.sheet_to_json(workbook.Sheets['library']);
    const xlQuery = XLSX.utils.sheet_to_json(workbook.Sheets['query']);
    const xlOther = XLSX.utils.sheet_to_json(workbook.Sheets['other']);
    const xlGenNav = XLSX.utils.sheet_to_json(workbook.Sheets['gen_nav']);
    const xlTechInfo = XLSX.utils.sheet_to_json(workbook.Sheets['tech_info']);

    console.log('ID: ', getID);
    console.log('Grp:', group);
    let i = 0;
    let ID;
    switch(group) {
        case 'library':
            for (i = 0; i <= xlLibrary.length;i++)
            {
                if (typeof(xlLibrary[i].Sub_ID) != 'undefined')
                {
                    ID = xlLibrary[i].ID.toString().concat(xlLibrary[i].Sub_ID.toString().toLowerCase());
                }
                else
                {
                    ID = xlLibrary[i].ID.toString().toLowerCase();
                }
                if ( ID == getID.toString().toLowerCase()) {
                    return xlLibrary[i].Utterance;
                }
            }
            break   
        case 'query':
            for (i = 0; i <= xlQuery.length;i++)
            {
                if (typeof(xlQuery[i].Sub_ID) != 'undefined')
                {
                    ID = xlQuery[i].ID.toString().concat(xlQuery[i].Sub_ID.toString().toLowerCase());
                }
                else
                {
                    ID = xlQuery[i].ID.toString().toLowerCase();
                }
                if (ID == getID.toString().toLowerCase()) {
                    return xlQuery[i].Utterance;
                }
            }
            break;
        case 'other':
            for (i = 0; i <= xlOther.length;i++)
            {
                if (typeof(xlOther[i].Sub_ID) != 'undefined')
                {
                    ID = xlOther[i].ID.toString().concat(xlOther[i].Sub_ID.toString().toLowerCase());
                }
                else
                {
                    ID = xlOther[i].ID.toString().toLowerCase();
                }
                if (ID == getID.toString().toLowerCase()) {
                    return xlOther[i].Utterance;
                }
            }
            break;
        case 'gen_nav':
            for (i = 0; i <= xlGenNav.length;i++)
            {
                if (typeof(xlGenNav[i].Sub_ID) != 'undefined')
                {
                    ID = xlGenNav[i].ID.toString().concat(xlGenNav[i].Sub_ID.toString().toLowerCase());
                }
                else
                {
                    ID = xlGenNav[i].ID.toString().toLowerCase();
                }
                if (ID == getID.toString().toLowerCase()) {
                    return xlGenNav[i].Utterance;
                }
            }
            break;
        case 'tech_info':
            for (i = 0; i <= xlTechInfo.length;i++)
            {
                if (typeof(xlTechInfo[i].Sub_ID) != 'undefined')
                {
                    ID = xlTechInfo[i].ID.toString().concat(xlTechInfo[i].Sub_ID.toString().toLowerCase());
                }
                else
                {
                    ID = xlTechInfo[i].ID.toString().toLowerCase();
                }
                if (ID == getID.toString().toLowerCase()) {
                    return xlTechInfo[i].Utterance;
                }
            }
            break;
        default:
            break;
    }

    return "";
}

function checkResponse(utterance, response) {
    let array = response.split('\n')
    let jsonString = ''
    for (let i = 1; i<array.length; i++) {
        jsonString += array[i]
        jsonString += '\n'
    }
    let json = JSON.parse(jsonString)
    if (json.errorCode != null && json.errorText != null) {
        throw Error('Error found: ' + json.errorText)
    }

    let cr_result = 'FAIL';
    console.log('json from CR is', json)
    let title;
    let namespace;
    let knowledge_value;
    if(json.target == 'stella.lens') {
        if(json.message instanceof Object) {
            if(json.message.content instanceof Array)
            {
                namespace = json.message.content[0].namespace;
                title = json.message.content[1].data.title;
                utterance = utterance.trim();
                switch(utterance) {
                    case 'I NEED A WORK TOOL':
                    case "I NEED A WORK TOOL FOR AN EXCAVATOR":
                    case "I NEED A WORK TOOL FOR A THREE TWENTY":
                    case "I NEED A WORK TOOL FOR A THREE TWENTY D":
                    case "I NEED A WORK TOOL FOR A THREE TWENTY D EXCAVATOR":
                    case "I NEED A WORK TOOL FOR EXCAVATOR SERIAL NUMBER P H X ZERO ZERO ONE ZERO ONE":
                    case "I NEED A WORKTOOL FOR EXCAVATOR SERIAL NUMBER P H X ZERO ZERO ONE ZERO ONE":
                    case "I NEED A WORK TOOL FOR CUSTOMER JOHN F JENKINS":
                        if ((title.trim() == "Please select what do you want to quote:") && 
                        (namespace.trim() == "ConversationTree-Options"))
                            cr_result = 'PASS'
                            return cr_result;
                        ;;
                    case "I NEED A BUCKET":
                    case "I NEED A HEAVY DUTY BUCKET":
                    case "I NEED A THIRTY SIX INCH HEAVY DUTY BUCKET":
                    case "I NEED A FOUR HUNDRED FIFTY MILLIMETER HEAVY DUTY BUCKET":
                    case "I NEED A FOUR HUNDRED FIFTY MILLIMETER HEAVY DUTY BUCKET YOU HAVE IN STOCK":
                        if ((title.trim() == "Please identify your machine.") && 
                        (namespace.trim() == "ConversationTree-InputTextField"))
                            cr_result = 'PASS'
                            return cr_result;
                        ;;
                    case "I NEED A BUCKET FOR A MACHINE WITH A P H X PREFIX":
                    case "I NEED A BUCKET FOR P H X ZERO ZERO NINE THREE SIX":
                    case "I NEED A BUCKET FOR A THREE TWENTY D L":
                        if ((title.trim() == "Select the configuration of your machine:") && 
                        (json.message.content[0].namespace == "ConversationTree-Options"))
                            cr_result = 'PASS'
                            return cr_result;
                        ;;
                    case "I NEED A BUCKET FOR A THREE TWENTY":
                        if ((title.trim() == "Please select the model of your machine:") && 
                        (namespace.trim() == "ConversationTree-Options"))
                            cr_result = 'PASS'
                            return cr_result;
                        ;;
                    case "I NEED A BUCKET FOR MINI HEX SERIAL NUMBER F J X ONE ONE FIVE ONE ONE":
                        for(let i=0;i<5;i++) {
                            if (json.message.content[1].data.knowledge[i].entity == "serial_number") 
                            {
                                 knowledge_value =  json.message.content[1].data.knowledge[i].value;
                                 break;
                            }
                        }
                        if ((knowledge_value.trim() == "fjx11511") && 
                        (namespace.trim() == "StellaLoadingScreen"))
                            cr_result = 'PASS'
                            return cr_result;
                        ;;
                    default:
                        ;;
                }
            }
        }
    }

    return cr_result;
}

function gethyperlink(wavFile)
{
    let hyperlinkHead = "=HYPERLINK(\"";
    let hyperlinkTail = "\")";
    return hyperlinkHead.concat(wavFile, hyperlinkTail);
}

const writeToFileVoice = async function (ID, wavFile, rptFile, utterance, asrOutput, asrVendor, asrResult, crResult)
{
    let file = fs.createWriteStream(rptFile, {flags: 'a'});
    let wavFileLink = gethyperlink(wavFile);
    console.log('WAV FILE LINK: ', wavFileLink);
    let overall = 'FAIL'
    if ((asrResult == 'PASS') && (crResult == 'PASS'))
        overall = 'PASS'
    let output = ID.concat(',', wavFileLink, ',', utterance, ',', asrOutput, ',', asrVendor, ',', asrResult, ',', crResult, ',', overall, '\n');
    file.write(output, (err) => {
        if(err) {
            console.log(err.message);
        } else {
            console.log('Data written successfully');
        }
    });
    file.end();
}   

const writeToFileText = async function(text, rptFile, crResult)
{
    let file = fs.createWriteStream(rptFile, {flags: 'a'});
    let overall = 'FAIL'
    if (crResult == 'PASS')
        overall = 'PASS'
    let output = text.concat(',', crResult, ',', overall, '\n');
    file.write(output, (err) => {
        if(err) {
            console.log(err.message);
        } else {
            console.log('Data written successfully');
        }
    });
    file.end();
}   


exports.WSS_API = WSS_API;
exports.getGrpFromWavFile = getGrpFromWavFile;
exports.getASROutput = getASROutput;
exports.getASRVendor = getASRVendor;
exports.getIDFromWavFile = getIDFromWavFile;
exports.wavfileMapToUtterance = wavfileMapToUtterance;
exports.checkResponse = checkResponse;
exports.gethyperlink = gethyperlink;
exports.writeToFileVoice = writeToFileVoice;
exports.writeToFileText = writeToFileText;
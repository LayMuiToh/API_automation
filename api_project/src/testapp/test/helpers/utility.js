const path = require('path')
const fs = require('fs')

let requestId = 1;

function getNextRequestId() {
    requestId ++;
    return requestId
}

function buildSessionData(sessionId, userId, appId, orgId, tenantId) {
    var o = {
        sessionId,
        userId,
        appId,
        orgId,
        tenantId
    }
    var s = JSON.stringify(o);
    let buff = Buffer.from(s);
    let base64data = buff.toString('base64');
    return base64data
}

function getPath(file, folder) {
    let currentPath = process.cwd()
    let result = currentPath + path.sep  + folder + path.sep + file
    console.log('Get', folder, 'filepath', result)
    return result
}


exports.getNextRequestId = getNextRequestId;
exports.buildSessionData = buildSessionData;
exports.getPath = getPath;


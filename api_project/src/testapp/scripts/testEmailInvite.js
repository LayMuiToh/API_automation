const utility = require('../utility')
const fs = require('fs')
const assert = require('assert');
const { CONSTANTS } = require('../constants')
const argv = require('yargs').argv
const axios = require('axios');


let email = "em" + new Date().getTime() + "@mailsac.com";
console.log('Generating testing email : ' + email)

const API = require('../api/index')
const IM = new API.identityManager(config)

async function test(email) {

    let inviteResponse = await IM.inviteWithSessionData("abc===",
        "XXX", "xxxx", "xx.xxxxx.xxxxx-xxx", "HQFLfCMzs1pr8wSbGn3D",
        "HySH7irTdAHuoZIcqZAI3QU5",
        email, email)
    console.log('invite response is', inviteResponse)

    if (inviteResponse.status != 200) {
        throw new Error("status unexpected!")
    }

    await utility.timeout(5000)

    let emailId = await getEmailId(email)

    if (emailId == null) {
        return -1;
    }
    let link = await getLink(email, emailId)
    return

}

// Call mailsac api to get the link from email
async function getLink(email, id) {
    let url = `https://mailsac.com/api/text/${email}/${id}`
    const response = await axios.get(url)
        .catch(function (response) {
        //handle error
        console.error(response.code, response.data);
    })
    if (response == null) {
        return null;
    }
    if (response.status != 200) {
        console.error(response.status, response.data);
    }
    console.log('Get email ok', response.data)

    let txt = response.data
    let lines = txt.split("\n");
    let invitationCode = ''
    for (let i in lines) {
        console.log(`[${i}] ` + lines[i])
        invitationCode = parseUrl(lines[i])
        if (invitationCode != null) {
            break;
        }
    }
    if (invitationCode == null) {
        console.error('No invitation code found. ')
        return -1;
    }
    console.log('>>> invitation code =', invitationCode)

    let redeemResponse = await redeem(invitationCode);
    if (redeemResponse == null) {
        console.error('Redeem failed')
        return -1
    }
    return 0
}

async function redeem(code) {
    let response = await IM.redeem(code)
    if (response != null) {
        console.log('>>> Redeem ok', response)
    }
}

function parseUrl(line) {
    let reg = /\[https:\/\/([0-9a-zA-Z-\/_\.]+)\]\[[\w_:\-\.]+\]/m
    let group = line.match(reg)
    if (group == null) {
        return null
    }
    console.log(group.length)
    if (group[1] == null) {
        return null
    }
    console.log(" >>> " + group[1])
    let list = group[1].split(/\/+/)
    if (list.length == 0) {
        return null
    }
    let token = list[list.length - 1]
    console.log(token)
    let jwt = token.split(/\./)
    console.log(jwt[1])
   // let o = window.atob(jwt[1]);
    let j = Buffer.from(jwt[1], 'base64').toString();
    let json = JSON.parse(j);
    console.log(json);
    return json["invitationCode"]
}

// Call mailsac api to get the email id
async function getEmailId(email) {
    let url = `https://mailsac.com/api/addresses/${email}/messages`
    console.log('get emails from', url)
    const response = await axios.get(url)
        .catch(function (response) {
            //handle error
            console.error(response.code, response.data);
        })
    if (response == null) {
        return null;
    }
    if (response.status != 200) {
        console.error(response.status, response.data);
    }
    console.log('List email ok', response.status, 'length =', response.data.length)
    let emails = response.data
    console.log('email length = ', emails.length)
    if (emails.length != 1) {
        return;
    }

    let id = emails[0]["_id"]
    console.log(">> Get email id", id)
    return id
}

/**
 * Remove all emails
 */
async function clear(email) {
    let url = `https://mailsac.com/api/addresses/${email}/messages`
    const response = await axios.get(url)
        .catch(function (response) {
            //handle error
            console.error(response.code, response.data);
            return null;
        })
    if (response == null) {
        return null;
    }
    if (response.status != 200) {
        console.error(response.status, response.data);
        return null;
    }
    console.log('List email ok', response.status, 'length =', response.data.length)
    let emails = response.data
    console.log('email length = ', emails.length)
    for (let i in emails) {
        let id = emails[i]["_id"]
        let url = `https://mailsac.com/api/addresses/${email}/messages/${id}`
        let deleteResponse = await axios.delete(url)
            .catch(function (response) {
                //handle error
                console.error(response.code, response.data);
                return null;
            })
        if (deleteResponse != null) {
            console.log("Delete", id, deleteResponse.status)
        }
    }
}

//   Main entrance here
//
//   This script will do:
//   1. create a random email account at mailsac.com
//   2. send an invite email there.
//   3. List emails for the email account by RESTFUL API (See mailsac.com api docs)
//   4. Get the email (I assume that only one email in the account)
//   5. Parse the invitation link from email body
//   6. Parse the jwt token, get the invite code
//   7. Call /invite/check to redeem the code, check the response (Expected: status = 200 )
//   8. Clear all emails from the mailsac.com email account.

(async function()
{
    await test(email);
    await clear(email);
})()

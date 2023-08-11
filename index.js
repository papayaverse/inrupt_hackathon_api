const express = require("express");
const cookieSession = require("cookie-session");
const Web3 = require('web3');
const QS = require('qs');

const { 
  getSessionFromStorage,
  getSessionIdFromStorageAll,
  Session
} = require("@inrupt/solid-client-authn-node");

const { handleIncomingRedirect, login, fetch, getDefaultSession } = require('@inrupt/solid-client-authn-browser');

const { SDK, Auth, TEMPLATES, Metadata } = require('@infura/sdk') ;

const {
    getSolidDataset,
    getThing,
    getPodUrlAll,
    saveFileInContainer, 
    getSourceUrl,
    overwriteFile,
    getFile,
    getSolidDatasetWithAcl,
    hasResourceAcl,
    hasFallbackAcl,
    hasAccessibleAcl,
    createAcl,
    createAclFromFallbackAcl,
    getResourceAcl,
    setAgentResourceAccess,
    setPublicResourceAccess,
    getContainedResourceUrlAll,
    saveAclFor,
    universalAccess,
    addUrl,
    addBoolean,
    addStringNoLocale,
    createSolidDataset,
    createThing,
    setThing,
    saveSolidDatasetAt,
    buildThing
} = require("@inrupt/solid-client");

const { SCHEMA_INRUPT } = require("@inrupt/vocab-common-rdf");

const app = express();
const port = 3000;
const deployUrl = `https://papaya-inrupt-hack-api.herokuapp.com`;
const avalancheUrl = `https://avalanche-fuji.infura.io/v3/85e35e212e7c431a838571e469b3c64b`;

// The following snippet ensures that the server identifies each user's session
// with a cookie using an express-specific mechanism
app.use(
  cookieSession({
    name: "session",
    // These keys are required by cookie-session to sign the cookies.
    keys: [
      "Required, but value not relevant for this demo - key1",
      "Required, but value not relevant for this demo - key2",
    ],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);


app.get("/login", async (req, res, next) => {
  // 1. Create a new Session
  const session = new Session();
  req.session.sessionId = session.info.sessionId;
  const redirectToSolidIdentityProvider = (url) => {
    // Since we use Express in this example, we can call `res.redirect` to send the user to the
    // given URL, but the specific method of redirection depend on your app's particular setup.
    // For example, if you are writing a command line app, this might simply display a prompt for
    // the user to visit the given URL in their browser.
    res.redirect(url);
  };
  // 2. Start the login process; redirect handler will handle sending the user to their
  //    Solid Identity Provider.
  await session.login({
    // After login, the Solid Identity Provider will send the user back to the following
    // URL, with the data necessary to complete the authentication process
    // appended as query parameters:
    redirectUrl: `${deployUrl}/redirect-from-solid-idp`,
    // Set to the user's Solid Identity Provider; e.g., "https://login.inrupt.com" 
    oidcIssuer: "https://login.inrupt.com",
    // Pick an application name that will be shown when asked 
    // to approve the application's access to the requested data.
    clientName: "Papaya Data Bank API",
    handleRedirect: redirectToSolidIdentityProvider,
  });
});



app.get("/alt/login", async (req, res, next) => {
    // 1. Create a new Session
    const session = new Session();
    session.login({
  // 2. Use the authenticated credentials to log in the session.
    clientId: "cc2c86f8-8771-4749-9d8a-e15682741176",
    clientSecret: "8a95b5f1-86e7-45d2-9eb2-248d416fa73c",
    oidcIssuer: "https://login.inrupt.com"
    }).then(() => {
  if (session.info.isLoggedIn) {
    // 3. Your session should now be logged in, and able to make authenticated requests.
    session
      // You can change the fetched URL to a private resource, such as your Pod root.
      .fetch(session.info.webId)
      .then((response) => {
        return res.json(response);
      })
      .then(console.log);
  }
});
  });

app.get("/redirect-from-solid-idp", async (req, res) => {
  // 3. If the user is sent back to the `redirectUrl` provided in step 2,
  //    it means that the login has been initiated and can be completed. In
  //    particular, initiating the login stores the session in storage, 
  //    which means it can be retrieved as follows.
  const session = await getSessionFromStorage(req.session.sessionId);

  // 4. With your session back from storage, you are now able to 
  //    complete the login process using the data appended to it as query
  //    parameters in req.url by the Solid Identity Provider:
  await session.handleIncomingRedirect(`${deployUrl}${req.url}`);
  // back at it

  // 5. `session` now contains an authenticated Session instance.
  if (session.info.isLoggedIn) {
    const podUrl = await getPodUrlAll(session.info.webId);
    return res.send(`<p>Logged in with the WebID ${session.info.webId}. The podUrl(s) : ${podUrl}</p>`)
  }
});

// 6. Once you are logged in, you can retrieve the session from storage, 
//    and perform authenticated fetches.
app.get("/fetch", async (req, res, next) => {
  if(typeof req.query["resource"] === "undefined") {
    res.send(
      "<p>Please pass the (encoded) URL of the Resource you want to fetch using `?resource=&lt;resource URL&gt;`.</p>"
    );
  }
  const session = await getSessionFromStorage(req.session.sessionId);
  console.log(await (await session.fetch(req.query["resource"])).text());
  res.send("<p>Performed authenticated fetch.</p>");
});

app.get("/fetchTestImage", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const imgUrl = podUrl[0] + "testFolder/portal.png";
        console.log(await (await session.fetch(imgUrl)).text());
        return res.send(`<p>Performed authenticated fetch.</p> <p> <img src="${imgUrl}" width=500 height=600> </p>`)
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

app.get("/fetchTestText", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const textUrl = podUrl[0] + "testFolder/testyText.txt";
        const testText = await (await session.fetch(textUrl)).text();
        console.log(testText);
        return res.send(`<p>Performed authenticated fetch of ${textUrl}.</p> <p> ${testText} </p>`)
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// created FakeNetflix meant to represent a company wanting to access data of users using our API
app.get("/fetchFakeNetflixWalletAddress", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll("https://id.inrupt.com/fakenetflix");
        const textUrl = podUrl[0] + "testFolder/papayaWallet/wallet/avalanche/walletAddress.txt";
        const testText = await (await session.fetch(textUrl)).text();
        console.log(testText);
        return res.json({fakeNetflixWalletAddress: testText});
    }
    else {
        return res.json({err: "Not logged in."});
    }
});

app.get("/writeTestText2", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const textUrl = podUrl[0] + "testFolder/testyText2.txt";
        const testText = "This is a test of writing to a file. Test text 2";
        const filedata = Buffer.from(testText, 'utf8');
        // Block to Write File
        try {
            const savedFile = await overwriteFile(  
              textUrl,                   // URL for the file.
              filedata,                        // Buffer containing file data
              { contentType: 'text/plain', fetch: session.fetch } // mimetype if known, fetch from the authenticated session
            );
            console.log(`File saved at ${getSourceUrl(savedFile)}`);
        } catch (error) {
            console.error(error);
            return res.send(`<p>Failed to write to ${textUrl}.</p>`)
        }
        return res.send(`<p>Performed authenticated write to ${textUrl}.</p>`)
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

app.get("/makeWalletAddressPublic", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const textUrl = podUrl[0] + "testFolder/papayaWallet/wallet/avalanche/walletAddress.txt";
        // Block to make file public
        makePublicRead(textUrl, session);
        res.send("<p>Check Logs to See if File is Public Readable</p>")
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// UTILS TO HELP ME

async function saveTextFile(fileUrl, text, session) {
    filedata = Buffer.from(text, 'utf8');
    try {
        const savedFile = await overwriteFile(  
          fileUrl,                   // URL for the file.
          filedata,                        // Buffer containing file data
          { contentType: 'text/plain', fetch: session.fetch } // mimetype if known, fetch from the authenticated session
        );
        console.log(`File saved at ${getSourceUrl(savedFile)}`);
    } catch (error) {
        console.error(error);
    }
}


async function makePublicRead(resourceUrl, session) {
    universalAccess.setPublicAccess(
        resourceUrl,  // Resource
        { read: true, write: false },    // Access object
        { fetch: session.fetch }                 // fetch function from authenticated session
      ).then((newAccess) => {
        if (newAccess === null) {
          console.log("Could not load access details for this Resource.");
        } else {
          console.log("Returned Public Access:: ", JSON.stringify(newAccess));
        }
      });
}

async function makeAgentReadAndAppend(resourceUrl, agentUrl, session) {
    universalAccess.setAgentAccess(
        resourceUrl,  // Resource
        agentUrl,    // Agent
        { read: true, write: false, append: true},    // Access object
        { fetch: session.fetch }                 // fetch function from authenticated session
        ).then((newAccess) => {
        if (newAccess === null) {
            console.log("Could not load access details for this Resource.");
        } else {
            console.log("Returned Agent Access:: ", JSON.stringify(newAccess));
        }
    });
}



// WALLET MODULE

app.get("/wallet", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        // STEP1: Connect to Avalanche Network
        const web3 = new Web3(avalancheUrl);
        console.log("Connected to Avalanche Network")
        // STEP2: Get Wallet Address
        const walletFolderUrl = podUrl[0] + "testFolder/papayaWallet/wallet/avalanche/";
        const walletAddressFileUrl = walletFolderUrl + "walletAddress.txt";
        const walletPrivateKeyFileUrl = walletFolderUrl + "walletPrivateKey.txt";
        try {
            // Already have a wallet
            const walletAddressBlob = await getFile(walletAddressFileUrl, {fetch: session.fetch});
            const walletAddress = await walletAddressBlob.text();
            console.log("Wallet Address: " + walletAddress);
            console.log("Wallet Balance: ");
            web3.eth.getBalance(walletAddress).then(console.log);
            balance = await web3.eth.getBalance(walletAddress);
            return res.send(`<p> ID: ${session.info.webId} </p> <p>Wallet Address: ${walletAddress}.</p> <p> Balance : ${balance} nAVAX</p>`)
        }
        catch (error) {
            console.error(error);
            // Need to Create New Wallet
            new_account = web3.eth.accounts.create();
            console.log(new_account);
            await saveTextFile(walletAddressFileUrl, new_account.address, session);
            await saveTextFile(walletPrivateKeyFileUrl, new_account.privateKey, session);
            makePublicRead(walletAddressFileUrl, session);
            return res.send(`<p> Created New Wallet at ${new_account.address}.</p>`)
        }

    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// NFT display page

app.get("/wallet/nfts", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        // STEP1: Connect to Avalanche Network
        const web3 = new Web3(avalancheUrl);
        console.log("Connected to Avalanche Network")
        // STEP2: Get Wallet Address
        const walletFolderUrl = podUrl[0] + "testFolder/papayaWallet/wallet/avalanche/";
        const walletAddressFileUrl = walletFolderUrl + "walletAddress.txt";
        //const walletPrivateKeyFileUrl = walletFolderUrl + "walletPrivateKey.txt";
        // Must Already have a wallet
        const walletAddressBlob = await getFile(walletAddressFileUrl, {fetch: session.fetch});
        const walletAddress = await walletAddressBlob.text();
        console.log("Wallet Address: " + walletAddress);
        const walletPrivateKeyFileUrl = walletFolderUrl + "walletPrivateKey.txt";
        const walletPrivateKeyBlob = await getFile(walletPrivateKeyFileUrl, {fetch: session.fetch});
        const walletPrivateKey = await walletPrivateKeyBlob.text();
        const auth = new Auth({
            projectId: "85e35e212e7c431a838571e469b3c64b",
            secretId: "67760e3a23204a7e84a170d1364e33c0",
            privateKey: walletPrivateKey,
            chainId: 43113,
        });
        const sdk = new SDK(auth);
        const result = await sdk.api.getCollectionsByWallet({
            walletAddress: walletAddress,
        });
        console.log(result);
        return res.send(`<p> ID: ${session.info.webId} </p> <p>Wallet Address: ${walletAddress}.</p> <p> NFTs : ${JSON.stringify(result)} </p>`)
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// Transaction module
var transaction_counter = 0;
app.get("/transaction/:toAccount/:Amount", async (req, res, next) => {
  const session = await getSessionFromStorage(req.session.sessionId);
  const podUrl = await getPodUrlAll(session.info.webId);
  const web3 = new Web3(avalancheUrl);
  const toAccount = req.params.toAccount;
  const Amount = req.params.Amount;
  console.log(`toAccount=${toAccount}`);
  console.log(`Amount=${Amount}`);

  const walletFolderUrl = podUrl[0] + "testFolder/papayaWallet/wallet/avalanche/";
  const walletAddressFileUrl = walletFolderUrl + "walletAddress.txt";
  const walletPrivateKeyFileUrl = walletFolderUrl + "walletPrivateKey.txt";

  try {
    const walletAddressBlob = await getFile(walletAddressFileUrl, { fetch: session.fetch });
    const walletAddress = await walletAddressBlob.text();
    const walletPrivateKeyBlob = await getFile(walletPrivateKeyFileUrl, {fetch: session.fetch});
    const walletPrivateKey = await walletPrivateKeyBlob.text();

    const toWebId = `https://id.inrupt.com/${toAccount}`;
    const toPodUrl = await getPodUrlAll(toWebId);
    const toAccountWalletUrl = toPodUrl[0] + "testFolder/papayaWallet/wallet/avalanche/walletAddress.txt";
    const toWalletAddress = await (await session.fetch(toAccountWalletUrl)).text();
    
    walletBalance = await web3.eth.getBalance(walletAddress);
    console.log(`Wallet Balance: ${walletBalance}`);

    transaction_counter += 1
    const nonce = await web3.eth.getTransactionCount(walletAddress);
    var transaction = await web3.eth.accounts.signTransaction({
      from: walletAddress, //My hex
      nonce: nonce,
      gasPrice: '25000000000',
      gas: '21000',
      to: toWalletAddress, //Fake netflix
      value: Amount,
      data: "",
    }, walletPrivateKey);
    var tx_res = transaction.rawTransaction;
    //console.log(`tx = ${tx_res}`);
    var bdy = `<p>Thank you for contributing ${transaction_counter} transactions.</p>`;
    web3.eth.sendSignedTransaction(tx_res)
    .on('error', console.error)
    .on('transactionHash', function(hash) {
      console.log(`tx hash=${hash}`);
      bdy = bdy + `<p> Hash = ${hash} </p>`;
    })
    .on('receipt', function(receipt) {
      bdy = bdy + `<p> Receipt = ${receipt} </p>`;
    });
    return res.send(bdy)
  }
  catch (error) {
    return res.send(`Woops - we had an error ${error}`)
  }

});  


// DATA MODULE

// Show Data
app.get("/data", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const dataFolderUrl = podUrl[0] + "testFolder/papayaData/";
        const dataAsSolidDataset = await getSolidDataset(dataFolderUrl, { fetch: session.fetch });
        const dataWithin = await getContainedResourceUrlAll(dataAsSolidDataset);
        return res.send("<p> ID: " + session.info.webId + " </p> <p> Data Folder: " + dataWithin + " </p>");
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// Show Data of a Company

app.get("/data/:company", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    const companyName = req.params.company;
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const dataFolderUrl = podUrl[0] + "testFolder/papayaData/" + companyName + "/";
        const dataAsSolidDataset = await getSolidDataset(dataFolderUrl, { fetch: session.fetch });
        const dataWithin = await getContainedResourceUrlAll(dataAsSolidDataset);
        return res.send("<p> ID: " + session.info.webId + " </p> <p> Data of " + companyName + " : " + dataWithin + " </p>");
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// Get Data Sharing Preferences
app.get("/data/:company/sharingPreferences", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    const companyName = req.params.company;
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const dataFolderUrl = podUrl[0] + "testFolder/papayaData/" + companyName + "/";
        const sharingPreferencesUrl = dataFolderUrl + "sharingPreferences";
        try {
            const sharingAsSolidDataset = await getSolidDataset(sharingPreferencesUrl, { fetch: session.fetch });
            console.log(sharingAsSolidDataset);
            let sharingBasic = getThing(sharingAsSolidDataset, sharingPreferencesUrl + "#basic");
            let sharingPersonalization = getThing(sharingAsSolidDataset, sharingPreferencesUrl + "#personalization");
            let sharingThirdParty = getThing(sharingAsSolidDataset, sharingPreferencesUrl + "#thirdParty");
            let basic = sharingBasic.predicates["http://schema.org/value"]["literals"]["http://www.w3.org/2001/XMLSchema#boolean"][0];
            let personalization = sharingPersonalization.predicates["http://schema.org/value"]["literals"]["http://www.w3.org/2001/XMLSchema#boolean"][0];
            let thirdParty = sharingThirdParty.predicates["http://schema.org/value"]["literals"]["http://www.w3.org/2001/XMLSchema#boolean"][0];
            console.log(basic);
            console.log(personalization);
            console.log(thirdParty);
            return res.send(`<p> ID: ${session.info.webId}   </p> <p> Data of  ${companyName}  </p> <p> Sharing Preferences: Basic: ${basic}, Personalization: ${personalization}, Third Party: ${thirdParty}  </p> `)
        }
        catch(e) {
            return res.send(`<p> ID: ${session.info.webId}   </p> <p> Data of  ${companyName}  </p> <p> Sharing Preferences: ${e.name} </p> `)
        }
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// Set Data Sharing Preferences

app.get("/data/:company/testSettingSharingPreferences", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    const companyName = req.params.company;
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const dataFolderUrl = podUrl[0] + "testFolder/papayaData/" + companyName + "/";
        const sharingPreferencesUrl = dataFolderUrl + "sharingPreferences";
        const sharingPreferences = {basic: true, personalization: true, thirdParty: true};
        try {
            let sharingAsSolidDataset = await getSolidDataset(sharingPreferencesUrl, { fetch: session.fetch });
            let sharingBasic = getThing(sharingAsSolidDataset, sharingPreferencesUrl + "#basic");
            let sharingPersonalization = getThing(sharingAsSolidDataset, sharingPreferencesUrl + "#personalization");
            let sharingThirdParty = getThing(sharingAsSolidDataset, sharingPreferencesUrl + "#thirdParty");
            sharingBasic = setBoolean(sharingBasic, "http://schema.org/value", sharingPreferences.basic);
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingBasic);
            sharingPersonalization = setBoolean(sharingPersonalization, "http://schema.org/value", sharingPreferences.personalization);
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingPersonalization);
            sharingThirdParty = setBoolean(sharingThirdParty, "http://schema.org/value", sharingPreferences.thirdParty);
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingThirdParty);
            const savedSharingDataset = await saveSolidDatasetAt(sharingPreferencesUrl, sharingAsSolidDataset, { fetch: session.fetch });
        }
        catch(e) {
            let sharingAsSolidDataset = createSolidDataset();
            const sharingBasic = buildThing(createThing({ name: "basic" }))
            .addBoolean("http://schema.org/value", sharingPreferences.basic)
            .build();
            const sharingPersonalization = buildThing(createThing({ name: "personalization" }))
            .addBoolean("http://schema.org/value", sharingPreferences.personalization)
            .build();
            const sharingThirdParty = buildThing(createThing({ name: "thirdParty" }))
            .addBoolean("http://schema.org/value", sharingPreferences.thirdParty)
            .build();
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingBasic);
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingPersonalization);
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingThirdParty);
            const savedSharingDataset = await saveSolidDatasetAt(sharingPreferencesUrl, sharingAsSolidDataset, { fetch: session.fetch });

        }
        makePublicRead(sharingPreferencesUrl, session);
        let sharingAsSolidDataset = await getSolidDataset(sharingPreferencesUrl, { fetch: session.fetch });
        return res.send(`<p> ID: ${session.info.webId}   </p> <p> Data of  ${companyName}  </p> <p> Sharing Preferences: ${JSON.stringify(sharingPreferences)} </p> `)
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

app.post("/data/:company/setSharingPreferences", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    const companyName = req.params.company;
    const sharingPreferences = req.body.sharingPreferences;
    //of the form const sharingPreferences = {basic: true, personalization: true, thirdParty: true};
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const dataFolderUrl = podUrl[0] + "testFolder/papayaData/" + companyName + "/";
        const sharingPreferencesUrl = dataFolderUrl + "sharingPreferences";
        try {
            let sharingAsSolidDataset = await getSolidDataset(sharingPreferencesUrl, { fetch: session.fetch });
            let sharingBasic = getThing(sharingAsSolidDataset, sharingPreferencesUrl + "#basic");
            let sharingPersonalization = getThing(sharingAsSolidDataset, sharingPreferencesUrl + "#personalization");
            let sharingThirdParty = getThing(sharingAsSolidDataset, sharingPreferencesUrl + "#thirdParty");
            sharingBasic = setBoolean(sharingBasic, "http://schema.org/value", sharingPreferences.basic);
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingBasic);
            sharingPersonalization = setBoolean(sharingPersonalization, "http://schema.org/value", sharingPreferences.personalization);
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingPersonalization);
            sharingThirdParty = setBoolean(sharingThirdParty, "http://schema.org/value", sharingPreferences.thirdParty);
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingThirdParty);
            const savedSharingDataset = await saveSolidDatasetAt(sharingPreferencesUrl, sharingAsSolidDataset, { fetch: session.fetch });
        }
        catch(e) {
            let sharingAsSolidDataset = createSolidDataset();
            const sharingBasic = buildThing(createThing({ name: "basic" }))
            .addBoolean("http://schema.org/value", sharingPreferences.basic)
            .build();
            const sharingPersonalization = buildThing(createThing({ name: "personalization" }))
            .addBoolean("http://schema.org/value", sharingPreferences.personalization)
            .build();
            const sharingThirdParty = buildThing(createThing({ name: "thirdParty" }))
            .addBoolean("http://schema.org/value", sharingPreferences.thirdParty)
            .build();
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingBasic);
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingPersonalization);
            sharingAsSolidDataset = setThing(sharingAsSolidDataset, sharingThirdParty);
            const savedSharingDataset = await saveSolidDatasetAt(sharingPreferencesUrl, sharingAsSolidDataset, { fetch: session.fetch });

        }
        makePublicRead(sharingPreferencesUrl, session.fetch);
        let sharingAsSolidDataset = await getSolidDataset(sharingPreferencesUrl, { fetch: session.fetch });
        return res.send(`<p> ID: ${session.info.webId}   </p> <p> Data of  ${companyName}  </p> <p> Sharing Preferences: ${JSON.stringify(sharingAsSolidDataset)} </p> `)
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// Share Data with a Company according to preferences

app.get("/data/:company1/showOwners", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    const companyName = req.params.company1;
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const walletFolderUrl = podUrl[0] + "testFolder/papayaWallet/wallet/avalanche/";
        const walletAddressFileUrl = walletFolderUrl + "walletAddress.txt";
        const walletPrivateKeyFileUrl = walletFolderUrl + "walletPrivateKey.txt";
        let dataFolderUrl = podUrl[0] + "testFolder/papayaData/" + companyName + "/";
        const contractAddressFileUrl = dataFolderUrl + "/tokens/contractAddress.txt";
        makePublicRead(dataFolderUrl + "/tokens/", session);
        const contractAddressBlob = await getFile(contractAddressFileUrl, { fetch: session.fetch });
        const contractAddress = await contractAddressBlob.text();
        const walletAddressBlob = await getFile(walletAddressFileUrl, { fetch: session.fetch });
        const walletAddress = await walletAddressBlob.text();
        const walletPrivateKeyBlob = await getFile(walletPrivateKeyFileUrl, {fetch: session.fetch});
        const walletPrivateKey = await walletPrivateKeyBlob.text();
        const auth = new Auth({
            projectId: "85e35e212e7c431a838571e469b3c64b",
            secretId: "67760e3a23204a7e84a170d1364e33c0",
            privateKey: walletPrivateKey,
            chainId: 43113,
            ipfs:{
                projectId: "2Ln9KuRdOfa4hTWnUdf39vvM0mb",
                apiKeySecret: "4710efb8686ff12bba254795aff6bb97",
            }
        });
        const sdk = new SDK(auth);
        const owners = await sdk.api.getOwnersbyContractAddress({
            contractAddress: contractAddress
        });
        makeAgentReadAndAppend(dataFolderUrl, "https://id.inrupt.com/fakenetflix", session);
        res.send(`<p> ID: ${session.info.webId}   </p> <p> Data of  ${companyName}  </p> <p> Owners: ${JSON.stringify(owners)} </p> `);
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// Share Person's data generated by interacting with company1 with company2

app.get("/data/:company1/shareNft", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    const companyName = req.params.company1;
    const companyWebId = "https://id.inrupt.com/fake" + companyName;
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const walletFolderUrl = podUrl[0] + "testFolder/papayaWallet/wallet/avalanche/";
        const walletAddressFileUrl = walletFolderUrl + "walletAddress.txt";
        const walletPrivateKeyFileUrl = walletFolderUrl + "walletPrivateKey.txt";
        const walletAddressBlob = await getFile(walletAddressFileUrl, { fetch: session.fetch });
        const walletAddress = await walletAddressBlob.text();
        const walletPrivateKeyBlob = await getFile(walletPrivateKeyFileUrl, {fetch: session.fetch});
        const walletPrivateKey = await walletPrivateKeyBlob.text();
        let username = session.info.webId.split("com/")[1];
        const dataFolderUrl = podUrl[0] + "testFolder/papayaData/" + companyName + "/";
        const sharingPreferencesUrl = dataFolderUrl + "/sharingPreferences";
        const sharingPreferencesDataset = await getSolidDataset(sharingPreferencesUrl, { fetch: session.fetch });
        let sharingThirdParty = getThing(sharingPreferencesDataset, sharingPreferencesUrl + "#thirdParty");
        let thirdPartyPref = sharingThirdParty.predicates["http://schema.org/value"]["literals"]["http://www.w3.org/2001/XMLSchema#boolean"][0];
            if((thirdPartyPref == "true")){ 
                tokenData = {
                    name: "Green papaya NFT for sharing data of " + username + " generated by interacting with " + companyName,
                    description: "NFT DATA SHARING",
                    image: "https://static.wixstatic.com/media/d239fd_1a4facf763df4c7eb1f87c0ae09a94b4~mv2.png/v1/fill/w_436,h_436,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/5-removebg-preview.png",
                    greenpapaya_data_link: dataFolderUrl,
                    greenpapaya_data_owner: session.info.webId,
                    greenpapaya_data_company: companyWebId,
                };
                // TO IMPLEMENT: CHECK IF ALREADY EXISTS
                // Upload the metadata
                const metadataFileUrl = dataFolderUrl + "/tokens/metadata.json";
                const metadataFile = new Blob([JSON.stringify(tokenData)], { type: "application/json" });
                const metadataFileUploaded = await overwriteFile(metadataFileUrl, metadataFile, { fetch: session.fetch });
                makePublicRead(metadataFileUrl, session);
                const auth = new Auth({
                    projectId: "85e35e212e7c431a838571e469b3c64b",
                    secretId: "67760e3a23204a7e84a170d1364e33c0",
                    privateKey: walletPrivateKey,
                    chainId: 43113,
                    ipfs:{
                        projectId: "2Ln9KuRdOfa4hTWnUdf39vvM0mb",
                        apiKeySecret: "4710efb8686ff12bba254795aff6bb97",
                    }
                });
                const sdk = new SDK(auth);
                const collectionMetadata = Metadata.openSeaCollectionLevelStandard(tokenData);
                const linkMetadata = await sdk.storeMetadata({ metadata: collectionMetadata });
                const GreenPapayaContract = await sdk.deploy({
                    template: TEMPLATES.ERC721UserMintable,
                    params: {
                        name: "GreenPapaya",
                        symbol: "GP",
                        baseURI: linkMetadata,
                        contractURI: linkMetadata,
                        maxSupply: 10000,
                        price: "0.002",
                        maxTokenRequest: 1,
                    },
                });
                console.log('Contract: ', GreenPapayaContract.contractAddress);
                const tx = await GreenPapayaContract.toggleSale();
                const sale = await tx.wait();
                console.log('Sale: ', sale);
                const contractAddressFileUrl = dataFolderUrl + "/tokens/contractAddress.txt";
                const contractAddressFile = new Blob(["" + GreenPapayaContract.contractAddress], { type: "text/plain" });
                let contractFileUploaded = await overwriteFile(contractAddressFileUrl, contractAddressFile, { fetch: session.fetch });
                makePublicRead(contractAddressFileUrl, session);
                return res.send("<p> Data of " + username + " generated by interacting with " + companyName + " is now shared via NFT at " + GreenPapayaContract.contractAddress + ".</p> <p>" + sale + "</p>");
            }
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// LET Logged In company ACCESS DATA OF username GENERATED BY INTERACTING WITH COMPANY2

app.get("/data/:username/accessNft/:company2", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    const userName = req.params.username;
    const userWebId = "https://id.inrupt.com/" + userName;
    const company2Name = req.params.company2;
    const company2WebId = "https://id.inrupt.com/fake" + company2Name;
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const userPod = await getPodUrlAll(userWebId);
        const walletFolderUrl = podUrl[0] + "testFolder/papayaWallet/wallet/avalanche/";
        const walletAddressFileUrl = walletFolderUrl + "walletAddress.txt";
        const walletPrivateKeyFileUrl = walletFolderUrl + "walletPrivateKey.txt";
        const walletAddressBlob = await getFile(walletAddressFileUrl, { fetch: session.fetch });
        const walletAddress = await walletAddressBlob.text();
        const walletPrivateKeyBlob = await getFile(walletPrivateKeyFileUrl, {fetch: session.fetch});
        const walletPrivateKey = await walletPrivateKeyBlob.text();
        let userNftAddress = await getFile(userPod[0] + "testFolder/papayaData/" + company2Name + "/tokens/contractAddress.txt", { fetch: session.fetch });
        userNftAddress = await userNftAddress.text();
        const auth = new Auth({
            projectId: "85e35e212e7c431a838571e469b3c64b",
            secretId: "67760e3a23204a7e84a170d1364e33c0",
            privateKey: walletPrivateKey,
            chainId: 43113,
        });
        const sdk = new SDK(auth);
        const GreenPapayaContract = await sdk.loadContract({
            template: TEMPLATES.ERC721UserMintable,
            contractAddress: userNftAddress
        });
        // Mint
        const mintTx = await GreenPapayaContract.mint({
            quantity: 1,
            cost: "0.0025",
            tokenURI: session.info.webId,
        });
        const minted = await mintTx.wait();
        console.log('Mint Tx: ', minted);
        let companyname = session.info.webId.split("com/fake")[1];
        return res.send(`<p> Minted at ${JSON.stringify(minted)}. </p>`);
    }
    else {
        return res.send("<p>Not logged in.</p>");
    }
});

// Generate Some Fake Test Data

app.get("/generateHuluTestData", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const dataFolderUrl = podUrl[0] + "testFolder/papayaData/hulu/";
        for (let i = 1; i < 11; i++) {
            const dataFileUrl = dataFolderUrl + "movies_watched_2022_" + i + ".txt";
            const data = "Set It Up; Friends With Benefits; How to Lose a Guy in 10 days; Fast and Furious " + i;
            await saveTextFile(dataFileUrl, data, session);
        }
        return res.send(`<p> Generated Fake Hulu Data.</p>`)
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

app.get("/generateNetflixTestData", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const dataFolderUrl = podUrl[0] + "testFolder/papayaData/netflix/";
        for (let i = 1; i < 11; i++) {
            const dataFileUrl = dataFolderUrl + "movies_watched_2022_" + i + ".txt";
            const data = "Set It Up; Friends With Benefits; How to Lose a Guy in 10 days; Fast and Furious " + i;
            await saveTextFile(dataFileUrl, data, session);
        }
        return res.send(`<p> Generated Fake Netflix Data.</p>`)
    }
    else {
        return res.send("<p>Not logged in.</p>")
    }
});

// 7. To log out a session, just retrieve the session from storage, and 
//    call the .logout method.
app.get("/logout", async (req, res, next) => {
  const session = await getSessionFromStorage(req.session.sessionId);
  session.logout();
  res.send(`<p>Logged out.</p>`);
});

// 8. On the server side, you can also list all registered sessions using the
//    getSessionIdFromStorageAll function.
app.get("/", async (req, res, next) => {
  const sessionIds = await getSessionIdFromStorageAll();
  for(const sessionId in sessionIds) {
    // Do something with the session ID...
  }
  res.send(
    `<p>There are currently [${sessionIds.length}] visitors.</p>`
  );
});

app.listen(process.env.PORT || port, () => {
  console.log(
    `Server running on port. ` +
    `Visit [${deployUrl}/login] to log in to [login.inrupt.com].`
  );
});
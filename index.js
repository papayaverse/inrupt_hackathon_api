const express = require("express");
const cookieSession = require("cookie-session");
const Web3 = require('web3');

const { 
  getSessionFromStorage,
  getSessionIdFromStorageAll,
  Session
} = require("@inrupt/solid-client-authn-node");

const {
    getSolidDataset,
    getThing,
    getPodUrlAll,
    saveFileInContainer, 
    getSourceUrl,
    overwriteFile,
    getFile
} = require("@inrupt/solid-client");

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
    maxAge: 24 * 60 * 1000, // 24 minutes
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
    clientName: "Demo app",
    handleRedirect: redirectToSolidIdentityProvider,
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

app.get("/fetchTestText2", async (req, res, next) => {
    const session = await getSessionFromStorage(req.session.sessionId);
    if (session.info.isLoggedIn) {
        const podUrl = await getPodUrlAll(session.info.webId);
        const textUrl = podUrl[0] + "testFolder/testyText2.txt";
        const testText = await (await session.fetch(textUrl)).text();
        console.log(testText);
        return res.send(`<p>Performed authenticated fetch of ${textUrl}.</p> <p> ${testText} </p>`)
    }
    else {
        return res.send("<p>Not logged in.</p>")
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

// WALLET MODULE

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
            return res.send(`<p>Wallet Address: ${walletAddress}.</p> <p> Balance : ${balance} nAVAX</p>`)
        }
        catch (error) {
            console.error(error);
            // Need to Create New Wallet
            new_account = web3.eth.accounts.create();
            console.log(new_account);
            await saveTextFile(walletAddressFileUrl, new_account.address, session);
            await saveTextFile(walletPrivateKeyFileUrl, new_account.privateKey, session);
            return res.send(`<p> Created New Wallet at ${new_account.address}.</p>`)
        }
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
# inrupt_hackathon_api
Repo to create backend API for BravoVision Frontend using Inrupt JavaScript Client Libraries

[Link to BravoVision Frontend](https://bravostudioapp.page.link/?link=https%3A%2F%2Fapps-service.bravostudio.app%2Fdevices%2Fapps%2F01GW2XN76ADARD08R9Q747S4Z0&ofl=https%3A%2F%2Fbravostudio.app%2Fdownload-bravo-vision&apn=com.appfoundry.previewer&ibi=com.codelesslabs.app)

## AUTH

[Link to Inrupt Login Express Web Server](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/authenticate-nodejs-web-server/#example)

[Link to Configure Oauth2 Login With Bravo](https://docs.bravostudio.app/integrations/user-authentication/oauth2)

## DATA

Created a fake netflix account :  https://id.inrupt.com/fakenetflix
To show the data sharing capabilities with NFTs

## Deployment

Update: API succesfully deployed at https://papaya-inrupt-hack-api.herokuapp.com/

## API ENDPOINTS THAT SHOULD ACTUALLY BE USED NOT JUST FOR TESTING

Get /login for logging in and must change callback to bravo when integrated

Get /wallet to show balance and address

Get /wallet/nfts to show nfts owned

Get /data to show what companies' data you have

Get /data/companyName/sharingPreferences to show what your sharing Prefs are with that company

Post /data/company/setSharingPreferences with a body like
{someStuff, sharingPreferences: {basic: true, personalization: true, thirdParty: false}, someOtherStuff}

## Inrupt client reg

client id: cc2c86f8-8771-4749-9d8a-e15682741176
client secret: 8a95b5f1-86e7-45d2-9eb2-248d416fa73c
client name: Papaya Hack API associated with id.inrupt.com/rammkripa
token endpt: login.inrupt.com/token?
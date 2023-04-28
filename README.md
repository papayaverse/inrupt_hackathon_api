# inrupt_hackathon_api

Repo to create backend API for Papaya Data Bank using Inrupt JavaScript client libraries.

# Papaya Data Bank

## The Idea

The way we, as a society, handle consumer data is broken.
So called "Consent and Preference Management" tools are anti-consumer, designed to allow companies to continue to unethically harvest their users' data while complying with regulation.

The reality is that we, as end users, have no idea what's happening to our data and it is subject to unethical third party sharing practices.

Hence, we decided to form a new kind of institution known as a Data Bank.

## Architecture and Key Concepts

We use Solid Pods to store data generated on various sites with the user and, if the user consents to third party data sharing, then companies have to pay the users via minting NFTs to access the data.

The end user is able to control who has access to their data via this NFT platform.

This community has been quite outspoken against the world of "crypto" and "web3". However, we believe that the usage of NFTs here is far from a gimmick and serves two key purposes:

1) Creating an indelible record on the blockchain of users sharing their data.
2) Fairly compensating users for allowing companies to access to higher quality de-anonymized third party data if they choose to share it.

## The Implementation

Used Inrupt JS client libraries, as well as Web3.js and the Infura SDK to implement these functionalities.

## Sample Flow

1) We set up our pod (belonging to id.inrupt.com/ramtest) with some test data at 
podUrl/testFolder/papayaData/hulu/:someFiles
and podUrl/testFolder/papayaData/netflix/:someFiles
using the /data/generateNetflixTestData and /data/generateHuluTestData endpoints.
We use this to simulate actual companies sending data to pods
We also set up a wallet using the /wallet endpoint

2) Then, we set user sharing preferences through the /data/companyName/testSettingSharingPreferences end point. This would simulate either setting preferences through the [demo app](https://bravostudioapp.page.link/?link=https%3A%2F%2Fapps-service.bravostudio.app%2Fdevices%2Fapps%2F01GW2XN76ADARD08R9Q747S4Z0&ofl=https%3A%2F%2Fbravostudio.app%2Fdownload-bravo-vision&apn=com.appfoundry.previewer&ibi=com.codelesslabs.app) or through a Consent and Preference Management Pop Up on the site of choice.

3) We then use the /data/hulu/shareNft endpoint to deploy a contract based on sharing preferences of the user, since thirdParty was set to true.

4) Then, FakeNetflix logs in and uses the /data/ramtest/accessNft/hulu endpoint to mint an NFT representing access to ramtest's hulu data. FakeNetflix pays the contract and this currency can be withdrawn by ramtest at any time.

5) When Ramtest logs in and views the Owners of his hulu data using the /data/hulu/showOwners endpoint, he sees an Nft has been minted and while he is logged in, access is granted to FakeNetflix since its ownership has been confirmed.


## API ENDPOINTS

### Common to End Users and Companies

Get /login for logging in

Get /wallet to show balance and wallet address, or create a new one if it does not exist

Get /wallet/nfts to show nfts owned by the user

Get /transaction/:toAccount/:Amount to make a transaction, send currency using the wallet

### Data For End Users

Get /data to show what companies' data you have

Get /data/:companyName to show data you have generated with the companyName

Get /data/:companyName/sharingPreferences to show what your sharing Preferencess are with that company

Post /data/:companyName/setSharingPreferences with a request body containing a sharingPreferences query parameter with three booleans to represent the user's sharing preferences for basic, personalization, and third party data as seen below.
sharingPreferences: {basic: true, personalization: true, thirdParty: false}
So that it can set sharing preferences for the user for data generated with companyName

Get /data/:companyName/showOwners to show which data NFTs have been mined

Post /data/:companyName/shareNft to allow third parties to mint NFTs and thereby obtain access to your data with companyName

### Data For Companies

Get /data/:username/accessNft/:company2 Mint an NFT to gain access to the data of Username generated while interacting with company2

### Miscellaneous (Testing/Setup)

Get /data/generateNetflixTestData

Get /data/generateHuluTestData

Get /data/:companyName/testSettingSharingPreferences

## Deployment

API succesfully deployed at https://papaya-inrupt-hack-api.herokuapp.com/

## Bravo Frontend

Bravo is a no-code frontend app generator
I tried to generate an authorization code through login.inrupt.com/authorization using a client id that resolved to a [document in this repo](https://raw.githubusercontent.com/papayaverse/inrupt_hackathon_api/main/bravoclientdoc.jsonld) but it did not work ;-;

Regardless, here is the
[Link to BravoVision Frontend](https://bravostudioapp.page.link/?link=https%3A%2F%2Fapps-service.bravostudio.app%2Fdevices%2Fapps%2F01GW2XN76ADARD08R9Q747S4Z0&ofl=https%3A%2F%2Fbravostudio.app%2Fdownload-bravo-vision&apn=com.appfoundry.previewer&ibi=com.codelesslabs.app)
which shows what the final experience would look like.

## Resources

[Link to Inrupt Login Express Web Server](https://docs.inrupt.com/developer-tools/javascript/client-libraries/tutorial/authenticate-nodejs-web-server/#example)

[Link to Configure Oauth2 Login With Bravo](https://docs.bravostudio.app/integrations/user-authentication/oauth2)





'use strict' ;

const{contract} = require ('fabric-contract-api');

const status ={
    requested: 'Requested',
    registered: 'requested',
    onsale: 'on Sale'
}

class UserContract extends contract{
    constructor(){
        // Nameing the Smart Contract
        super('regnet.usercontract');
    }
    // Message to show once the network is instatiated
    async instantiate(ctx){
        console.log('Regnet User Smart Contract Instantiated');
    }
/* ******************************FUNCTIONS IN USER CONTRACT************************************************** */

// Request to add a new user
    async requestNewUser(ctx,username,email,contactNo,SSN){

        if('userMsp'!=ctx.clientIdentity.mspId){
            throw error ("not a authoried Id to perform operation");
        }

        const userKey = ctx.stub.createCompositeKey('regnet.users',[username,SSN]);
        let newUserObject ={
            username: username,
            email: email,
            contactNo: contactNo,
            SSN: SSN,
            createdAt: ctx.stub.getTxTimestamp()
        }
        await ctx.stub.putstate(userKey,buffer.from(JSON.stringify(newUserObject)));
        return newUserObject;
        
    }
// To view user details from the Ledger
    async viewUser(ctx,username,SSN){
        const userKey = ctx.stub.createCompositeKey('regnet.users',[username,SSN]);
        const userBuffer = ctx.stub.getState(userKey);
        if(userBuffer){
            return JSON.parse(userBuffer.toString());
        }else{
            return 'Invalid user details'
        }
    }
    async rechargeAccount(ctx, username, SSN, banktransactionID){

        if(banktransactionID==upg100||upg500||upg1000){
            const userKey = ctx.stub.createCompositeKey('regnet.users', [username, SSN])
            const userBuffer = await ctx.stub.getState(userKey);
            let newUserRequest = JSON.parse(userBuffer.toString());
           
            if(banktransactionID==upg100){
                newUserRequest.upGradCoins =100;
            } else if(banktransactionID==upg500){
                newUserRequest.upGradCoins=500;
            } else{
                newUserRequest.upGradCoins=1000;
            }
            const usernewBuffer = Buffer.from(JSON.stringify(newUserRequest));
            await ctx.stub.putState(userKey, usernewBuffer);
    
    
        }
        else{
            return "Invalid Bank Transaction ID";
        }
    }
// Request to register a new property
    async propertyRegRequest(ctx,username,propertyID,propertyStatus,price,SSN){

        if('userMsp'!=ctx.clientIdentity.mspId){
            throw error("Not a authorised ID to perfom the Operation");
        }

        const propertyKey = ctx.stub.createCompositeKey('regnet.property',[username,SSN]);
        let propertyObject ={
            username: username,
            propertyID: propertyID,
            propertyStatus: status[propertyStatus],
            owner: userKey,
            price: price,
            SSN: SSN,
            createdAt: ctx.stub.getTxTimestamp()
        }
        await ctx.stub.putstate(propertyKey,buffer.from(JSON.stringify(propertyObject)));
        return propertyObject;
    }
 //To view property details from the network   
    async viewProperty(ctx,propertyID){
        const propertyKey =ctx.stub.createCompositeKey('regnet.property',[propertyID]);
        const propertyBuffer= await ctx.stub.getstate(propertyKey);
        if(propertyBuffer){
            return JSON.parse(propertyBuffer.toString());
        }else{
            return 'invalid property details';
        }
    }
// To make changes in the property asset from the network
    async updateProperty(ctx,propertyID,username,SSN,propertyStatus){

        if('userMsp'!=ctx.clientIdentity.mspId){
            throw error("Not a authorised ID to perfom operation");
        }

        const propertyKey =ctx.stub.createCompositeKey('regnet.property',[propertyID]);
        const propBuffer = await ctx.stub.getState(propertyKey)

        //check if the property already exist or not
        if(propBuffer){
            return JSON.parse(propBuffer.toString());
        }else{
            return 'Invalid Property Details, already have this property registered with the given ID'+ propertyID;
        }

        // check if User does exist
        const userKey = ctx.stub.createCompositeKey('renet.users',[username,SSN]);
        let userBuffer =await ctx.stub.getState(userKey);
        if(userBuffer){
            return JSON.parse(userBuffer.toString());
        }else{
            return 'Invalid User Details.No user exists with provided '+ username +'and'+ SSN;
        }
        //checking status
        if(!status[propertyStatus]){
            throw error ('Invalid status');
        }

        let newPropOject = JSON.parse(propBuffer.toString());
        if(userKey == newPropOject.owner){
            newPropOject.propertyStatus= status[propertyStatus],
            newPropOject.createdAt= ctx.stub.getTxTimestamp(),
            newPropOject.updatedAt= ctx.stub.getTxTimestamp()

            await ctx.stub.putstate(propertyKey,buffer.from(JSON.stringify(newPropOject)));
            return newPropOject;
        }else{
            throw error('Transaction declines as the user is not the owner of the property')
        }
    }
    // To buy a property 
    async purchaseProperty(ctx,propertyID,username,SSN){

        if('userMsp'!=ctx.clientIdentity.mspId){
            throw error("Not a authorised ID to perfom the Operation");
        }
        
        const propertyKey= ctx.stub.createCompositeKey('regnet.property',[propertyID,SSN]);
        const propBuffer= ctx.stub.getState(propertyKey)
        //checking if the property exist
        if(propBuffer){
            return JSON.parse(propBuffer.toString());
        }else{
            return 'Invalid property details';
        }

        const userKey= ctx.stub.createCompositeKey('regnet.users',[propertyID,SSN]);
        const userBuffer= ctx.stub.getState(userKey)
        //checking if the user does exist
        if(userBuffer){
            return JSON.parse(userBuffer.toString());
        }else{
            return 'No user exist with the given username and SSN';
        }
        // checking the status of the property whether it is on sale 
        const newPropOject = JSON.parse(propBuffer.toString());
        if(newPropOject.status!=status['onsale']){
            throw error("property not for sale");
        }

        if(userKey!=newPropOject.owner){
            const userObject= JSON.parse(userBuffer.toString());
            if(userObject.upgradcoins >= newPropOject.price){
                let ownerBuffer= ctx.stub.getState(userKey);
                let ownerUserObject = JSON.parse(ownerBuffer.toString());

                userObject.upgradcoins = userObject.upgradcoins - newPropOject.price;// Debiting from buyer account
                ownerUserObject = ownerUserObject.upgradcoins + newPropOject.price;// crediting to Owner account
                
                newPropOject.owner = userKey,
                newPropOject.propertystatus = status['registered'],
                newPropOject.updatedAt = getTxTimestamp();

                await ctx.stub.putstate(userKey,buffer.from(JSON.stringify(userObject)));
                await ctx.stub.putstate(propertyKey,buffer.from(JSON.stringify(newPropOject)));
                return newPropOject;
            }
            throw error('No sufficient balance to buy the property');
        }else{
            throw error('Owner cannot buy the property, given ID owns the property');
        }

    }


}
module.exports = UserContract;

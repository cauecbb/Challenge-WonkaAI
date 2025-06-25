/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */



/**
 * Enter here the user flows and custom policies for your B2C application
 */
export const b2cPolicies = {
    names: {
        signUpSignIn: 'B2C_1_susi_v2',
        forgotPassword: 'B2C_1_reset_v3',
        editProfile: 'B2C_1_edit_profile_v2',
    },
   
    authorities: {
        signUpSignIn: {
            authority: 'https://meetwonka.b2clogin.com/meetwonka.onmicrosoft.com/b2c_1_susi_v2',
        },
        forgotPassword: {
            authority: 'https://meetwonka.b2clogin.com/meetwonka.onmicrosoft.com/B2C_1_reset_v3',
        },
        editProfile: {
            authority: 'https://meetwonka.b2clogin.com/meetwonka.onmicrosoft.com/b2c_1_edit_profile_v2',
        },
    },
    authorityDomain: 'meetwonka.b2clogin.com', // Replace YOUR_TENANT_NAME with your actual tenant name
};

/**
 * Configuration object to be passed to MSAL instance on creation.
 */
export const msalConfig = {
    auth: {
      clientId: "ee23e2d9-1b69-41e1-8b31-05930b374ee3",
      authority: "https://login.microsoftonline.com/organizations",
     redirectUri:  window.location.hostname === "localhost"
          ? "http://localhost:5173"  
              : "https://amnorman.meetwonka.com/" 
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false
    }
  }
/**
 * Add here the endpoints and scopes when obtaining an access token for protected web APIs.
 */
export const protectedResources = {
    apiTodoList: {
        endpoint: 'http://localhost:8000/', // Replace with your API endpoint if it's different
        scopes: {
            read: ['https://meetwonka.onmicrosoft.com/MyAPI/ToDoList.Read'], // Replace "MyAPI" with your actual API name if different
            write: ['https://meetwonka.onmicrosoft.com/MyAPI/ToDoList.ReadWrite'], // Same here
        },
    },
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 */
export const loginRequest = {
    scopes: [...protectedResources.apiTodoList.scopes.read, ...protectedResources.apiTodoList.scopes.write],
};

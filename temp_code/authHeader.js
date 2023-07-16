
//import { get_cookie } from 'js-cookie';
//
//from_cookie = (key) => {
//    // get_cookie()
//    let cookies = {
//        "jwt-token": "1234",
//    }
//
//    return cookies[key]
//}

import { currentUser } from "storage-constants.js"

// Get token from local storage for each url requiring authentication.
//localStorage.getItem(currentUser)       // must be prepared for async
//localStorage.setItem(currentUser, "test-value")
//localStorage.removeItem(currentUser)


# pseudo code
getHeaders = () => {
    return {
        "Content-Type": "application/json",
        "HTTP-Authorization": from_cookie("jwt-token"),
    };
};

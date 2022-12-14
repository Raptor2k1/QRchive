/* 
Date: 10/6/2022
Description:  Helper method that takes a string (from the QR scanner results) and pings the web address to get a description of the URL. If no description is available,
              or the ping times out, etc. it returns a generic placeholder description instead.
*/

//TO DO: Define function
//TO DO: Ping Server for Description
//TO DO: Handle timeout/bad connection/invalid URL
//TO DO: Return description from ping as string

//Open source tool: https://allorigins.win/ 
//Pulls contents from remote HTML URL 

const getTitle = (url) => {
    return fetch(`https://api.allorigins.win/get?url=${url}`)
        .then((response) => {
            // checks whether response status code is not in 200-299 range 
            if (!response.ok) {
                throw new Error("Unsuccessful fetch operation. Please try again.");
            }
            return response.text();
        })
        .then((html) => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const title = doc.querySelectorAll('title')[0];
            // if there is no valid title, returns generic placeholder string
            if (!title) {
                let placeholderText = "Untitled webpage"
                return placeholderText
            }
            return title.innerText;
        });
};


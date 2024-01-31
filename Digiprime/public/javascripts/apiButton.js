const apiButton = document.querySelector('.apiButton');
const apiCodeInput = document.getElementById('api_code');
//const apiEventInput = document.getElementById('api_event');
//const apiIDInput = document.getElementById('api_id');

const apiUrl = "http://localhost:105";
const ledger_user_url = "http://localhost:107";
apiButton.addEventListener('click', function() {
  
  handleApiButtonClick();
});

/**
 * Handles the click event of the API button.
 * Retrieves the value of the API code input field and performs an API request based on the code value.
 * If the user is logged in and has the right access, it sends a POST request to the API endpoint.
 * If the API code value is a valid integer, it sends a request to find the battery with the specified code.
 * If the response is not successful, it throws an error.
 * If the user is not logged in or doesn't have the right access, it displays an alert message.
 */
async function handleApiButtonClick() {
  const apiCodeValue = apiCodeInput.value;  
    
  //const apiEvent = apiEventInput.value;
  //const apiID = apiIDInput.value;
  tmp_loginCheck = await loginCheck();
  console.log(tmp_loginCheck);
  if (tmp_loginCheck != null) {

    if (parseInt(apiCodeValue)) {

      const parsedApiCodeValue = parseInt(apiCodeValue);
      
      if (!isNaN(parsedApiCodeValue)) {
        console.log(parsedApiCodeValue)
        try{
          const response = await fetch((`${apiUrl}/find`),{
            method: 'POST', // Specify the method as POST
            mode: 'cors', // Enable CORS
            headers: {
              'Content-Type': 'application/json', // Set the content type of the request body
              'Accept': 'application/json' // Set the acceptable response content type
            },
            body: JSON.stringify({ CurOwner: tmp_loginCheck, BatteryID: apiCodeValue })
          })
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }catch (error) {
          // Log the error to the console
          console.log(error)
          alert("Not the current Owner")
          return
          // Set uname to null
        }
      } else {
          console.log("Not an integer");
          return;
      }
    }
    alert("You are logged in and have the right access to change this battery Ledger")









  }else {
    alert("Test with a new account");
    return;
  }
}
  


// Define an asynchronous function called loginCheck
async function loginCheck() {
  // Prompt the user to enter their username and password
  let input = prompt("Enter your username and password below", "login:username:password");

  // Split the input string into parts using ":" as the separator
  split_input = input.split(":");

  // Assign the parts of the input to variables
  command = split_input[0];
  uname = split_input[1];
  pword = split_input[2];
  
  // Check if the username or password is null or empty, and alert the user if so
  if (uname == null || uname == "" || pword == null || pword == "") {
    alert("invalid input");
  }

  // Try to make a POST request to the login endpoint
  try {
    const response = await fetch(`${ledger_user_url}/ledger/login`, 
    {
      method: 'POST', // Specify the method as POST
      mode: 'cors', // Enable CORS
      headers: {
        'Content-Type': 'application/json', // Set the content type of the request body
        'Accept': 'application/json' // Set the acceptable response content type
      },
      body: JSON.stringify({ username: uname, password: pword }) // Stringify the username and password into JSON format
    });

    // If the response status is not OK (200), throw an error
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  // If there's an error in the try block, catch it
  } catch (error) {
    // Log the error to the console
    console.error('login:', error);
    // Set uname to null
    uname = null;
  }
  // Return the username
  return uname;
}



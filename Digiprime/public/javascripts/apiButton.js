const apiButton = document.querySelector('.apiButton');
const apiCodeInput = document.getElementById('api_code');

const apiUrl = "http://localhost:105";
const ledger_user_url = "http://localhost:107";

apiButton.addEventListener('click', function() {
  handleApiButtonClick();
});

async function handleApiButtonClick() {

  const apiCodeValue = apiCodeInput.value;  

  tmp_loginCheck = await loginCheck();
  console.log(tmp_loginCheck);

  if (tmp_loginCheck != null) {

    if(apiCodeValue == "add"){ // Fixa så att man kan skicka från form input
      fetch(`${apiUrl}/${apiCodeValue}`, {
        method: 'POST',
        body: JSON.stringify({
          event: "thisistest",
          id: "test123"
        })
      })
      .catch(error => {
        console.log("Fetch error! (test)");
      });
    } else if (parseInt(apiCodeValue)) {
      const parsedApiCodeValue = parseInt(apiCodeValue);

      if (!isNaN(parsedApiCodeValue)) {
        console.log(parsedApiCodeValue)
        fetch(`${apiUrl}/find/${apiCodeValue}`)
        .then(response => response.json())
        .then(data => {
            const apiCreationInput = document.getElementById('api_creation');
            apiCreationInput.value = data.date;
        })
        .catch(error => {
            console.log("Fetch error! (find)");
        });
      } else {
          console.log("Not an integer");
      }
    }
  } else {
    alert("Account does not exist");
    return;
  }
};
  


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
    throw new Error('Invalid input!');
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



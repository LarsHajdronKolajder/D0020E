const buyButton = document.getElementById("purchaseButton");

// To import config.js here we need webpack, did not really have time to setup this
// sorry eric ):

const apiUrl = "http://localhost:105"; // fetch ledger info
const ledger_user_url = "http://localhost:107"; // check user info
buyButton.addEventListener("click", function () {

  // Get the battery ID
  const batteryID = buyButton.name;

  handleClick(batteryID);
});

async function handleClick(batteryID) {

  console.log("batteryID: ", batteryID)

  // Prompt the user for their username and password
  let input = prompt(
    "Enter your username and password below",
    "username:password"
  );

  // Split the input string into parts using ":" as the separator
  split_input = input.split(":");

  // Assign the parts of the input to variables
  uname = split_input[0];
  pword = split_input[1];

  // Check if the username or password is null or empty, and alert the user if so
  if (uname == null || uname == "" || pword == null || pword == "") {
    throw new Error("Invalid input!");
  }

  // check user is: seller/broker
  if (await checkUser(uname, pword)) {
    console.log("Authorized user!");
    // check user is: NOT the current owner
    if (await checkCurrentOwner(uname, batteryID)) {
      // if user is authenticated, change current owner to user
      await changeCurrentOwner(uname, batteryID);
    } else {
      alert("You are ALREADY the current owner!");
    }
  } else {
    alert("Unauthorized user!");
  }
}

async function checkUser(uname, pword) {
  // Try to make a POST request to the login endpoint
  try {
    const response = await fetch(`${ledger_user_url}/ledger/login`, {
      method: "POST", // Specify the method as POST
      mode: "cors", // Enable CORS
      headers: {
        "Content-Type": "application/json", // Set the content type of the request body
        Accept: "application/json" // Set the acceptable response content type
      },
      body: JSON.stringify({ username: uname, password: pword }), // Stringify the username and password into JSON format
    });

    // If the response status is not OK (200), throw an error
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      // if user exists, return true;
      return true;
    }

    // If there's an error in the try block, catch it
  } catch (error) {
    // Log the error to the console
    console.error("login:", error);
    // Return false
    return false;
  }
}

async function checkCurrentOwner(user, batteryID) {
  try {
    const response = await fetch(`${apiUrl}/find`, {
      method: "POST", // Specify the method as POST
      mode: "cors", // Enable CORS
      headers: {
        "Content-Type": "application/json", // Set the content type of the request body
        Accept: "application/json" // Set the acceptable response content type
      },
      body: JSON.stringify({ CurOwner: user, BatteryID: batteryID }),
    });
    console.log(response);
    if (!response.ok) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    // Log the error to the console
    console.log(error);
    return false;
  }
}

async function changeCurrentOwner(user, batteryID) {
  // update current owner in MongoDB
  console.log("Changing owner...");

  try {
    const response = await fetch(`${apiUrl}/update`, {
      method: "POST", // Specify the method as POST
      mode: "cors", // Enable CORS
      headers: {
        "Content-Type": "application/json", // Set the content type of the request body
        Accept: "application/json" // Set the acceptable response content type
      },
      body: JSON.stringify({ NewOwner: user, BatteryID: batteryID }),
    });
    console.log(response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      alert("Owner changed!");
    }
  } catch (error) {
    // Log the error to the console
    console.log(error);
    return;
  }
}
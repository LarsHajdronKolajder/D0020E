const apiButton = document.querySelector('.apiButton');
const apiCodeInput = document.getElementById('api_code');
//const apiEventInput = document.getElementById('api_event');
//const apiIDInput = document.getElementById('api_id');

const apiUrl = "http://localhost:105";

apiButton.addEventListener('click', function() {
    const apiCodeValue = apiCodeInput.value;
    //const apiEvent = apiEventInput.value;
    //const apiID = apiIDInput.value;

    // Fetch API call
    if (apiCodeValue == "hello"){
      fetch(`${apiUrl}/${apiCodeValue}`, {method: 'GET'})
      .then(response => response.json())
      .then(data => {
        console.log(data);
        alert(JSON.stringify(data.message));
      })
      .catch(error => {
        console.log("Fetch error! (hello)");
      });
    } else if (apiCodeValue == "test"){
      fetch(`${apiUrl}/${apiCodeValue}`, {method: 'POST'})
      .catch(error => {
        console.log("Fetch error! (test)");
      });
    } else if(apiCodeValue == "add"){ // Fixa så att man kan skicka från form input
      fetch(`${apiUrl}/${apiCodeValue}`, {
        method: 'POST',
        body: JSON.stringify({
          event: "digiprime",
          id: "test"
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
});


//`{"event": ${apiEvent}, "id": ${apiID}}` add API body

function getCookie(name) {
    const cookieString = document.cookie;
    const cookies = cookieString.split(';');
  
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        return cookie.substring(name.length + 1);
      }
    }
  
    return null;
  }
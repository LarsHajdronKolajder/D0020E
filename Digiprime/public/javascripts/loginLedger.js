
const ledgerButton = document.querySelector('.ledgerButton');

const ledger_user_url = "http://localhost:107";

ledgerButton.addEventListener('click', function() {
    ledgerPrompt();
});

function ledgerPrompt() {
    let input = prompt("Enter your username and password below", "command:username:password");

    split_input = input.split(":");

    command = split_input[0];
    uname = split_input[1];
    pword = split_input[2];
    
    if (uname == null || uname == "" || pword == null || pword == "") {
      alert("invalid input");
    }

    if (command == "hello"){
      fetch(`${ledger_user_url}/${command}`, {method: 'GET'})
      .then(response => response.json())
      .then(data => {
        console.log(data);
        alert(JSON.stringify(data.message));
      })
      .catch(error => {
        console.log("Fetch error! (hello)");
      });
    } else {
      fetch(`${ledger_user_url}/user/${command}`, 
      {
          method: 'POST',
          body: JSON.stringify({
            username: uname,
            password: pword
          })
      })
      .catch(error => {
          console.log("Fetch error! (shitdontwork)", error);
      });
    }
}



const ledgerButton = document.querySelector('.ledgerButton');

const ledger_user_url = "http://localhost:107";

ledgerButton.addEventListener('click', function() {
    ledgerPrompt();
});

function ledgerPrompt() {
    let input = prompt("Enter your username and password below", "username:password");

    input = input.split(":");

    const username = input[0];
    const password = input[1]; 
    
    if (username == null || username == "" || password == null || password == "") {
      alert("invalid input");
    }

    fetch(`${ledger_user_url}/user/login`, {
        method: 'POST',
        body: JSON.stringify({
          username: `${username}`,
          password: `${password}`
        })
    })
    .catch(error => {
        console.log("Fetch error! (test)");
    });

}


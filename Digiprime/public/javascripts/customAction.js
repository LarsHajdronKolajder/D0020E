
const customActionButton = document.querySelector('.customActionButton');
const manCodeInput = document.getElementById('man_code');
const fetchtype = document.getElementById('fetch_type');


customActionButton.addEventListener('click', function() {
    let yourForm = document.getElementById("myform");
    const manCodeValue = manCodeInput.value;
    const fetch_type_id = fetchtype.value;
    const jwtToken = getCookie('jwt');
    if (fetch_type_id == "bat") {
      fetch(`dismitted?man_code=${encodeURIComponent(manCodeValue)}&fetch_type=${encodeURIComponent(fetch_type_id)}`)
        .then(response => response.json())
        .then(data => {
          if (data.filteredData && data.VBM) {
            // Filter the data based on the manufacturer code
            const filteredData = data.filteredData;
    
            if (filteredData.length === 0) {
              // Display a pop-up message if no results are found
              alert('No results found for black mass id: ' + manCodeValue);
              yourForm.title.value = "";
              yourForm.referenceSector.value = "";
              yourForm.referenceType.value = "";
              yourForm.description.value = "";
              yourForm.price.placeholder = "";
              yourForm.location.value = "";
            } else {
              const VBM = data.VBM;
              // Access the first item in the filteredData array
              const item = filteredData[0];
              // Use the item data in your client-side logic
              yourForm.title.value = item.payload.titledsm.val[0] + " offer";
              yourForm.description.value = "Chemistry - " + item.payload.chemistrybm.val[0] + "; Particle Size [µm] - " + item.payload.sizebm.val[0] + "; Cobalt Content [wt%] - " + item.payload.cobm.val[0] + "; Lithium Content [wt%] - " + item.payload.libm.val[0] + "; Electrolyte - " + item.payload.electrolytebm.val[0];
              yourForm.price.value = VBM;
              yourForm.location.value = item.payload.locationdsm.val[0];
    
              // Access the VBM value from the data object
              
              // Now you can use the VBM value in your client-side logic
              console.log('VBM:', VBM);
            }
          } else {
            console.error('Data is missing filteredData or VBM');
          }
        })
        .catch(error => {
          console.error('Error:', error);
        });
    } else if (fetch_type_id=="mancode"){
      fetch(`dismitted?man_code=${encodeURIComponent(manCodeValue)}&fetch_type=${encodeURIComponent(fetch_type_id)}`)
      .then(response => response.json())
      .then(data => {
        // Filter the data based on the manufacturer code
        const filteredData = data.filter(obj => {
          return obj.payload.manufacturerCode.val.includes(manCodeValue);
        });
  
        if (filteredData.length === 0) {
          // Display a pop-up message if no results are found
          alert('No results found for the manufacturer code: ' + manCodeValue);
          yourForm.title.value="";
          yourForm.referenceSector.value = "";
          yourForm.referenceType.value = "";
          yourForm.description.value = "";
          yourForm.price.placeholder = "";
          yourForm.location.value = "";
        } else {
          // Access the first item in the filteredData array
          const item = filteredData[0];
          // Use the item data in your client-side logic
          yourForm.title.value=manCodeValue+' Offer ...'
          yourForm.referenceSector.value = item.payload.valueChainPosition.val[0];
          yourForm.referenceType.value = item.payload.circularEntity.val[0];
          yourForm.description.value = item.payload.description.val[0];
          yourForm.price.placeholder = item.payload.salePurchasePriceRange.val[0];
          yourForm.location.value = item.payload.city.val[0] + ', ' + item.payload.country.val[0];
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
    }
  });

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
const dropDownSector = document.getElementById('referenceSectorSelector');
const textBoxSector = document.getElementById('referenceSector');

const dropDownType = document.getElementById('referenceTypeSelector');
const textBoxType = document.getElementById('referenceType');


dropDownSector.addEventListener('change', (event) => {
    const option = event.target.value;
    textBoxSector.value = option;
   });

dropDownType.addEventListener('change', (event) => {
    const option = event.target.value;
    textBoxType.value = option;
    });
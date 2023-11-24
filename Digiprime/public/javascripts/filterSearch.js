const nameForm = document.querySelector("#search-directory");
nameForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const selectCostumer = document
    .querySelector("#costumer")
    .value.toLowerCase();
  const selectReferenceSector = document
    .querySelector("#referenceSector")
    .value.toLowerCase();
  const selectReferenceType = document
    .querySelector("#referenceType")
    .value.toLowerCase();

  let costumers = document.querySelectorAll("#itemCostumer");
  let referenceSectors = document.querySelectorAll("#itemReferenceSector");
  let referenceTypes = document.querySelectorAll("#itemReferenceType");

  Array.from(costumers).forEach(function (costumer) {
    let searchResult = costumer.textContent || costumer.innerText;

    if (searchResult.toLowerCase().indexOf(selectCostumer) != -1) {
      costumer.closest("#eachBlock").style.display = "block";
      costumer.closest("#eachBlock").classList.add("remanents");
    } else {
      costumer.closest("#eachBlock").style.display = "none";
      costumer.closest("#eachBlock").classList.remove("remanents");
    }
  });

  Array.from(referenceSectors).forEach(function (referenceSector) {
    let searchResult = referenceSector.textContent || referenceSector.innerText;

    if (
      searchResult.toLowerCase().indexOf(selectReferenceSector) != -1 &&
      referenceSector.closest(".remanents")
    ) {
      referenceSector.closest("#eachBlock").style.display = "block";
      referenceSector.closest("#eachBlock").classList.add("remanentsBlock");
    } else {
      referenceSector.closest("#eachBlock").style.display = "none";
      referenceSector.closest("#eachBlock").classList.remove("remanentsBlock");
    }
  });

  Array.from(referenceTypes).forEach(function (referenceType) {
    let searchResult = referenceType.textContent || referenceType.innerText;

    if (
      searchResult.toLowerCase().indexOf(selectReferenceType) != -1 &&
      referenceType.closest(".remanentsBlock")
    ) {
      referenceType.closest("#eachBlock").style.display = "block";
    } else {
      referenceType.closest("#eachBlock").style.display = "none";
    }
  });
});

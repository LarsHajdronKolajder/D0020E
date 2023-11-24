// let check = new Array();
// let titles = offers.features.map(({ title }) => title)
// const nameForm = document.querySelector('#search-box')
// let count = offers.features.map(({ title }) => title).length
// nameForm.addEventListener('input', event => {
//     event.preventDefault()
//     const term = event.target.value.toLowerCase()
//     // console.log(term)
//     let searchResult = titles.filter(title => {
//     return title.toLowerCase().includes(term)
//       })
//     console.log(searchResult)
//     // return searchResult
//     changeCount = searchResult.length
//     for (let i = 0; i < changeCount; i++) {
//         for (let j = 0; j < count; j++) {
//             if (searchResult[i] === offers.features[j].title) {
//                 document.querySelector('#eachBlock').style.display = 'block'
//             // offers.features[j].style.display = 'block'
//             // check.push(offers.features[j])

//             } else {
//                 document.querySelector('#eachBlock').style.display = 'none'
//             // offers.features[j].style.display = 'none'
//             }
//         }
//     }
// })

const nameForm = document.querySelector("#search-box");
nameForm.addEventListener("input", (event) => {
  event.preventDefault();
  const term = event.target.value.toLowerCase();
  let titles = document.querySelectorAll("#searchTitle");
  Array.from(titles).forEach(function (title) {
    let searchResult = title.textContent || title.innerText;

    if (searchResult.toLowerCase().indexOf(term) != -1) {
      title.closest("#eachBlock").style.display = "block";
    } else {
      title.closest("#eachBlock").style.display = "none";
    }
  });
});

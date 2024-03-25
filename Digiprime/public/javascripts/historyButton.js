const historyItems = document.querySelectorAll(".history-item");
const nextButton = document.getElementById("nextButton");
const previousButton = document.getElementById("previousButton");
let currentIndex = 0;

historyItems.forEach((item, index) => {
    if (index !== 0) {
        item.style.display = "none";
    }
});


nextButton.addEventListener("click", () => {
    if (currentIndex < historyItems.length - 1) {
        // Hide the current history item
        historyItems[currentIndex].style.display = "none";
        // Move to the next history item
        currentIndex++;
        // Show the next history item
        historyItems[currentIndex].style.display = "block";
    }
});

previousButton.addEventListener("click", () => {
    if (currentIndex > 0) {
        // Hide the current history item
        historyItems[currentIndex].style.display = "none";
        // Move to the previous history item
        currentIndex--;
        // Show the previous history item
        historyItems[currentIndex].style.display = "block";
    }
});
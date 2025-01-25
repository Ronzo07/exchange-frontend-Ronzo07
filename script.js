var addButton = document.getElementById("add-button");
addButton.addEventListener("click", addItem);

var sellUserTransactions = []; // Selling USD
var buyUserTransactions = [];

function addItem() {
    
    var lbpInput = document.getElementById("lbp-amount");
    var usdInput = document.getElementById("usd-amount");
    var transactionTypeSelect = document.getElementById("transaction-type");
   
    var lbpAmount = parseFloat(lbpInput.value);
    var usdAmound = parseFloat(usdInput.value);
    var transactionType = transactionTypeSelect.value;
    
    // Validate input
    if (isNaN(lbpAmount) || isNaN(usdAmound) || lbpAmount <= 0 || usdAmound <= 0) {
        alert("Please enter valid amounts for both LBP and USD.")
        return;
    }

    if (transactionType == "usd-to-lbp") {
        sellUserTransactions.push(lbpAmount/usdAmound);
    } else {
        buyUserTransactions.push(usdAmound/lbpAmount);
    }

    lbpInput.value = "";
    usdInput.value = "";
    updatesRates();
}

function updatesRates() {
    var buyUsdRateDisplay = document.getElementById("buy-usd-rate");
    var sellUsdRateDisplay = document.getElementById("sell-usd-rate");

    // Average buying USD rate vs LBP
    if (buyUserTransactions.length > 0) {
        var buyUsdAverage = calculateAverage(buyUserTransactions);
        buyUsdRateDisplay.innerHTML = buyUsdAverage.toFixed(2) + " USD per 1 LBP";
    } else {
        buyUsdRateDisplay.innerHTML = "Not available yet";
    }

    // Average selling USD rate vs LBP
    if (sellUserTransactions.length > 0) {
        var sellUsdAverage = calculateAverage(sellUserTransactions);
        sellUsdRateDisplay.innerHTML = sellUsdAverage.toFixed(2) + " LBP per 1 USD";
    } else {
        sellUsdRateDisplay.innerHTML = "Not available yet";
    }
}

function calculateAverage(arr) {
    var sum = arr.reduce((total, value) => total + value, 0);
    return sum / arr.length;
}
document.cookie = "userSession=active; HttpOnly; Secure; SameSite=Strict";

function sanitizeInput(input) {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
}

function encryptData(data) {
    return btoa(data);
}

let transactionCount = 0;
const maxTransactions = 10;
setInterval(() => {
    transactionCount = 0;
}, 60000);

function canAddTransaction() {
    if (transactionCount >= maxTransactions) {
        alert('Too many transactions! Please wait a minute.');
        return false;
    }
    transactionCount++;
    return true;
}

var addButton = document.getElementById("add-button");
addButton.addEventListener("click", addItem);

var sellUserTransactions = []; // Selling USD
var buyUserTransactions = [];

function addItem() {
    try {
        if (!canAddTransaction()) return;

        // Sanitize user inputs
        const sanitizedLBP = sanitizeInput(document.getElementById('lbp-amount').value);
        const sanitizedUSD = sanitizeInput(document.getElementById('usd-amount').value);
        const sanitizedType = sanitizeInput(document.getElementById('transaction-type').value);

        const lbpAmount = parseFloat(sanitizedLBP);
        const usdAmount = parseFloat(sanitizedUSD);
        var transactionType = sanitizedType;
        
        // Validate input
        if (isNaN(lbpAmount) || isNaN(usdAmount) || lbpAmount <= 0 || usdAmount <= 0) {
            alert("Please enter valid amounts for both LBP and USD.")
            return;
        }
        const encryptedTransaction = encryptData(`${sanitizedLBP}-${sanitizedUSD}-${sanitizedType}`);
        console.log("Encrypted Transaction:", encryptedTransaction);
        console.log('Transaction submitted:', { lbpAmount, usdAmount, type: sanitizedType });

        console.log('Transaction submitted:', {
            lbpAmount: sanitizedLBP,
            usdAmount: sanitizedUSD,
            type: sanitizedType
        });

        if (transactionType == "usd-to-lbp") {
            sellUserTransactions.push(lbpAmount/usdAmount);
        } else {
            buyUserTransactions.push(usdAmount/lbpAmount);
        }

        document.getElementById('lbp-amount').value = "";
        document.getElementById('usd-amount').value = "";
        updatesRates();
    } catch (error) {
        console.error('Error adding Transaction:', error);
    }
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

document.cookie = "userSession=active; HttpOnly; Secure; SameSite=Strict";
var SERVER_URL = "http://127.0.0.1:5000"

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
        const isUsdToLbp = (transactionType == "usd-to-lbp");
        
        let transaction = {
            usd_amount: usdAmount,
            lbp_amount: lbpAmount,
            usd_to_lbp: isUsdToLbp
        };

        fetch(`${SERVER_URL}/transaction`, {
            method: "POST",
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify(transaction)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Transaction added:", data);
            fetchRates();
        })
        .catch(error => console.error("Error in fetch:", error));

        // if (transactionType == "usd-to-lbp") {
        //     // TODO: Use teh
        //     sellUserTransactions.push(lbpAmount/usdAmount);
        // } else {
        //     buyUserTransactions.push(usdAmount/lbpAmount);
        // }

        // document.getElementById('lbp-amount').value = "";
        // document.getElementById('usd-amount').value = "";
        // updatesRates();
    } catch (error) {
        console.error('Error adding Transaction:', error);
    }
}

// function updatesRates() {
//     var buyUsdRateDisplay = document.getElementById("buy-usd-rate");
//     var sellUsdRateDisplay = document.getElementById("sell-usd-rate");

//     // Average buying USD rate vs LBP
//     if (buyUserTransactions.length > 0) {
//         var buyUsdAverage = calculateAverage(buyUserTransactions);
//         buyUsdRateDisplay.innerHTML = buyUsdAverage.toFixed(2) + " USD per 1 LBP";
//     } else {
//         buyUsdRateDisplay.innerHTML = "Not available yet";
//     }

//     // Average selling USD rate vs LBP
//     if (sellUserTransactions.length > 0) {
//         var sellUsdAverage = calculateAverage(sellUserTransactions);
//         sellUsdRateDisplay.innerHTML = sellUsdAverage.toFixed(2) + " LBP per 1 USD";
//     } else {
//         sellUsdRateDisplay.innerHTML = "Not available yet";
//     }
// }

// function calculateAverage(arr) {
//     var sum = arr.reduce((total, value) => total + value, 0);
//     return sum / arr.length;
// }

// Function that will retrieve the exchange rates 
// and will update the UI to display them
function fetchRates() {
    fetch(`${SERVER_URL}/exchangeRate`)
    .then(response => response.json())
    .then(data => {
        // Update the UI with the received data
        document.getElementById("buy-usd-rate").innerHTML = data.lbp_to_usd.toFixed(2) + " USD per 1 LBP";
        document.getElementById("sell-usd-rate").innerHTML = data.usd_to_lbp.toFixed(2) + " LBP per 1 USD";
    })
    .catch(error => console.error("Error fetching rates:", error));
}

// Automatically fetch the rates when loading the webpage
fetchRates();

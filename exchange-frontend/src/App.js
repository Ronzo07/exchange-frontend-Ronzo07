import './App.css';
import React, { useState, useCallback, useEffect } from "react";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import UserCredentialsDialog from './UserCredentialsDialog/UserCredentialsDialog';
import { create } from '@mui/material/styles/createTransitions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { getUserToken, saveUserToken, clearUserToken } from "./localStorage";
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { DataGrid, GridColDef } from '@mui/x-data-grid'; // Import DataGrid and GridColDef

var SERVER_URL = "http://192.168.1.208:5000"; // The Windows machine's IP as the backend run there

function App() {
    let [buyUsdRate, setBuyUsdRate] = useState(null);
    let [sellUsdRate, setSellUsdRate] = useState(null);
    let [lbpInput, setLbpInput] = useState("");
    let [usdInput, setUsdInput] = useState("");
    let [transactionType, setTransactionType] = useState("usd-to-lbp");
    let [userToken, setUserToken] = useState(getUserToken()); // Initialize from local storage
    // State for the rate calculator
    let [calcAmount, setCalcAmount] = useState("");
    let [calcCurrency, setCalcCurrency] = useState("USD"); // default selection can be "USD" or "LBP"
    let [calcResult, setCalcResult] = useState(null);
    let [userTransactions, setUserTransactions] = useState([]); // Add this line

    const States = {
        PENDING: "PENDING",
        USER_CREATION: "USER_CREATION",
        USER_LOG_IN: "USER_LOG_IN",
        USER_AUTHENTICATED: "USER_AUTHENTICATED",
    };
    let [authState, setAuthState] = useState(States.PENDING);

    function fetchRates() {
        fetch(`${SERVER_URL}/exchangeRate`)
            .then(response => response.json())
            .then(data => {
                setBuyUsdRate(data.lbp_to_usd);
                setSellUsdRate(data.usd_to_lbp);
            })
            .catch(error => console.error("Error fetching rates:", error));
    }

    function login(username, password) {
        return fetch(`${SERVER_URL}/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_name: username,
                password: password,
            }),
        })
            .then((response) => response.json())
            .then((body) => {
                setAuthState(States.USER_AUTHENTICATED);
                setUserToken(body.token);
                saveUserToken(body.token);
            });
    }

    function createUser(username, password) {
        return fetch(`${SERVER_URL}/user`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_name: username,
                password: password,
            }),
        }).then((response) => login(username, password)); // Login immediately after creating user
    }

    function logout() {
        setUserToken(null);
        clearUserToken();
    }

    // --- INSERT fetchUserTransactions FUNCTION HERE ---
    const fetchUserTransactions = useCallback(() => {
        if (!userToken) { // Don't fetch if userToken is null (not logged in)
            setUserTransactions([]); // Clear existing transactions if logged out
            return;
        }
        fetch(`${SERVER_URL}/transaction`, {
            headers: {
                Authorization: `Bearer ${userToken}`, // Include user token in header
            },
        })
            .then((response) => response.json())
            .then((transactions) => setUserTransactions(transactions));
    }, [userToken]); // Dependency array: function will re-create only when userToken changes


    useEffect(() => {
        fetchUserTransactions(); // Call fetchUserTransactions when component mounts and when fetchUserTransactions (and thus userToken) changes
    }, [fetchUserTransactions]); // Dependency array: effect runs when fetchUserTransactions function reference changes (which happens when userToken changes)


    useEffect(fetchRates, []);


    function addItem() {
        try {
            const usdAmount = parseFloat(usdInput);
            const lbpAmount = parseFloat(lbpInput);

            if (isNaN(usdAmount) || isNaN(lbpAmount)) {
                console.error("Please enter valid numbers for both USD and LBP amounts.");
                return;
            }

            const isUsdToLbp = (transactionType === "usd-to-lbp");

            let transaction = {
                usd_amount: usdAmount,
                lbp_amount: lbpAmount,
                usd_to_lbp: isUsdToLbp
            };

            let fetchOptions = { // Create an options object for fetch
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(transaction)
            };

            if (userToken) { // Check if userToken exists (user is logged in)
                fetchOptions.headers["Authorization"] = `Bearer ${userToken}`; // Add Authorization header if logged in
            }
            fetch(`${SERVER_URL}/transaction`, fetchOptions) // Use fetchOptions in fetch call
                .then(response => response.json())
                .then(data => {
                    console.log("Transaction added:", data);
                    fetchRates();  // Refresh exchange rates after adding transaction
                })
                .catch(error => console.error("Error in fetch:", error));

        } catch (error) {
            console.error('Error adding Transaction:', error);
        }
    }

    function calculateConversion() {
        const amount = parseFloat(calcAmount);
        if (isNaN(amount)) {
            setCalcResult("Invalid amount");
            return;
        }

        let result;
        if (calcCurrency === "SELL") {
            // When converting USD to LBP, use the sellUsdRate (assumes selling USD gives you LBP)
            if (sellUsdRate) {
                result = amount * sellUsdRate;
            } else {
                result = "Rate unavailable";
            }
        } else if (calcCurrency === "BUY") {
            // When converting LBP to USD, use the buyUsdRate (assumes buying USD using LBP)
            if (buyUsdRate) {
                result = amount * buyUsdRate;
            } else {
                result = "Rate unavailable";
            }
        }
        setCalcResult(result);
    }

    return (
        <div className="App">
            <Toolbar classes={{ root: "nav" }}>
                <Typography variant="h5">Bloomberg Exchange Platform</Typography>
                {userToken !== null ? (
                    <Button color="inherit" onClick={logout}>
                        Logout
                    </Button>
                ) : (
                    <div>
                        <Button color="inherit" onClick={() => setAuthState(States.USER_CREATION)}>
                            Register
                        </Button>
                        <Button color="inherit" onClick={() => setAuthState(States.USER_LOG_IN)}>
                            Login
                        </Button>
                    </div>
                )}
            </Toolbar>

            <UserCredentialsDialog
                open={authState === States.USER_CREATION}
                title="Register"
                submitText="Register"
                onSubmit={createUser}
                onClose={() => setAuthState(States.PENDING)}
            />

            <UserCredentialsDialog
                open={authState === States.USER_LOG_IN}
                title="Login"
                submitText="Login"
                onSubmit={login}
                onClose={() => setAuthState(States.PENDING)}
            />

            <Snackbar
                elevation={6}
                variant="filled"
                open={authState === States.USER_AUTHENTICATED}
                autoHideDuration={2000}
                onClose={() => setAuthState(States.PENDING)}
            >
                <Alert severity="success">Success</Alert>
            </Snackbar>

            {/* First Section: Exchange Rates and Calculator */}
            <div className="wrapper">
                <Typography variant="h4">Today's Exchange Rate</Typography>
                <Typography variant="subtitle1">LBP to USD Exchange Rate</Typography>
                <Typography variant="h6">
                    Buy USD: <span id="buy-usd-rate">{buyUsdRate ? `${buyUsdRate.toFixed(2)} LBP per 1 USD` : "Not available yet"}</span>
                </Typography>
                <Typography variant="h6">
                    Sell USD: <span id="sell-usd-rate">{sellUsdRate ? `${sellUsdRate.toFixed(2)} LBP per 1 USD` : "Not available yet"}</span>
                </Typography>

                <hr />

                {/* Calculator UI */}
                <Typography variant="h5">Currency Calculator</Typography>
                <div className="calculator">
                    <TextField
                        label="Amount"
                        type="number"
                        variant='outlined'
                        value={calcAmount}
                        onChange={(e) => setCalcAmount(e.target.value)}
                        style={{ marginRight: 10 }}
                    />
                    <Select
                        value={calcCurrency}
                        onChange={(e) => setCalcCurrency(e.target.value)}
                        style={{ marginRight: 10, minWidth: 120 }}
                    >
                        <MenuItem value="SELL">Sell USD</MenuItem>
                        <MenuItem value="BUY">Buy USD</MenuItem>
                    </Select>
                    <Button variant="contained" color="primary" onClick={calculateConversion}>
                        Calculate
                    </Button>
                    {calcResult !== null && (
                        <Typography variant="body1" style={{ marginTop: 10 }}>
                            Result: {calcResult}
                        </Typography>
                    )}
                </div>

            </div>

            {/* Second Section: Transaction Form */}
            <div className="wrapper">
                <Typography variant="h4">Record a Recent Transaction</Typography>
                <form name="transaction-entry">
                    <div className="amount-input">
                        <label htmlFor="lbp-amount">LBP Amount</label>
                        <input
                            id="lbp-amount"
                            type="number"
                            value={lbpInput}
                            onChange={(e) => setLbpInput(e.target.value)}
                        />
                    </div>

                    <div className="amount-input">
                        <label htmlFor="usd-amount">USD Amount</label>
                        <input
                            id="usd-amount"
                            type="number"
                            value={usdInput}
                            onChange={(e) => setUsdInput(e.target.value)}
                        />
                    </div>

                    <select
                        id="transaction-type"
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value)}
                    >
                        <option value="usd-to-lbp">USD to LBP</option>
                        <option value="lbp-to-usd">LBP to USD</option>
                    </select>
                    <button id="add-button" className="button" type="button" onClick={addItem}>
                        Add
                    </button>
                </form>
            </div>
            {userToken && ( // Conditional rendering: only show if userToken exists (user is logged in)
                <div className="wrapper">
                    <Typography variant="h4">Your Transactions</Typography>
                    <div style={{ height: 400, width: '100%' }}> {/* Added a div for DataGrid styling */}
                        <DataGrid
                            rows={userTransactions} // Pass userTransactions as rows to DataGrid
                            columns={[ // Define columns for the DataGrid
                                { field: 'id', headerName: 'ID', width: 70 }, // Assuming your transaction objects have an 'id'
                                { field: 'usd_amount', headerName: 'USD Amount', width: 150 },
                                { field: 'lbp_amount', headerName: 'LBP Amount', width: 150 },
                                { field: 'usd_to_lbp', headerName: 'USD to LBP', width: 150 },
                                {
                                    field: 'transaction_time',
                                    headerName: 'Time',
                                    width: 200,
                                    valueFormatter: (params) => {
                                      if (!params || !params.value) {
                                        return "";
                                      }
                                      return new Date(params.value).toLocaleString();
                                    }
                                },
                                // Add more columns as needed based on your transaction data structure
                            ]}
                            getRowId={(row) => row.id} // Specify how to get unique ID for each row (assuming 'id' field)
                            autoHeight // Make DataGrid height adjust to content
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
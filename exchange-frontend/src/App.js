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

var SERVER_URL = "http://192.168.26.79:5000"; // The Windows machine's IP as the backend run there

function App() {
    let [buyUsdRate, setBuyUsdRate] = useState(null);
    let [sellUsdRate, setSellUsdRate] = useState(null);
    let [lbpInput, setLbpInput] = useState("");
    let [usdInput, setUsdInput] = useState("");
    let [transactionType, setTransactionType] = useState("usd-to-lbp");
    let [userToken, setUserToken] = useState(getUserToken()); // Initialize from local storage
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

            fetch(`${SERVER_URL}/transaction`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(transaction)
            })
            .then(response => response.json())
            .then(data => {
                console.log("Transaction added:", data);
                fetchRates();  // Refresh the exchange rates after posting the transaction
            })
            .catch(error => console.error("Error in fetch:", error));

        } catch (error) {
            console.error('Error adding Transaction:', error);
        }
    }

    return (
    <div className="App">
        {/* <div className="header">
            <h1>Bloomberg Exchange Platform</h1>
        </div> */}
        {/* <Toolbar classes={{root: "nav"}}>
            <Typography variant="h5"></Typography>
            <div>
                <Button color="inherit" onClick={() => setAuthState(States.USER_CREATION)}>Register</Button>
                <Button color="inherit" onClick={() => setAuthState(States.USER_LOG_IN)}>Login</Button>
            </div>
        </Toolbar> */}

        <Toolbar classes={{ root: "nav" }}>
            <Typography variant="h5">Bloomberg Exchange Platform</Typography>
            {userToken !== null ? ( // Conditional rendering starts here
                <Button color="inherit" onClick={logout}>
                    Logout
                </Button>
            ) : (
                <div>
                    <Button
                        color="inherit"
                        onClick={() => setAuthState(States.USER_CREATION)}
                    >
                        Register
                    </Button>
                    <Button
                        color="inherit"
                        onClick={() => setAuthState(States.USER_LOG_IN)}
                    >
                        Login
                    </Button>
                </div>
            )} {/* Conditional rendering ends here */}
        </Toolbar>

        <UserCredentialsDialog
            open={authState === States.USER_CREATION}
            title="Register"
            submitText="Register"
            onSubmit={createUser} 
            onClose={() => setAuthState(States.PENDING)} 
        />

        <UserCredentialsDialog
            open={authState === States.USER_LOG_IN}       // Open when authState is USER_LOG_IN
            title="Login"
            submitText="Login"
            onSubmit={login} 
            onClose={() => setAuthState(States.PENDING)}   // onClose to reset state
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

          
        <div className="wrapper">
            <h2>Today's Exchange Rate</h2>
            <p>LBP to USD Exchange Rate</p>
            <h3>Buy USD: <span id="buy-usd-rate">{buyUsdRate ? `${buyUsdRate.toFixed(2)} LBP per 1 USD` : "Not available yet"}</span></h3>
            <h3>Sell USD: <span id="sell-usd-rate">{sellUsdRate ? `${sellUsdRate.toFixed(2)} LBP per 1 USD` : "Not available yet"}</span></h3>
            
            <hr />
            
            <h2>Record a recent transaction</h2>
            <form name="transaction-entry">
                <div className="amount-input">
                    <label htmlFor="lbp-amount">LBP Amount</label>
                    <input id="lbp-amount" type="number" value={lbpInput} onChange={e => setLbpInput(e.target.value)}/>
                </div>
                
                <div className="amount-input">
                    <label htmlFor="usd-amount">USD Amount</label>
                    <input id="usd-amount" type="number" value={usdInput} onChange={e => setUsdInput(e.target.value)}/>
                </div>
                
                <select id="transaction-type" value={transactionType} onChange={e => setTransactionType(e.target.value)}>
                    <option value="usd-to-lbp">USD to LBP</option>
                    <option value="lbp-to-usd">LBP to USD</option>
                </select>
                <button id="add-button" className="button" type="button" onClick={addItem}>Add</button>
            </form>
        </div>
    </div>
  );
}

export default App;

import './App.css';
import React, { useState, useCallback, useEffect } from "react";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { DataGrid } from '@mui/x-data-grid';
import UserCredentialsDialog from './UserCredentialsDialog/UserCredentialsDialog';
import { getUserToken, saveUserToken, clearUserToken } from "./localStorage";

const SERVER_URL = "http://192.168.1.208:5000"; // Backend URL

function App() {
  // Exchange rate and transaction form states
  const [buyUsdRate, setBuyUsdRate] = useState(null);
  const [sellUsdRate, setSellUsdRate] = useState(null);
  const [lbpInput, setLbpInput] = useState("");
  const [usdInput, setUsdInput] = useState("");
  const [transactionType, setTransactionType] = useState("usd-to-lbp");

  // Authentication state & persistence
  const [userToken, setUserToken] = useState(getUserToken());
  const AuthStates = {
    PENDING: "PENDING",
    USER_CREATION: "USER_CREATION",
    USER_LOG_IN: "USER_LOG_IN",
    USER_AUTHENTICATED: "USER_AUTHENTICATED",
  };
  const [authState, setAuthState] = useState(AuthStates.PENDING);

  // Rate calculator states
  const [calcAmount, setCalcAmount] = useState("");
  const [calcCurrency, setCalcCurrency] = useState("USD");
  const [calcResult, setCalcResult] = useState(null);

  // User transactions state
  const [userTransactions, setUserTransactions] = useState([]);

  // Fetch exchange rates from backend
  const fetchRates = () => {
    fetch(`${SERVER_URL}/exchangeRate`)
      .then(response => response.json())
      .then(data => {
        setBuyUsdRate(data.lbp_to_usd);
        setSellUsdRate(data.usd_to_lbp);
      })
      .catch(error => console.error("Error fetching rates:", error));
  };

  // Login and registration API calls
  const login = (username, password) => {
    return fetch(`${SERVER_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: username, password: password }),
    })
      .then(response => response.json())
      .then(body => {
        setAuthState(AuthStates.USER_AUTHENTICATED);
        setUserToken(body.token);
        saveUserToken(body.token);
      });
  };

  const createUser = (username, password) => {
    return fetch(`${SERVER_URL}/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_name: username, password: password }),
    }).then(() => login(username, password));
  };

  const logout = () => {
    setUserToken(null);
    clearUserToken();
  };

  // Fetch user transactions when token is available
  const fetchUserTransactions = useCallback(() => {
    if (!userToken) {
      setUserTransactions([]);
      return;
    }
    fetch(`${SERVER_URL}/transaction`, {
      headers: { Authorization: `Bearer ${userToken}` },
    })
      .then(response => response.json())
      .then(transactions => setUserTransactions(transactions))
      .catch(error => console.error("Error fetching transactions:", error));
  }, [userToken]);

  useEffect(() => {
    fetchUserTransactions();
  }, [fetchUserTransactions]);

  useEffect(fetchRates, []);

  // Function to add a new transaction
  const addItem = () => {
    try {
      const usdAmount = parseFloat(usdInput);
      const lbpAmount = parseFloat(lbpInput);
      if (isNaN(usdAmount) || isNaN(lbpAmount)) {
        console.error("Please enter valid numbers for both USD and LBP amounts.");
        return;
      }
      const isUsdToLbp = (transactionType === "usd-to-lbp");
      const transaction = { usd_amount: usdAmount, lbp_amount: lbpAmount, usd_to_lbp: isUsdToLbp };

      const fetchOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      };
      if (userToken) {
        fetchOptions.headers["Authorization"] = `Bearer ${userToken}`;
      }
      fetch(`${SERVER_URL}/transaction`, fetchOptions)
        .then(response => response.json())
        .then(data => {
          console.log("Transaction added:", data);
          fetchRates();
        })
        .catch(error => console.error("Error in fetch:", error));
    } catch (error) {
      console.error("Error adding Transaction:", error);
    }
  };

  // Function to perform currency conversion
  const calculateConversion = () => {
    const amount = parseFloat(calcAmount);
    if (isNaN(amount)) {
      setCalcResult("Invalid amount");
      return;
    }
    let result;
    if (calcCurrency === "SELL") {
      result = sellUsdRate ? (amount * sellUsdRate).toFixed(2) : "Rate unavailable";
    } else if (calcCurrency === "BUY") {
      result = buyUsdRate ? (amount * buyUsdRate).toFixed(2) : "Rate unavailable";
    }
    setCalcResult(result);
  };

  return (
    <div className="App">
      <Toolbar classes={{ root: "nav" }}>
        <Typography variant="h5">Bloomberg Exchange Platform</Typography>
        {userToken ? (
          <Button color="inherit" onClick={logout}>Logout</Button>
        ) : (
          <div>
            <Button color="inherit" onClick={() => setAuthState(AuthStates.USER_CREATION)}>Register</Button>
            <Button color="inherit" onClick={() => setAuthState(AuthStates.USER_LOG_IN)}>Login</Button>
          </div>
        )}
      </Toolbar>

      <UserCredentialsDialog
        open={authState === AuthStates.USER_CREATION}
        title="Register"
        submitText="Register"
        onSubmit={createUser}
        onClose={() => setAuthState(AuthStates.PENDING)}
      />

      <UserCredentialsDialog
        open={authState === AuthStates.USER_LOG_IN}
        title="Login"
        submitText="Login"
        onSubmit={login}
        onClose={() => setAuthState(AuthStates.PENDING)}
      />

      <Snackbar
        elevation={6}
        variant="filled"
        open={authState === AuthStates.USER_AUTHENTICATED}
        autoHideDuration={2000}
        onClose={() => setAuthState(AuthStates.PENDING)}
      >
        <Alert severity="success">Success</Alert>
      </Snackbar>

      {/* First Section: Exchange Rates & Calculator */}
      <div className="wrapper">
        <Typography variant="h4">Today's Exchange Rate</Typography>
        <Typography variant="subtitle1">LBP to USD Exchange Rate</Typography>
        <Typography variant="h6">
          Buy USD: <span id="buy-usd-rate">
            {buyUsdRate ? `${buyUsdRate.toFixed(2)} LBP per 1 USD` : "Not available yet"}
          </span>
        </Typography>
        <Typography variant="h6">
          Sell USD: <span id="sell-usd-rate">
            {sellUsdRate ? `${sellUsdRate.toFixed(2)} LBP per 1 USD` : "Not available yet"}
          </span>
        </Typography>

        <hr />

        <Typography variant="h5">Currency Calculator</Typography>
        <div className="calculator">
          <TextField
            label="Amount"
            type="number"
            variant="outlined"
            value={calcAmount}
            onChange={(e) => setCalcAmount(e.target.value)}
          />
          <Select
            value={calcCurrency}
            onChange={(e) => setCalcCurrency(e.target.value)}
            variant="outlined"
            style={{ minWidth: 120 }}
          >
            <MenuItem value="SELL">Sell USD</MenuItem>
            <MenuItem value="BUY">Buy USD</MenuItem>
          </Select>
          <Button variant="contained" color="primary" onClick={calculateConversion}>
            Calculate
          </Button>
        </div>
        {calcResult !== null && (
          <Typography variant="body1" style={{ marginTop: 10 }}>
            Result: {calcResult}
          </Typography>
        )}
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

      {/* Third Section: Display User Transactions */}
      {userToken && (
        <div className="wrapper">
          <Typography variant="h4">Your Transactions</Typography>
          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={userTransactions}
              columns={[
                { field: 'id', headerName: 'ID', width: 70 },
                { field: 'usd_amount', headerName: 'USD Amount', width: 150 },
                { field: 'lbp_amount', headerName: 'LBP Amount', width: 150 },
                { field: 'usd_to_lbp', headerName: 'USD to LBP', width: 150 },
                {
                  field: 'transaction_time',
                  headerName: 'Time',
                  width: 200,
                  valueFormatter: (params) => {
                    if (!params || !params.value) return "";
                    return new Date(params.value).toLocaleString();
                  },
                },
              ]}
              getRowId={(row) => row.id}
              autoHeight
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

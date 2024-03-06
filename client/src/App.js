import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const server_url = process.env.REACT_APP_SERVER_URL;
  console.log(`process.env.REACT_APP_SERVER_URL: ${server_url}`);
  const [alerts, setAlerts] = useState([]);
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    const fetchAlerts = () => {
      fetch(`${server_url}/alerts`)
        .then(response => response.json())
        .then(alerts => setAlerts(alerts))
        .catch(error => console.error('Error fetching data:', error));
    };
  
    fetchAlerts();
  
    const intervalId = setInterval(fetchAlerts, 5000);
  
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchBlocks= () => {
      fetch(`${server_url}/blocks`)
      .then(response => response.json())
      .then(blocks => setBlocks(blocks))
      .catch(error => console.error('Error fetching data:', error));
    };
  
    fetchBlocks();
  
    const intervalId = setInterval(fetchBlocks, 5000);
  
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
      <h1>Data from Blockchain monitoring MongoDB</h1>
        <h2>Alerts</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr > 
                <th>Block Number</th>
                <th>Alert Message</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(item => (
                <tr key={item._id}>
                  <td>{item.blockNumber}</td>
                  <td>{item.alertMsg}</td>
                  <td>{new Date(item.created).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2>Blocks Analysis</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr > 
                <th>Block Number</th>
                <th>High gas usage transactions</th>
                <th>TPS</th>
                <th>Block Mining Time</th>
                <th>Failed transactions</th>
                <th>Contract creations</th>
                <th>High value transactions</th>
                <th>Average Gas Price Volatility</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map(item => (
                <tr key={item._id}>
                  <td>{item.blockNumber}</td>
                  <td>{item.transactionsWithHighGasUsageCount}</td>
                  <td>{item.transactionsPerSecond}</td>
                  <td>{item.blockMiningTime}</td>
                  <td>{item.failedTransactionsCount}</td>
                  <td>{item.contractCreationCount}</td>
                  <td>{item.highValueTransactions}</td>
                  <td>{item.averageGasPriceVolatility}</td>
                  <td>{new Date(item.created).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </header>
    </div>
  );
}

export default App;

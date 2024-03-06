# Blockchain Monitoring Agent

This repository contains the source code for a **prototype** of a Blockchain Monitoring Agent, a comprehensive solution designed to monitor blockchain transactions and analyze data for insights. Built with Node.js and leveraging ethers.js for blockchain interaction, this project employs MongoDB for persisting analysis results and a React application for data visualization.

## Overview

The Blockchain Monitoring Agent automates the process of tracking and analyzing transactions on the Ethereum blockchain. It captures transaction details, evaluates them based on predefined criteria (e.g., transaction value, gas usage), and stores the analysis results in MongoDB. These results are then displayed in an interface built with React, offering insights into transaction patterns, potential anomalies, and trends.

### Features

* Real-time Transaction Monitoring: Tracks every new transaction on the Ethereum blockchain, capturing essential details for analysis.
* Criteria-based Analysis: Evaluates transactions against set thresholds, such as high-value transactions and gas usage, to flag noteworthy activities.
* Persistent Storage: Analysis results are stored in MongoDB, enabling long-term data accumulation and trend analysis.
* Data Visualization: A React-based frontend presents the analyzed data through a series of interactive charts and tables, offering insights at a glance.
* Automated Alerts: Configurable alerts notify users of detected anomalies or transactions of interest, based on the analysis criteria.

## Technology Stack

* Node.js: Serves as the backbone of the agent, handling blockchain interaction, data analysis, and server-side logic.
* Ethers.js: A library used for Ethereum blockchain interactions, including reading blockchain states and listening for new transactions. Leverages Infura Application Programming Interface (https://docs.infura.io/api) for this purpose.
* MongoDB: A NoSQL database used for storing transaction data and analysis results, chosen for its scalability and flexibility.
* React: Powers the frontend application, providing a dynamic and responsive interface for data visualization.
* Docker: Utilized for containerizing the application, ensuring easy deployment and scalability.

## Setup Instructions (Open Nodes)

This repository contains a **Dockerfile** per each of the components that include the solution:

* agent
* client
* server
* mongo

And a **docker-compose.yml** file that builds, configures and runs each of these components. In order to execute the application it will be necessary to open a command line interface, place of on the root path of the repository and run the following command:

```
docker-compose up -d
```

Once the system is running, it will automatically begin monitoring transactions on the Ethereum blockchain, analyzing them, and storing the results in MongoDB. Access the React application (http://localhost:80) in your web browser to view the analyzed data and insights.

## Metric Justification

#### High-Value Transactions
Monitoring high-value transactions helps in identifying significant movements of funds, which could indicate market-moving events or suspicious activities. By flagging these transactions, the monitoring agent can provide valuable insights for both financial analysis and security purposes.
#### Gas Usage and Trends
Gas fees are a critical aspect of Ethereum's economy. Monitoring gas usage and trends helps users understand the cost implications of transactions and smart contract interactions. It can also highlight periods of network congestion, offering insights into Ethereum's scalability challenges and user behavior.
#### Contract Creation Activities
Tracking contract creation transactions is key to understanding the growth and development trends within the Ethereum ecosystem. This metric can signal the launch of new projects or platforms, offering early insights into potential shifts in the blockchain landscape.
#### Failed Transactions
A high rate of failed transactions may indicate issues within the network, smart contract bugs, or attempts to exploit system vulnerabilities. Monitoring this metric helps in maintaining network integrity and identifying areas for improvement.
#### Transactions Per Second (TPS)
The TPS rate is a fundamental indicator of the blockchain's performance and capacity. Monitoring TPS helps in assessing the network's ability to handle growth and scalability solutions, crucial for both developers and users making informed decisions about using Ethereum.
#### Gas price volatility
Average gas price volatility is a significant metric for analyzing the Ethereum blockchain's behavior, especially for users interacting with smart contracts and performing transactions. Gas prices on Ethereum fluctuate based on network demand and transaction complexity. High volatility in gas prices can impact the cost-effectiveness of executing transactions and deploying or interacting with smart contracts.

## Approach Explanation

I chose to monitor a real blockchain network because of the following advantages:

* Real Data and Transactions: Monitoring a mainnet provides insights into actual user behavior, transaction patterns, and network dynamics. This data is invaluable for understanding economic activity, security threats, and the overall health of the network.
* Security Analysis: Monitoring real transactions and blocks allows for the detection of malicious activities, vulnerabilities being exploited, or unusual patterns that could indicate security threats.
* Economic Insights: By analyzing real transaction fees, gas prices, and token transfers, stakeholders can gain insights into the economic aspects of the blockchain, such as network congestion, the popularity of dApps, or the movement of large sums.

## Local Blockchain Network (Truffle Suite + Ganache)

I've setup a local ethereum blockchain network in order to learn and understand the capabilities and options that these tools can give and these are my main conclusions: Truffle and Ganache, provide a powerful environment for developing, testing, and deploying smart contracts on the Ethereum blockchain. It's particularly useful for setting up a local blockchain network, which is an invaluable asset for developers seeking a controlled and safe environment to work in.
Advantages:

* Rapid Development Cycle: Instant feedback on smart contracts' behavior and easy debugging facilitate a quicker development cycle.
* Safe Testing Environment: Test smart contracts with various scenarios in a risk-free environment without spending real ETH.
* Realistic Conditions: Although it's a local network, Ganache simulates real blockchain conditions, allowing developers to estimate gas costs, test transactions, and interact with smart contracts as if on the mainnet or testnet.


## Future enhancements of the application:

* Save the received blocknumbers on a mongodb collection and implement a job that runs in the background that processes the received blocks. This job will need to have the proper retry mechanism so any processing failure is properly retried.
* The listener that is monitoring the new block minting transactions relies on WebSocket technology in order to monitor real time activity of the blockchain, so, if for any reason the agent crashes it will be interesting to implement an autoscaling system that can ensure the reliability of the system and no events are missed. In order to achieve this it will be possible to use for instance the pm2 process manager that restarts the agent in case of failure. Additionaly, a cluster of kubernetes could be setup ensuring that several pod replicas are running. Deploying the agent into any cloud hosting service will allow to leverage the tools these systems offer in terms of management a autoscaling of the application.
* Implement transactionality.
* Add a proper logging system, ELK or similar.
* Analyze historical data in order to properly configure the different threshold variables.
* Improve the frontend application in order to adjust the different thresholds and modifiers.
* Increment the total amount of unit and integration tests.
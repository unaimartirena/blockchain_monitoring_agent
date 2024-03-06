# Use an official Node.js runtime as a parent image, based on Alpine Linux
FROM node:alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) into the working directory
COPY package*.json ./

# Install any dependencies
RUN npm install

# Bundle the app source inside the Docker image
COPY --chown=node:node . .

# Define the command to run your app using CMD which defines your runtime
CMD ["node", "agent.js"]

# build docker image: docker build -t blockchain-monitoring-agent .
# run the docker container: docker run -d --name blockchain-monitoring-agent --network blockchain-network blockchain-monitoring-agent



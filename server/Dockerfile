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

# Your app binds to port 3000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 3001

# Define the command to run your app using CMD which defines your runtime
CMD ["node", "server.js"]

# build docker image: docker build -t blockchain-monitoring-server .
# run the docker container: docker run -d --name blockchain-monitoring-server --network blockchain-network -p 3001:3001 blockchain-monitoring-server
# run mongo docker container: docker run --name my-mongo --network blockchain-network -p 27017:27017 -d mongo --bind_ip_all



# Stage 1: Build the React application
FROM node:latest as build-stage 

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Set environment variables
ARG REACT_APP_SERVER_URL
ENV REACT_APP_SERVER_URL=$REACT_APP_SERVER_URL

# Build the app
RUN npm run build

# Stage 2: Serve the app with nginx
FROM nginx:stable-alpine as serve-stage

# Copy the build output to replace the default nginx contents.
COPY --from=build-stage /app/build /usr/share/nginx/html

# Expose port 80 to the Docker host, so we can access it 
# from the outside.
EXPOSE 80

# The default command of nginx image starts the server automatically.
CMD ["nginx", "-g", "daemon off;"]

# build docker image: docker build -t blockchain-monitoring-client .
# run the docker container: docker run -d --name blockchain-monitoring-client --network blockchain-network -p 3000:3000 blockchain-monitoring-client

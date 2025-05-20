# Use a specific Node.js base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY src ./src
COPY .env ./.env 

# Expose the port your app runs on
EXPOSE 5001

# Define the entrypoint using Node directly
ENTRYPOINT ["node"]
# Define the command to execute
CMD ["src/server.js"]
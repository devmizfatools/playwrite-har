# Use a node base image
FROM node:18-bullseye-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json .
COPY package-lock.json .
RUN npm install
RUN npx playwright install
RUN npx playwright install-deps
RUN npx playwright install chromium

# Bundle app source
COPY . .

# Run the app
CMD ["npm", "start"]

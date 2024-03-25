FROM node:16-alpine

# Create application directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy remaining application files
COPY . .

# Expose necessary port
EXPOSE 3009

# Run app.js
CMD ["npm", "start"]
# Development stage
FROM node:18 AS development

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the code
COPY . .

# Build the TypeScript code
RUN npm run build || (echo "Build failed. Check the errors above." && exit 1)

# Command to run the app in development mode
CMD ["npm", "run", "dev"]

# Production stage
FROM node:18 AS production

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built JavaScript files from development stage
COPY --from=development /usr/src/app/dist ./dist

# Command to run the app
CMD ["node", "dist/index.js"]
FROM node:lts-alpine
# Set the working directory
WORKDIR /usr/src/app
# Copy the entire project directory
COPY . .
# Copy package.json and package-lock.json
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "tsconfig.json", "./"]
# Install all dependencies including devDependencies
RUN npm install --silent
# Copy the rest of the application code
COPY . .
# Build the TypeScript code
RUN npm run build
# Set the environment to production
ENV NODE_ENV=production
# Move node_modules to the parent directory
RUN mv node_modules ../
# Expose the application port
EXPOSE 3000
# Change ownership of the application files
RUN chown -R node /usr/src/app
# Switch to the node user
USER node
# Start the application
CMD ["npm", "start"]

FROM node:16.15.0 as build
WORKDIR /app
ENV PATH /app/node_modules/ .bin:$PATH
#COPY package-lock.jason ./
RUN npm install
COPY . ./
RUN npm run test
#Run npx eas-cli build --profile preview --platform android --non intractive

FROM node:16.15.0 as build
# WORKDIR /app
# ENV PATH /app/node_modules/ .bin:$PATH
# #COPY package-lock.json ./
# COPY package.json ./
# RUN npm install
# COPY . ./
# RUN npm run test
#Run npx eas-cli build --profile preview --platform android --non intractive



ARG EXPO_TOKEN   ENV EXPO_TOKEN $EXPO_TOKEN
WORKDIR /app   
ENV PATH /app/node_modules/.bin:$PATH   
COPY package.json ./   
# COPY package-lock.json ./   
RUN npm install   
COPY . ./   
RUN npm run test   
RUN rm ./package-lock.json   
RUN npm install eas-cli -g   
# -g == --global   
RUN npx eas-cli build --profile preview --platform android --non-interactive# build environment
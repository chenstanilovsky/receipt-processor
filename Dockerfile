FROM node:latest

WORKDIR /receipt-processor

COPY . .

RUN npm install
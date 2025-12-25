FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 5173
ENTRYPOINT ["npm"]
CMD ["run", "dev"]

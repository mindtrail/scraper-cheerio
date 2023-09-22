FROM node:20-alpine

# tree for debugging
RUN apk update

WORKDIR /scraper

COPY package*.json ./

RUN npm install

ENV NODE_ENV=production

COPY . .

ENV NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

EXPOSE 80

# Run the image.
CMD npm run start
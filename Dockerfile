FROM node:20-alpine
# RUN apt-get update
    # && apt-get install -y

# tree for debugging
RUN apt-get update

ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /scraper

COPY package*.json ./

RUN npm install

ENV NODE_ENV=production

COPY . .

ENV NODE_OPTIONS="--max_old_space_size=30000 --max-http-header-size=80000"

EXPOSE 80

# Run the image.
CMD npm run start
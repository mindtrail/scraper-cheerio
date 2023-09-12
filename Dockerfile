FROM node:lts-bullseye
# RUN apt-get update
    # && apt-get install -y

# tree for debugging
RUN apt-get update

RUN apt-get install curl -y

RUN curl -fsSLo /usr/share/keyrings/brave-browser-archive-keyring.gpg https://brave-browser-apt-release.s3.brave.com/brave-browser-archive-keyring.gpg

RUN echo "deb [signed-by=/usr/share/keyrings/brave-browser-archive-keyring.gpg] https://brave-browser-apt-release.s3.brave.com/ stable main"| tee /etc/apt/sources.list.d/brave-browser-release.list

RUN apt-get update

RUN apt-get install brave-browser -y

# Install Node Version Manager
# RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
# RUN . ~/.nvm/nvm.sh

# Install Node.js LTS version (18.x)
# RUN nvm install --lts

ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /scraper

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80

# Run the image.
CMD npm run start
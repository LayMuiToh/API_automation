FROM node:10.16-stretch-slim as test-base
WORKDIR /test/src

RUN apt-get update && apt-get install -y \
  curl \ 
  python3 \
  python3-pip \
  bash \
  && rm -rf /var/lib/apt/lists/* \ 
  && pip3 install awscli s3cmd --upgrade 

FROM test-base AS test-bed
COPY ./src .
WORKDIR /test/src
RUN npm install


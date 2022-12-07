FROM registry.cn-hangzhou.aliyuncs.com/cheersun/nodejs-base:14-build as build
WORKDIR $BUILD

ADD ./package.json $BUILD/package.json
ADD ./.npmrc $BUILD/.npmrc
ADD ./.yarnrc $BUILD/.yarnrc
ADD ./npm-shrinkwrap.json $BUILD/npm-shrinkwrap.json
RUN npm run pci \
 && tar -cf /home/node_modules.prod.tar node_modules package.json \
 && mv node_modules /tmp/ \
 && npm run ci

COPY . $BUILD
RUN wget http://www.cheersun.net:10010/version/cheersun-dms-front-release.json -O $BUILD/static/release.json \
 && rm -rf tsconfig.json \
 && mv tsconfig.prod.json tsconfig.json \
 && tsc \
 && npm run build \
 && mv ./server/utils/routes.json ./server-js/server/utils/routes.json \
 && cd $BUILD \
 && tar -cf /home/code.tar server-js .nuxt nuxt.config.js static assets middleware pages

FROM registry.cn-hangzhou.aliyuncs.com/cheersun/nodejs-base:14-runtime
WORKDIR $BUILD

COPY --from=build /home/code.tar $CODE/
COPY --from=build /home/node_modules.prod.tar $CODE/

ENV NODE_ENV=production \
    TZ=Asia/Shanghai \
    PROD=true

RUN cd $CODE \
 && npm install -g npm \
 && tar -xf $CODE/code.tar \
 && tar -xf $CODE/node_modules.prod.tar \
 && mv server-js/* . \
 && rm -rf node_modules.prod.tar code.tar server-js \
 && rm -rf /tmp/* /var/cache/apk/* /root/.cache \
 && mkdir -p $CODE/server/dslot \
 && mkdir -p $CODE/static/dslot

WORKDIR $CODE

VOLUME ["/sys/fs/cgroup", "/usr/local/logs", "/home/swap/files/jxd", "/usr/local/share-dir", "/usr/local/backup", "/usr/local/code/server/dslot", "/usr/local/code/static/dslot", "/usr/local/code/backend-files"]

EXPOSE 80 443 3000 4000 4001
ENTRYPOINT ["npm", "start"]

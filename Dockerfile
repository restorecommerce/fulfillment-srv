FROM node:12.18.3-stretch

# Install dependencies
RUN apt-get update && apt-get install -y libc6-dev

## CREATE APP USER ##
# Create the home directory for the new app user.
RUN mkdir -p /home/app

# Create an app user so our application doesn't run as root.
RUN groupadd -r app &&\
    useradd -r -g app -d /home/app -s /sbin/nologin -c "Docker image user" app

# Create app directory
ENV HOME=/home/app
ENV APP_HOME=/home/app/fulfillment-srv

## SETTING UP THE APP ##
WORKDIR $APP_HOME

# Chown all the files to the app user.
RUN chown -R app:app $HOME

# Change to the app user.
USER app

# Set config volumes
VOLUME $APP_HOME/cfg

# Install Dependencies
COPY --chown=app package.json $APP_HOME
COPY --chown=app package-lock.json $APP_HOME
RUN npm install

# Bundle app source
COPY --chown=app . $APP_HOME
RUN npm run build

USER root
RUN GRPC_HEALTH_PROBE_VERSION=v0.3.3 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe
USER node

HEALTHCHECK CMD ["/bin/grpc_health_probe", "-addr=:50051"]

EXPOSE 50051
CMD [ "npm", "start" ]

# To build the image:
# docker build -t restorecommerce/fullfillment-srv .
#
# To create a container:
# docker create --name fullfillment-srv --net system_default restorecommerce/fullfillment-srv
#
# To run the container:
# docker start fullfillment-srv

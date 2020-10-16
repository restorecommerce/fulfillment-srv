#!/bin/bash
docker run \
 --name fulfillment-srv \
 --hostname fulfillment-srv \
 --network=system_restorecommerce \
 -e NODE_ENV=production \
 -p 50051:50051 \
 restorecommerce/fulfillment-srv

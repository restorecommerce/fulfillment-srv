import ClusterService from '@restorecommerce/cluster-service';
import { createServiceConfig } from '@restorecommerce/service-config';

const cfg = createServiceConfig(process.cwd());
const server = new ClusterService(cfg);
server.run('./lib/worker');
process.on('SIGINT', () => {
  server.stop();
});

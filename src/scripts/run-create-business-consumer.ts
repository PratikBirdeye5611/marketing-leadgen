import { startCreateBusinessConsumer, stopCreateBusinessConsumer } from '../kafka/kafka-test.consumer';

startCreateBusinessConsumer().catch((err) => {
  console.error('Failed to start create-business consumer:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await stopCreateBusinessConsumer();
  process.exit(0);
});
process.on('SIGINT', async () => {
  await stopCreateBusinessConsumer();
  process.exit(0);
});
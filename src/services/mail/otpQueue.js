import amqp from 'amqplib';
import { env } from '../../config/env.js';
import { sendMail } from './mailer.js';
import { verificationOtpTemplate } from './templates/verificationOtp.template.js';
import { passwordResetOtpTemplate } from './templates/passwordResetOtp.template.js';

const queueName = env.RABBITMQ_OTP_QUEUE;
const retryQueueName = queueName + '.retry';
const failedQueueName = queueName + '.failed';

let connection;
let publisher;
let consumer;
let starting;

const publishConfirmed = (channel, queue, body, headers = {}) =>
  new Promise((resolve, reject) => {
    channel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(body)),
      { persistent: true, contentType: 'application/json', headers },
      (error) => (error ? reject(error) : resolve()),
    );
  });

const assertQueues = async (channel) => {
  await channel.assertQueue(queueName, { durable: true });
  await channel.assertQueue(retryQueueName, {
    durable: true,
    arguments: {
      'x-message-ttl': env.RABBITMQ_RETRY_DELAY_MS,
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': queueName,
    },
  });
  await channel.assertQueue(failedQueueName, { durable: true });
};

const renderOtpEmail = ({ type, firstName, code }) => {
  const args = { firstName, code, ttlMinutes: env.OTP_TTL_MINUTES };
  if (type === 'EMAIL_VERIFICATION') return verificationOtpTemplate(args);
  if (type === 'PASSWORD_RESET') return passwordResetOtpTemplate(args);
  throw new Error('Unsupported OTP email type: ' + type);
};

const handleMessage = async (message) => {
  if (!message) return;
  let job;

  try {
    job = JSON.parse(message.content.toString('utf8'));
    if (!job?.to || !job?.firstName || !job?.code || !job?.type) {
      throw new Error('OTP email job is missing required fields');
    }
    await sendMail({ to: job.to, ...renderOtpEmail(job) });
    consumer.ack(message);
    console.log('[mail] OTP email delivered (' + job.type + ') to ' + job.to + '.');
  } catch (error) {
    const retries = Number(message.properties.headers?.['x-retry-count'] ?? 0);
    const targetQueue = retries < env.RABBITMQ_MAX_RETRIES ? retryQueueName : failedQueueName;
    const nextRetries = retries + 1;

    try {
      await publishConfirmed(
        publisher,
        targetQueue,
        job ?? { invalidPayload: message.content.toString('utf8') },
        { 'x-retry-count': nextRetries, 'x-last-error': error.message },
      );
      consumer.ack(message);
      console.error(
        '[mail] OTP email failed; moved to ' + targetQueue + ' (attempt ' + nextRetries + '):',
        error.message,
      );
    } catch (publishError) {
      console.error('[mail] Could not schedule failed OTP email for retry:', publishError.message);
      consumer.nack(message, false, true);
    }
  }
};

const start = async () => {
  connection = await amqp.connect(env.RABBITMQ_URL);
  connection.on('error', (error) => console.error('[rabbitmq] Connection error:', error.message));
  connection.on('close', () => console.warn('[rabbitmq] Connection closed.'));
  publisher = await connection.createConfirmChannel();
  consumer = await connection.createChannel();
  await assertQueues(publisher);
  await assertQueues(consumer);
  await consumer.prefetch(env.RABBITMQ_PREFETCH);
  await consumer.consume(queueName, handleMessage, { noAck: false });
  console.log('[rabbitmq] Consuming OTP emails from ' + queueName + '.');
};

export const startOtpEmailConsumer = async () => {
  if (connection && publisher && consumer) return;
  if (!starting) {
    starting = start().finally(() => {
      starting = undefined;
    });
  }
  return starting;
};

export const enqueueOtpEmail = async (job) => {
  await startOtpEmailConsumer();
  await publishConfirmed(publisher, queueName, job);
};

export const closeOtpEmailQueue = async () => {
  const activeConnection = connection;
  connection = undefined;
  publisher = undefined;
  consumer = undefined;
  if (activeConnection) await activeConnection.close();
};

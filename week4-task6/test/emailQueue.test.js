const mockAdd = jest.fn();
const mockClose = jest.fn();

jest.mock("bullmq", () => ({
  Queue: jest.fn(() => ({ add: mockAdd, close: mockClose })),
}));

const { Queue } = require("bullmq");
const emailQueue = require("../queues/emailQueue");

describe("emailQueue", () => {
  beforeEach(() => {
    process.env.EMAIL_QUEUE_ENABLED = "true";
    mockAdd.mockResolvedValue({
      id: "confirmation-email-7",
      name: emailQueue.SEND_CONFIRMATION_EMAIL_JOB,
    });
  });

  afterAll(() => {
    delete process.env.EMAIL_QUEUE_ENABLED;
  });

  test("enqueues a confirmation job with retry and backoff defaults", async () => {
    const user = { id: 7, name: "Alice", email: "alice@example.com" };
    await emailQueue.enqueueConfirmationEmail(user, "request-123");

    expect(Queue).toHaveBeenCalledWith(
      emailQueue.EMAIL_QUEUE_NAME,
      expect.objectContaining({
        defaultJobOptions: expect.objectContaining({
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
        }),
      }),
    );
    expect(mockAdd).toHaveBeenCalledWith(
      emailQueue.SEND_CONFIRMATION_EMAIL_JOB,
      {
        userId: 7,
        name: "Alice",
        email: "alice@example.com",
        requestId: "request-123",
      },
      { jobId: "confirmation-email-7" },
    );
  });

  test("does not create a Redis connection when the queue is disabled", async () => {
    process.env.EMAIL_QUEUE_ENABLED = "false";
    mockAdd.mockClear();
    await expect(
      emailQueue.enqueueConfirmationEmail(
        { id: 8, name: "Bob", email: "bob@example.com" },
        "request-456",
      ),
    ).resolves.toBeNull();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  test("closes the lazily-created queue", async () => {
    await emailQueue.close();
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});

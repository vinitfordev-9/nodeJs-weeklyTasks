jest.mock("../config/logger", () => ({ info: jest.fn() }));

const logger = require("../config/logger");
const { SEND_CONFIRMATION_EMAIL_JOB } = require("../queues/emailQueue");
const { processEmailJob } = require("../processors/emailProcessor");

describe("emailProcessor", () => {
  const job = {
    id: "job-1",
    name: SEND_CONFIRMATION_EMAIL_JOB,
    data: {
      userId: 7,
      name: "Alice",
      email: "alice@example.com",
      requestId: "request-123",
    },
  };

  beforeEach(() => {
    process.env.EMAIL_DELIVERY_DELAY_MS = "1";
    process.env.SIMULATE_EMAIL_FAILURE = "false";
  });

  afterAll(() => {
    delete process.env.EMAIL_DELIVERY_DELAY_MS;
    delete process.env.SIMULATE_EMAIL_FAILURE;
  });

  test("processes the confirmation email job in the worker layer", async () => {
    await expect(processEmailJob(job)).resolves.toMatchObject({ delivered: true });
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: "job-1",
        requestId: "request-123",
        recipient: "alice@example.com",
      }),
      "Confirmation email delivered",
    );
  });

  test("throws provider failures so BullMQ can retry the job", async () => {
    process.env.SIMULATE_EMAIL_FAILURE = "true";
    await expect(processEmailJob(job)).rejects.toThrow(
      "Simulated email provider failure",
    );
  });

  test("rejects unknown job types", async () => {
    await expect(processEmailJob({ ...job, name: "unknown" })).rejects.toThrow(
      "Unsupported email job type: unknown",
    );
  });
});

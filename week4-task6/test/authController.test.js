jest.mock("../services/authService", () => ({ register: jest.fn() }));
jest.mock("../queues/emailQueue", () => ({
  enqueueConfirmationEmail: jest.fn(),
}));

const authService = require("../services/authService");
const emailQueue = require("../queues/emailQueue");
const authController = require("../controllers/authController");

function responseDouble() {
  return {
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
  };
}

describe("authController registration queueing", () => {
  const user = { id: 7, name: "Alice", email: "alice@example.com" };

  test("enqueues email work and responds without processing it inline", async () => {
    authService.register.mockResolvedValue(user);
    emailQueue.enqueueConfirmationEmail.mockResolvedValue({
      id: "confirmation-email-7",
      name: "send-confirmation-email",
    });
    const req = {
      body: { name: "Alice" },
      id: "request-123",
      log: { info: jest.fn(), error: jest.fn() },
    };
    const res = responseDouble();

    await authController.register(req, res, jest.fn());

    expect(emailQueue.enqueueConfirmationEmail).toHaveBeenCalledWith(
      user,
      "request-123",
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user, confirmationQueued: true });
  });

  test("keeps a successful registration successful if queueing fails", async () => {
    authService.register.mockResolvedValue(user);
    emailQueue.enqueueConfirmationEmail.mockRejectedValue(
      new Error("Redis unavailable"),
    );
    const req = {
      body: { name: "Alice" },
      id: "request-456",
      log: { info: jest.fn(), error: jest.fn() },
    };
    const res = responseDouble();

    await authController.register(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user, confirmationQueued: false });
    expect(req.log.error).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7 }),
      expect.any(String),
    );
  });
});

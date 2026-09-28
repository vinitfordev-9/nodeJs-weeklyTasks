jest.mock("sanitize-html", () =>
  jest.fn((value) =>
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, ""),
  ),
);

const { corsOptions, getAllowedOrigins } = require("../config/security");
const { sanitizeInput, sanitizeValue } = require("../middleware/sanitizeInput");

function checkOrigin(origin) {
  return new Promise((resolve) => {
    corsOptions.origin(origin, (error, allowed) => resolve({ allowed, error }));
  });
}

describe("security utilities", () => {
  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  test("getAllowedOrigins handles empty input and trims comma-separated values", () => {
    expect(getAllowedOrigins()).toEqual([]);

    process.env.ALLOWED_ORIGINS =
      " https://app.example.com, ,https://admin.example.com ";
    expect(getAllowedOrigins()).toEqual([
      "https://app.example.com",
      "https://admin.example.com",
    ]);
  });

  test("CORS allows expected origins and non-browser clients", async () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";

    await expect(checkOrigin("https://app.example.com")).resolves.toEqual({
      allowed: true,
      error: null,
    });
    await expect(checkOrigin(undefined)).resolves.toEqual({
      allowed: true,
      error: null,
    });
  });

  test("CORS rejects an unexpected origin with 403", async () => {
    process.env.ALLOWED_ORIGINS = "https://app.example.com";
    const result = await checkOrigin("https://attacker.example.com");

    expect(result.allowed).toBeUndefined();
    expect(result.error).toMatchObject({ status: 403 });
  });

  test("sanitizeValue handles primitives, arrays, XSS, and null bytes", () => {
    expect(sanitizeValue(null)).toBeNull();
    expect(sanitizeValue(0)).toBe(0);
    expect(
      sanitizeValue(["<b>One</b>", "<script>alert(1)</script>Two\0"]),
    ).toEqual(["One", "Two"]);
  });

  test("sanitizeValue removes prototype-related keys recursively", () => {
    const input = JSON.parse(
      '{"safe":"<i>value</i>","__proto__":{"polluted":true},"nested":{"constructor":"bad"}}',
    );

    expect(sanitizeValue(input)).toEqual({ safe: "value", nested: {} });
    expect({}.polluted).toBeUndefined();
  });

  test("sanitizeInput skips empty bodies and calls next", () => {
    const next = jest.fn();
    sanitizeInput({}, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("sanitizeInput cleans stored fields but preserves passwords exactly", () => {
    const password = "<strong>literal-password</strong>\0";
    const req = {
      body: {
        name: "<script>alert(1)</script>Alice\0",
        description: '<img src="x" onerror="alert(1)">Safe',
        password,
      },
    };
    const next = jest.fn();

    sanitizeInput(req, {}, next);

    expect(req.body).toEqual({
      name: "Alice",
      description: "Safe",
      password,
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});

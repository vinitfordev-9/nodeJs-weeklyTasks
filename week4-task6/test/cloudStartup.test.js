const { EventEmitter } = require("node:events");
const { startCloud } = require("../scripts/startCloud");

let spawn;
let children;
let originalExitCode;
let signalHandlers;
beforeEach(() => {
  originalExitCode = process.exitCode;
  jest.useFakeTimers();
  children = [];
  signalHandlers = {};
  jest.spyOn(process, "once").mockImplementation((signal, handler) => {
    signalHandlers[signal] = handler;
    return process;
  });
  spawn = jest.fn(() => {
    const child = new EventEmitter();
    child.kill = jest.fn();
    children.push(child);
    return child;
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  process.exitCode = originalExitCode;
});

test("starts API and worker only after migrations succeed", () => {
  startCloud(spawn);
  expect(spawn).toHaveBeenCalledTimes(1);
  expect(spawn.mock.calls[0][1]).toEqual(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  children[0].emit("close", 0);
  expect(spawn.mock.calls.slice(1).map((call) => call[1])).toEqual([
    ["server.js"], ["workers/emailWorker.js"],
  ]);
});
test("failed migrations prevent startup and fail the container", () => {
  startCloud(spawn);
  children[0].emit("close", 1);
  expect(spawn).toHaveBeenCalledTimes(1);
  expect(process.exitCode).toBe(1);
});
test("an unexpected API exit stops the worker and fails the container", () => {
  startCloud(spawn);
  children[0].emit("close", 0);
  children[1].emit("close", 0);
  expect(children[2].kill).toHaveBeenCalledWith("SIGTERM");
  expect(process.exitCode).toBe(1);
  jest.advanceTimersByTime(12000);
  expect(children[2].kill).toHaveBeenCalledWith("SIGKILL");
});
test("host shutdown forwards SIGTERM to API and worker", () => {
  startCloud(spawn);
  children[0].emit("close", 0);
  signalHandlers.SIGTERM();
  expect(children[1].kill).toHaveBeenCalledWith("SIGTERM");
  expect(children[2].kill).toHaveBeenCalledWith("SIGTERM");
  expect(process.exitCode).toBe(0);
  children[1].emit("close", 0);
  children[2].emit("close", 0);
  expect(jest.getTimerCount()).toBe(0);
});

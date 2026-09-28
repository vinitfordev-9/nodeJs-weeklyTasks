# Week 4 Task 3 verification

`npm test`: 16 suites, 141 tests passed. Statements 93.64%, branches 89.83%, functions 92.30%, lines 93.83%. The global 70% threshold passes.

Coverage includes the inherited service/security scope plus `realtime/**/*.js`. Server startup, the browser client and controllers are not part of the instrumented coverage percentage. The browser demo exercises login and HTTP order create/update through the actual controllers with an in-memory database fixture.

Run `npm test` to regenerate `coverage/index.html`. See [REALTIME.md](REALTIME.md) for Socket.IO checks.

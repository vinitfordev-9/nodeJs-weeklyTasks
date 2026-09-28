# Task 5: GitHub Actions CI

The runnable workflow is `../.github/workflows/week4-task5-ci.yml` at the
repository root. GitHub does not discover workflows nested inside task folders.
Commit both that file and `week4-task5/` when publishing this task.

## What runs

| Event | Jobs |
| --- | --- |
| Pull request opened, updated, or reopened (any target branch) | Task 5 lint and Task 5 tests |
| Push to main, including a merged PR | Lint and tests, then Task 5 Docker build if both pass |
| Manual Actions run | Lint and tests |

Lint uses ESLint recommended rules for server code, scripts, browser code, and tests.
Warnings fail the lint command. The full Jest suite runs with coverage thresholds;
CI fails if a test or threshold fails. The inherited integration tests use an
isolated in-memory database and mocks, so CI needs no database credentials or
running Redis/PostgreSQL. This suite does not prove live Docker networking.

The Docker job builds both the runtime and migration targets. It builds images
on GitHub's runner; it does not publish to Docker Hub or deploy the application.
No Docker Hub account, registry password, or GitHub secrets are required.

## Local checks

```bash
cd week4-task5
npm ci
npm run lint
npm run prisma:generate
npm run test:ci
docker build --target runtime -t week4-task5:local .
docker build --target migrate -t week4-task5-migrate:local .
```

## Local verification results

- ESLint passes with zero warnings.
- All 16 test suites / 141 tests pass, with 93.83% line coverage.
- Both Docker targets (`runtime` and `migrate`) build successfully on this Mac.
- Workflow YAML parses successfully.
- `.env`, dependencies, and generated coverage are excluded from Git.
- GitHub-hosted runs and required branch checks are pending publication/setup;
  no successful GitHub run link or screenshot is claimed yet.

## Publish and enable merge blocking

1. Commit `.github/workflows/week4-task5-ci.yml` and `week4-task5/` on a feature
   branch, push it, and open a pull request against `main`. Review the staged files:
   this working repository also contains unrelated staged changes from earlier tasks.
   Do not include `.env`, `node_modules`, or coverage output.
2. Open the pull request's **Checks** tab. Both `Task 5 lint` and `Task 5 tests`
   should run and finish successfully.
3. A failing check automatically flags the PR. To enforce merge blocking, in the
   repository's **Settings → Branches** add a branch protection rule for `main`
   (or use an active branch ruleset). Require a pull request and require the status
   checks `Task 5 lint` and `Task 5 tests` to pass before merging. Select the checks
   after they have run at least once. Enable enforcement for administrators / avoid
   bypass permissions if you also want your own merges blocked. Availability depends
   on your repository visibility and GitHub plan.
4. Merge the successful PR into `main`. Its resulting push starts a new workflow
   run with `Task 5 Docker build` after lint and tests pass.

Workflow page for this repository:
https://github.com/vinitfordev-9/nodeJs-weeklyTasks/actions/workflows/week4-task5-ci.yml

This is the intended workflow location, not evidence of a completed run. After
publishing, copy the specific successful run URL from the browser; it looks like
`https://github.com/vinitfordev-9/nodeJs-weeklyTasks/actions/runs/<run-id>`.

## Screenshots and links to submit later

1. **PR checks screenshot:** show the PR title and green `Task 5 lint` and
   `Task 5 tests` checks. Copy the PR URL.
2. **Successful main run screenshot:** open Actions → Week 4 Task 5 CI → the
   successful `push` run on `main`; show all three green jobs and the branch/commit.
   Copy this run's URL as your working CI pipeline link.
3. **Docker build evidence:** open `Task 5 Docker build` and show the successful
   `Build application image` and `Build migration image` steps.
4. If asked to prove merge blocking, capture the active main branch rule requiring
   the two checks, or a separate demonstration PR with a deliberate failing test
   and its blocked merge state. Fix/revert deliberate failures before merging.

An application login screenshot or Docker Desktop screenshot does not demonstrate
GitHub Actions CI. Capture the GitHub pages above after the actual runs finish.

References:
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/pull-requests/reference/status-checks
- https://eslint.org/docs/latest/use/configure/configuration-files

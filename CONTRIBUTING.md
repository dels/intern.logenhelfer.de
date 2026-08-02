# Contributing

Thanks for your interest in contributing. This project is open to external
pull requests.

By participating, you're expected to follow the
[Code of Conduct](CODE_OF_CONDUCT.md). Please report security
vulnerabilities per [SECURITY.md](SECURITY.md) rather than as a public
issue.

## Getting set up

See `README.md`'s "Local development" section:

```
cp .env.example .env        # fill in POSTGRES_PASSWORD etc.
./bin/compose up            # postgres + api
cd app && pnpm dev
```

## Before opening a PR

- **Add tests.** New functionality needs unit and/or e2e coverage for the
  happy path, the unhappy path, and edge cases. Bug fixes should include a
  regression test that reproduces the bug before the fix.
- **Run the test gate.** `./bin/test-gate` runs the full suite (lint,
  typecheck, unit tests, e2e) against an isolated stack — this is the same
  gate CI runs, so a green local run means a green PR.
- **Keep the diff focused.** One logical change per PR makes review faster.
- **Update docs if behavior changes.** `README.md` for user-facing/deploy
  behavior, code comments only where the *why* isn't obvious from the code.

## Commit messages

We loosely follow [Conventional Commits](https://www.conventionalcommits.org/)
(`fix(api): ...`, `feat(app): ...`, `chore: ...`, `docs: ...`) — not
strictly enforced, but appreciated.

## Pull request process

1. Fork the repo and create a branch off `main`.
2. Make your change, with tests.
3. Open a PR describing what changed and why.
4. Address review feedback. A maintainer will merge once it's green and
   approved.

## Questions

Open a GitHub issue for anything that isn't a security report.

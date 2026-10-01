# Contributing to KOL Patreon Tracker

Thank you for your interest in contributing to KOL Patreon Tracker! We appreciate your effort and want to make contributing as easy and transparent as possible.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork: `git clone https://github.com/<your-username>/kol-pt.git`
3. Navigate to the project directory: `cd kol-pt`
4. Use Node.js 24 (`nvm use` reads `.nvmrc`) and enable pnpm: `corepack enable`
5. Install dependencies: `pnpm install`
6. Copy `.env.example` to `.env` and fill in the values
7. Start a development build: `pnpm dev` (Chrome) or `pnpm dev:firefox`, then load it as described in the [README](README.md#loading-the-build)
8. Create a new branch for your feature: `git checkout -b feature/your-feature-name`

## How to Contribute

### Fixing Bugs

1. Check the [Issues](https://github.com/eoussama/kol-pt/issues) page for existing bug reports
2. If the bug isn't reported, create a new issue describing the problem
3. Fork the repository and create a branch for your fix
4. Write tests for your fix if applicable
5. Submit a pull request with a clear description of the changes

### Adding Features

1. Check the [Issues](https://github.com/eoussama/kol-pt/issues) page for existing feature requests
2. If the feature isn't requested, create a new issue to discuss it
3. Fork the repository and create a branch for your feature
4. Implement the feature and write tests
5. Submit a pull request with a clear description of the feature

## Pull Request Process

1. Ensure your code follows our [Coding Standards](#coding-standards)
2. Update the README.md with details of changes if applicable
3. Make sure everything passes before submitting: `pnpm prod` (audit, lint, type-check, tests and builds for every browser)
4. If you touched the content script, try it on KOL's Patreon in at least one Chromium browser and Firefox
5. Your pull request will be reviewed by maintainers
6. Once approved, your pull request will be merged

## Coding Standards

- Use TypeScript throughout the codebase
- Use meaningful variable and function names
- Write comments only for non-obvious logic
- Follow the existing project code style and linting rules: `pnpm lint`
- Write unit tests for new features
- Keep Patreon selectors in `src/content/patreon/selectors.ts`, and only rely on `data-tag` attributes, ids and ARIA labels: Patreon's class names change with every deploy
- Only the background script may talk to Firebase or third-party APIs; other parts of the extension go through the request protocol in `src/core/messaging`

## Reporting Bugs

Please do **not** report security vulnerabilities through public issues. See [SECURITY.md](SECURITY.md) for the correct process.

When reporting regular bugs, please include:

- A clear description of the bug
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser and OS information if relevant
- Any relevant code snippets or screenshots

## Suggesting Features

When suggesting features, please include:

- A clear description of the feature
- The problem it solves
- Any examples or mockups if applicable
- Whether you're willing to implement it yourself

---

<p align="center">
  Thank you for contributing to KOL Patreon Tracker!
</p>

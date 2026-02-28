# x-dev-assistants

A modern monorepo powered by pnpm and Turborepo.

## Project Structure

```
.
├── apps/           # Applications
├── packages/       # Shared packages and libraries
├── turbo.json      # Turborepo configuration
└── pnpm-workspace.yaml  # pnpm workspace configuration
```

## Prerequisites

- Node.js >= 18
- pnpm >= 9

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Test

```bash
pnpm test
```

### Lint

```bash
pnpm lint
```

### Clean

```bash
pnpm clean
```

## Adding New Packages

### Add an Application

```bash
cd apps
mkdir your-app-name
cd your-app-name
pnpm init
```

### Add a Shared Package

```bash
cd packages
mkdir your-package-name
cd your-package-name
pnpm init
```

## Workspace Commands

### Install a dependency in a specific package

```bash
pnpm add <package> --filter <workspace-name>
```

### Run a command in a specific package

```bash
pnpm --filter <workspace-name> <command>
```

## Tech Stack

- **Package Manager**: pnpm
- **Build System**: Turborepo
- **Workspace**: pnpm workspaces

## Learn More

- [pnpm Documentation](https://pnpm.io/)
- [Turborepo Documentation](https://turbo.build/)

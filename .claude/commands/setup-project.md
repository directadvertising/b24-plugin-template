# Project Setup Wizard

You are setting up this Bitrix24 plugin template for a new project. Walk the user through the following questions **one group at a time**, waiting for their response before proceeding. After collecting all answers, apply the changes.

## Step 1: Docker Compose Container Prefix

The current container names in `docker-compose.yml` use the prefix `b24-` (e.g. `b24-back-end`, `b24-front-end`, `b24-postgres`, `b24-rabbitmq`, `b24-minio`).

Ask the user:
> **What prefix should be used for Docker container names?**
> (e.g. `myapp` → containers become `myapp-back-end`, `myapp-front-end`, etc.)

## Step 2: Forge Configuration

The `.forgerc.json` file configures the Forge (Traefik) reverse proxy for local development.

Ask the user the following **in a single message**:
> 1. **Project name** — human-readable name (current: `Bitrix24 Template`)
> 2. **Project description** — short description (current: `Bitrix24 application starter kit`)
> 3. **Project code / ID** — used as the subdomain, e.g. `my-app` → `my-app.local` (current: `b24-template`)
> 4. **Domain** — the local domain suffix (current: `local`, so full domain is `<code>.local`)

## Step 3: Cloudflare Tunneling

Currently all services in `.forgerc.json` have `"cloudflare": true`.

Ask the user:
> **Do you want to enable Cloudflare tunneling for the services?** (yes/no)
> This exposes your local dev environment via a Cloudflare tunnel.

## Applying Changes

Once all answers are collected, apply the following changes:

### 1. Update `docker-compose.yml`

Replace all `container_name` values using the new prefix:
- `b24-back-end` → `<prefix>-back-end`
- `b24-front-end` → `<prefix>-front-end`
- `b24-postgres` → `<prefix>-postgres`
- `b24-rabbitmq` → `<prefix>-rabbitmq`
- `b24-minio` → `<prefix>-minio`

### 2. Update `.forgerc.json`

- Set `"name"` to the project name
- Set `"description"` to the project description
- Set `"code"` to the project code/ID
- Set `"cloudflare"` to `true` or `false` on all alias entries based on the user's choice

### 3. Update `CLAUDE.md`

Update the Forge Route column in the Development Services table to reflect the new domain (replace `b24-template.local` with `<code>.<domain>`).

### 4. Self-destruct

After all changes are applied successfully, **delete this command file** (`.claude/commands/setup-project.md`) since the setup is a one-time operation.

## Final Output

Show the user a summary of all changes made, including the new container names, Forge config values, and updated domain.

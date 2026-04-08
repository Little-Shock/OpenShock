# OpenShock Contracts

This folder is the contract-first source of truth for the first MVP API.

The initial contract surface is intentionally small:

- `GET /api/v1/bootstrap`
- `GET /api/v1/issues/{issueId}`
- `GET /api/v1/task-board`
- `GET /api/v1/inbox`
- `POST /api/v1/actions`

The backend must implement these contracts before the frontend depends on behavior.
The frontend should consume only fields defined here.

For True P0, the contracts cover:

- workspace shell bootstrap data
- issue room detail
- task board data
- inbox data
- the first writable action entrypoint

The OpenAPI file is descriptive and hand-maintained for now.

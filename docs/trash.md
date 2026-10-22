# Trash integration

Open **Admin → Trash** (`/crm/trash`) to search/filter deleted records,
inspect a record, restore it, or permanently delete it. Row selection supports
bulk restore and permanent deletion. Every sidebar listing places its visible
Delete button beside Edit/View in a fixed Actions column. Without delete
permission the button stays visible and disabled with an explanation. Orders
uses the same action as the other listings, and Activities > Leads is covered.
Empty Trash acts on the selected model,
or all models when no model is selected, independently of the search text.

CRM/HR delete services now use `POST /trash/move`. The server's
`GET /trash/models` determines the accepted model name; unsupported models
fail without falling back to a destructive delete. New Trash actions also
cover staff, orders/quotations, calls, leave, assigned salaries, staff on the
Location page, task/candidate details, and the business dashboard record tables.
Task deletion is directly visible in its listing. Roles use the `roles`
permission module, and staff use `users`.

HR shifts, holidays, leave policies and the saved weekly-off policy move to
Trash immediately after confirmation, without waiting for Save Settings.
Removing an unsaved draft or editing an embedded monthly-off pattern remains
a form edit.

Payslips expose a Trash action for actual `payslipId`, `_id` or `id` values.
Generated rows without a saved payslip ID have a disabled action with an
explanation. Employee IDs are never submitted as payslip IDs.

Contracts are already stored in `jemini_contracts` on the current device.
Their deleted records are marked as trashed and shown with a **This device**
badge. They restore locally; local contract IDs never reach the server API.

Access follows the original module's read/update/delete permissions.
The dedicated Trash read/update/delete permissions can grant access across
modules. Empty Trash requires the dedicated Trash delete permission (or admin
access). Backend authorization remains authoritative. The CRM endpoints use
live data; the existing mock mappings only cover the demo dashboard endpoints.

All server requests use the existing authenticated API client. Restore and
permanent deletion pass the **trash ID**, while move passes the original ID.
Bulk permanent deletion uses POST, as specified by the supplied curl command.

Validation:

```sh
node --test tests/trash-service.test.cjs tests/trash-button.test.cjs tests/listing-trash.test.cjs
pnpm build
# If Node reaches its default heap limit during bundling:
node --max-old-space-size=4096 node_modules/vite/bin/vite.js build
```

The supplied endpoint requires a token. Automated tests replace the HTTP
transport and never change live data. Authenticated browser verification with
a disposable record is still needed to confirm the live response schema and
the backend's registered models. The repository currently has no `lint` script.

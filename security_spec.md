# Security Specification for Foresyndo ConstrukPro

## 1. Data Invariants
* Users must be authenticated to read or write any data.
* Users can only modify their own profiles.
* Role-based checks: Only authorized roles can approve RABs, POs, Progress, and Invoices.
  * `Direktur` and `Project Manager` can review and approve entries.
  * `Site Engineer` can submit daily progress.
  * `QC Engineer` can submit inspections.
  * `Safety Officer` manages K3 forms.
  * `Finance` manages invoices, payments, and budgets.
* All timestamped records must match the server-side `request.time`.

## 2. Dirty Dozen Payloads (Target Checks)
1. **Unauthenticated Read**: Request to read `projects` collection without credentials -> must fail.
2. **Identity Spoofing**: User `A` tries to update `users/B` role to `Admin` -> must fail.
3. **Budget Tampering**: Non-Finance / non-PM user attempting to directly write/approve RAB entries on `projects/{id}/rab` -> must fail.
4. **Invalid Status Transition**: Changing a PO status from `Draft` to `Delivered` bypassing `Approved` without proper role -> must fail.
5. **Ghost field Injection**: Inserting shadow properties like `isSuperAdmin: true` on user registration profiles -> must fail.
6. **Self-Appointed Roles**: A standard user self-promoting to `Direktur` role -> must fail.
7. **Negative Amounts**: Submitting a payment transaction with a negative value -> must fail.
8. **Malicious ID Injection**: Project ID with abnormal symbols to crash database indexes (`{projectId} = ""/../../../etc"`) -> must fail.
9. **Fake Timestamps**: Forcing client-side `createdAt` years in the past/future -> must fail.
10. **PII Access Exploitation**: Unauthenticated users query phone numbers of subcontractors -> must fail.
11. **Illegal State Overwrite**: Attempting to alter terminal Project Status when set to Selesai or Pemeliharaan -> must fail.
12. **Blanket Collection Leak**: Client attempting `allow list: if isSignedIn()` to query entire projects database without scoping -> must fail.

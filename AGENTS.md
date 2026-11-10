<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Account sessions are validated with Cloud Auth getUser and owned registration details live in profiles; this keeps identity separate from editable health measurements.
- Use the shared account experience for registration, mobile verification and mobile sign-in; a single implementation keeps validation and account transitions consistent.
- Delegate OTP generation, delivery, expiration and password authentication to Cloud Auth; never simulate verification or retain passwords in browser storage.
- AI calls run server-side in `src/lib/ai/*.server.ts`, exposed via auth-protected `*.functions.ts`; keeps the AI key and prompts off the browser.
- Clinic-approved vaccine text lives in `vaccine_content` rows that override the static sample catalog by key; empty fields fall back to samples so the schedule never goes blank.
- Admin rights come only from `user_roles` via `has_role`; never from profile fields or browser state.
- Edit-profile details are validated in a dedicated browser-safe profile module and saved only to the authenticated user's existing profiles row; BMI is derived from measurements rather than stored separately to avoid stale values.
- Mobile sign-up OTPs are generated, hashed and checked server-side (`phone_otps`) and delivered via EgoSMS (`src/lib/egosms.server.ts`); verified accounts use the synthetic handle `${digits}@phone.zatuhealth.com` because hosted phone auth is unavailable.
- All outgoing SMS are recorded in `sms_logs`; reminder dedupe keys prevent repeat texts within the same week.
- Public invoice (`/pay/$invoiceNumber`) and certificate (`/verify/$memberId`) pages read only through security-definer RPCs returning limited columns; table RLS stays owner/staff-only.
- Invoices are created and marked paid only by admin/staff (`has_role`); payment SMS is sent server-side in `invoice-sms.functions.ts`.
- Patient documents live in `patient_documents` (files under `{uid}/documents/` in the private member-photos bucket); clinic staff see them only through an active, unrevoked `document_shares` row, and actions are recorded in `document_access_log`, so the patient keeps control.

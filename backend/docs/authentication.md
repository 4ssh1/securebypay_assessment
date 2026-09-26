# Authentication

## Sessions

Login and signup verification issue an opaque server-side session in an HttpOnly, signed cookie. Redis is the fast path; PostgreSQL stores the session hash and audit state. Sessions have a sliding idle lifetime and fixed absolute lifetime. Logout and password reset revoke sessions.

Production cookies use `__Host-sid`, `Secure`, `SameSite=Strict` and `Path=/`. Origin checks and the CORS allow-list protect state-changing requests.

## Flows

| Flow | OTP | Result |
|---|---|---|
| Signup | Signup verification code | Verified user is signed in |
| Resend signup code | Signup code | Previous code is superseded |
| Forgot/reset password | Password-reset code | Password changes and all sessions are revoked |
| Login | None | Email and password issue a session |

OTP codes are six digits, HMAC-protected, valid for 10 minutes, limited to five attempts, and rate-limited on resend. Resend and reset responses avoid exposing whether an email exists.

## Passwords and login protection

Passwords use Argon2id and require 10-128 characters with upper case, lower case and a digit. Login has per-IP throttling, per-account lockout, dummy-hash timing equalization and uniform invalid-credential errors.

Unverified login returns `EMAIL_NOT_VERIFIED` with a user ID only after the password is correct, allowing the client to open signup OTP verification.
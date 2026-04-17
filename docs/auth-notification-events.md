# Auth To Notification Events

This document describes the auth-related notifications that are now published to RabbitMQ instead of being sent directly from `auth-service`.

## What Stays In Auth Service

These emails remain inside `backend/auth-service`:

- email verification OTP
- forgot-password / reset-password OTP

Those paths still use the OTP mailer in:

- `backend/auth-service/src/services/email.service.js`
- `backend/auth-service/src/services/otp.service.js`

## What Now Goes Through Notification Service

`auth-service` publishes these routing keys to the `smart_health.events` exchange:

- `notification.user.registered`
- `notification.doctor.approved`
- `notification.doctor.rejected`
- `notification.account.suspended`
- `notification.account.reactivated`

The publish points are:

- `backend/auth-service/src/services/otp.service.js`
- `backend/auth-service/src/services/internalAdmin.service.js`

The notification consumer handles them in:

- `backend/notification-service/src/config/notification.config.js`
- `backend/notification-service/src/templates/email/index.js`

## Payload Expectations

All auth-published notification events include:

- `eventId`
- `occurredAt`
- `recipient`

Patient-facing events include:

- `patient.userId`
- `patient.fullName`
- `patient.email`
- `patient.phone`

Doctor review events also include:

- `doctor.userId`
- `doctor.fullName`
- `doctor.email`
- `doctor.phone`
- `doctor.specialization`

Account status events include:

- `accountStatus`
- `reason`

## Smoke Testing

You can publish a sample event from `backend/notification-service` with:

```powershell
node test-publish.mjs notification.user.registered
node test-publish.mjs notification.doctor.approved
node test-publish.mjs notification.doctor.rejected
node test-publish.mjs notification.account.suspended
node test-publish.mjs notification.account.reactivated
```

If `notification-service` is running and bound to `notification.#`, you should see:

- `Event received: <routing key>`
- `Channel email succeeded for <routing key>`

## Current State

- direct non-OTP auth emails have been removed from `auth-service`
- `notification-service` owns welcome, doctor review, and account status emails
- `admin-service` is broker-ready, but these auth lifecycle events are currently published from `auth-service`

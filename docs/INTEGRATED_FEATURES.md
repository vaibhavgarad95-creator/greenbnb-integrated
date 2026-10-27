# GreenBnB integrated feature update

This update adds routes without changing the Prisma schema or creating a database migration.

## Added
- `/explore`: database-backed listing search with keyword, city, price, guest-count, and eco-score filters.
- `/dashboard`: role-aware account overview (guest view; hosts go to the host dashboard and admins to `/admin`).
- `/favorites`: saved stays list.
- `/notifications`: booking status/activity feed derived from current booking records. This is not email/push delivery and has no read/unread state.
- `/reviews`: review form for completed, confirmed guest stays.
- `/admin`: administrator overview with user suspension/restoration and listing visibility actions.
- `/api/favorites`, `/api/reviews`, `/api/admin`: protected APIs for the features above.
- Homepage navigation links to Explore and Dashboard.

## Important setup
1. Keep your existing `.env` file locally; it is deliberately not included in the archive.
2. Install using `npm.cmd install` if needed.
3. Run `npx.cmd prisma generate`.
4. Run `npm.cmd run dev`.
5. Open `/explore`, `/dashboard`, `/favorites`, `/notifications`, and `/reviews` to test the guest features.
6. `/admin` requires a user whose database role is `ADMIN`. New registrations are intentionally created as `GUEST`; never make an admin role selectable in public registration. Assign the first trusted admin manually using Prisma Studio.
7. Only use the admin role for a trusted account. The admin API checks the role on every request.

## Limitations / next checks
- This package was prepared from the uploaded source. Dependencies and PostgreSQL were not available in this packaging environment, so run typecheck/tests locally before relying on it.
- Notifications are an in-app view derived from booking status, not email/SMS/push notifications.
- Review API allows one review per booking and only for completed confirmed stays.
- Saved-stay toggles and admin actions require a logged-in account.
- The homepage's original handpicked demo cards remain for the visual landing page; `/explore` searches real published database listings.

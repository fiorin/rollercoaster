# Supabase integration notes

- **Run the complete setup script** in the Supabase SQL editor:
  - [supabase/setup.sql](supabase/setup.sql) — creates tables, seeds data, and sets up RLS policies

- **Optional: Add missing constraints** (if you ran an older setup.sql):
  - [supabase/add_constraint.sql](supabase/add_constraint.sql) — adds unique constraint for weights

- **Optional: Populate test data**
  - [supabase/populate_weights.sql](supabase/populate_weights.sql) — generates 3 months of weight data for all people

- Alternative individual scripts (if you prefer to run separately):
  - [supabase/create_tables.sql](supabase/create_tables.sql)
  - [supabase/seed_avatars.sql](supabase/seed_avatars.sql)

- Add your Supabase credentials to the Vite environment (create `.env` or `.env.local`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key
```

- Install the client library:

```
npm install @supabase/supabase-js
```

- A small client helper was added at [src/lib/supabaseClient.js](src/lib/supabaseClient.js). Use `supabase` or the helper functions from your components.

- Avatar images: put 10 images in `public/avatars/avatar-1.png` ... `avatar-10.png`, or update the URLs in the seed file.

- Next UI wiring suggestions:
  - In `WeightsPage.jsx` render a 3-column list (date / weight / icons) and color icons green when true, gray otherwise.
  - Add a floating round green `+` button top-right to open `WeightModal.jsx`.
  - In `PeoplePage.jsx` list avatars from the `avatars` table and load images from the `image_url` field.
  - For the register-new-weight flow, fetch people and show the avatars as a selectable list.

If you want, I can wire the components to use `supabase` and implement the mobile-first layout now.

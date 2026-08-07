Workload Lite V3.1 - Netlify Deploy Package (with shared database)

WHAT'S NEW
- This build is connected to a shared cloud database (Supabase).
- Every browser/device that opens the site now sees the SAME board.
- The app still works offline: if the database can't be reached it falls
  back to this browser's local data, and syncs again when back online.
- The sidebar shows a status:
    * Cloud synced  -> connected, changes are shared
    * Syncing...    -> talking to the database
    * Local only    -> offline / DB unreachable, using this browser's data

DEPLOY OPTION A - Netlify Drop (easiest, no account setup)
1. Login at https://app.netlify.com
2. Go to: Add new site / Deploy manually (Netlify Drop)
3. Drag THIS folder (or a ZIP of it) onto the drop area
4. Netlify creates a URL instantly - done.

DEPLOY OPTION B - Connect the Git repo (auto-deploy on every push)
1. In Netlify: Add new site -> Import from Git -> pick this repository
2. Settings:
     Base directory:     workload-lite
     Build command:      (leave empty - this is a static site)
     Publish directory:  workload-lite
3. Deploy. Every push to the branch redeploys automatically.

DATABASE
- Backend: Supabase (PostgreSQL). Table: workload_projects
- The Supabase URL + publishable (anon) key are set inside index.html in the
  window.WORKLOAD_SUPABASE block. The anon key is meant to be public; access
  is controlled by Row Level Security on the database, not by hiding the key.
- To point this app at a different Supabase project, edit those two values.
- SECURITY NOTE (pilot): the current policy lets anyone with the site URL
  read and write the board. That's fine for an internal pilot. Before opening
  it more widely, add real login (Supabase Auth) and tighten the RLS policy.

BACKUP / MIGRATION
- Export data and Import data buttons (JSON) still work as a manual backup or
  to move data between environments. Recommended to export a backup now and then.

CALCULATION
- Light = 1 point, Medium = 2 points, Heavy = 3 points
- Lead = 100%, Support = 50%
- Individual Load = Project Point x Role Factor
- Person Load = Sum of active-project Individual Loads
- Capacity Used = Person Load / Capacity x 100
- Completed / Archived projects are excluded automatically

CAPACITY BASELINE
- AM = 8 points; Junior AE = 6 points are Pilot baselines only
- They are not performance targets or fixed role limits
- Calibrate after 4-6 weeks of real usage and team feedback

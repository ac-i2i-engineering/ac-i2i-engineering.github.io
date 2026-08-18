// Shared Supabase client for the public site. Requires the SDK CDN script
// (see index.html/etc for the <script> tag) to be loaded first -- it exposes
// the global `supabase.createClient`.
//
// The anon key below is meant to be public: it's the same key that would end
// up in any client-side bundle regardless, and Row Level Security -- not key
// secrecy -- is what actually gates reads/writes. See admin/README.md
// ("Rules of the road") for the same note on the admin side.
//
// One client per page load, reused by every page's script via this global.
const supabaseClient = supabase.createClient(
  "https://wkwevuetgoqglmkstarm.supabase.co",
  "sb_publishable_emfb8JZAnTJFrwwKk_eE6A_l6dQFCOj",
);

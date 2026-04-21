

## Add AI-generated "After" photo to the Results page

Show a Gemini-generated "after" image on the results page that visualizes the suggested fixes (items to add + items to remove) applied to the user's original photo.

### User experience

On `/results/$id`, below the original photo and summary, add a new "After" card:
- If no after image exists yet → shows a muted placeholder with a **Generate after photo** button
- While generating → skeleton + "Styling your after photo…" (takes ~15-30s)
- On success → a side-by-side (or stacked on mobile) **Before / After** comparison
- On failure (rate limit / credits) → friendly toast + retry button

The after image is persisted so returning to the page or opening from History shows the existing result without regenerating.

### Technical changes

**1. Database migration**
- Add two nullable columns to `analyses`:
  - `after_image_url text`
  - `after_image_path text`

**2. New edge function `generate-after-image`** (`supabase/functions/generate-after-image/index.ts`, `verify_jwt = false` in `supabase/config.toml`)
- Input: `{ analysisId: string }`
- Loads the analysis row (image_url, category, missing, remove, summary) via service role
- Builds an edit prompt from the existing analysis, e.g.:
  > "Edit this {category} photo to reflect these styling changes. Add: {missing[].title}. Remove/replace: {remove[].title}. Keep the person/room identity, framing, and lighting. Scandinavian, minimal, elevated."
- Calls Lovable AI Gateway with `google/gemini-2.5-flash-image` (Nano banana), `modalities: ["image", "text"]`, passing the original `image_url` as `image_url` content
- Extracts base64 from `choices[0].message.images[0].image_url.url`
- Uploads the decoded bytes to the `analysis-images` bucket at `{user_id}/{analysisId}-after.png`
- Updates the analysis row with `after_image_url` (public URL) and `after_image_path`
- Returns `{ after_image_url }`
- Handles 429 and 402 with the same pattern as `analyze-image`

**3. Results page (`src/routes/results.$id.tsx`)**
- Extend `Analysis` type with `after_image_url` and `after_image_path`
- Add an "After" section card under the existing image card:
  - Empty state → `Generate after photo` button (calls `supabase.functions.invoke("generate-after-image", { body: { analysisId: id } })`)
  - Loading state → skeleton + status label
  - Filled state → image + small "AI visualization" caption
- On delete, also remove `after_image_path` from storage if present
- Warm Scandi styling consistent with the existing cards (rounded-3xl, soft border, shadow-soft)

**4. Optional polish (included)**
- A subtle "AI preview" badge on the generated image so users understand it's a mockup, not a real photo

### Files touched

- `supabase/migrations/<new>.sql` — add two columns
- `supabase/functions/generate-after-image/index.ts` — new function
- `supabase/config.toml` — register function with `verify_jwt = false`
- `src/routes/results.$id.tsx` — UI + invoke flow
- `src/integrations/supabase/types.ts` — auto-regenerates after migration

### Out of scope

- No auto-generation on analyze (kept as an explicit user action to control cost/latency)
- No regeneration/variations UI in this pass (can be added later)
- History page thumbnails stay on the original image


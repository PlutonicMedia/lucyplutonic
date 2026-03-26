

# Project-Scoped Prompts for Lucy

## What changes

Right now all saved prompts are global — there's no way to tie a prompt to a specific project folder. This plan adds that distinction so prompts can be either **global** (available everywhere) or **project-scoped** (tied to a folder).

## Database

Add a nullable `folder_id` column to `saved_prompts` with a foreign key to `folders`. A prompt with `folder_id = NULL` is global; one with a folder_id is project-scoped. Migration includes an RLS-safe foreign key and updates the existing `on delete cascade` behavior so deleting a folder also removes its prompts.

## Hook changes (`usePrompts`)

- `addPrompt` gains an optional `folderId` parameter.
- Expose a derived split: `globalPrompts` (folder_id is null) and a helper to get prompts for a specific folder.

## PromptPicker (in Generation Panel)

- **"All Prompts" tab** → shows global prompts (folder_id is null).
- **"Project" tab** (only when a folder is active) → shows prompts where folder_id matches the active folder.
- Selecting a prompt fills the textarea as before.

## GenerationPanel "Save to Library" button

- When clicked, show a small choice: **Global** or **This Project** (disabled if no folder is active).
- Passes the chosen scope (and folder_id) to the save handler.

## PromptLibrary page

- Each prompt card shows a subtle badge: "Global" or the folder name.
- The "Add new prompt" form gets a scope selector (Global / pick a project folder).
- Tag filter and search work across both scopes; an additional "Global / Project" filter pill is added.

## Technical details

- Migration: `ALTER TABLE saved_prompts ADD COLUMN folder_id uuid REFERENCES folders(id) ON DELETE CASCADE;`
- Types will auto-regenerate to include the new column.
- No RLS changes needed — existing user_id policies already cover access.
- `usePrompts` hook signature: `addPrompt(text, tags, folderId?)`.
- `PromptPicker` receives `activeFolder` (already does) and filters by `folder_id`.

**Files modified:** migration (new), `usePrompts.ts`, `PromptPicker.tsx`, `GenerationPanel.tsx`, `PromptLibrary.tsx`, `Index.tsx`.


# Supabase Storage (`gym-images`)

This module provides a reusable service layer for image storage:

- `uploadImage(file, folder)` for authenticated uploads
- `getPublicImageUrl(path)` for public reads
- `deleteImage(path)` for authenticated deletion

Supported folders:

- `gyms/`
- `reviews/`
- `trainers/`
- `profiles/` (ready for profile images)

## Usage

Use hooks for UI flows:

- `useImageUpload()`
- `useImageDeletion()`

Or call service functions directly from API/domain modules where needed.

## Security expectations

The migration `20260525163000_storage_gym_images_policies.sql` enforces:

- public read on `gym-images`
- authenticated insert only in allowed folders
- authenticated update/delete only for `owner = auth.uid()`

Ensure this migration is applied in each environment before enabling upload UI.


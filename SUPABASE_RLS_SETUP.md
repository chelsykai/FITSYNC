# Supabase RLS Policy Configuration Guide

This document outlines the required Row-Level Security (RLS) policies that must be configured in your Supabase project for FITSYNC to work properly, especially on the Vercel deployment.

## Issues Fixed

This configuration resolves:
- ❌ "Unable to save walk-in record right now. Please try again."
- ❌ "QR upload failed: new row violates row-level security policy"

---

## 1. Walk-In Records Table (`walk_in`)

### Issue
When users try to add walk-in records, the insert fails due to missing or incorrect RLS policies.

### Required RLS Policy

**Enable RLS on the `walk_in` table, then add this policy:**

```sql
-- Allow authenticated users to INSERT walk-in records
CREATE POLICY "authenticated_insert_walkin"
ON public.walk_in
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow all users to SELECT walk-in records
CREATE POLICY "public_select_walkin"
ON public.walk_in
FOR SELECT
USING (true);

-- Allow users to UPDATE/DELETE their own walk-in records
CREATE POLICY "user_update_delete_walkin"
ON public.walk_in
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "user_delete_walkin"
ON public.walk_in
FOR DELETE
USING (auth.role() = 'authenticated');
```

---

## 2. QR Codes Storage Bucket (`member-qr-codes`)

### Issue
When members are created on Vercel, sending the QR code via email fails with a row-level security violation on the storage bucket.

### Required Setup

**1. Create the storage bucket (if not existing):**

In Supabase Dashboard → Storage:
- Click "New bucket"
- Name: `member-qr-codes`
- Public/Private: Choose **Public** (so QR codes can be accessed)
- Uncheck "Always search under this bucket"

**2. Enable RLS on the bucket and add policies:**

```sql
-- Allow authenticated users to upload QR codes
INSERT INTO storage.objects (bucket_id, name, owner_id)
SELECT 'member-qr-codes'::uuid, uuid_generate_v4(), auth.uid()
WHERE auth.role() = 'authenticated';

-- Or use the Storage Policy UI to add:

CREATE POLICY "authenticated_upload_qr"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'member-qr-codes'::uuid
  AND auth.role() = 'authenticated'
);

CREATE POLICY "public_read_qr"
ON storage.objects
FOR SELECT
USING (bucket_id = 'member-qr-codes'::uuid);
```

**3. If using Supabase UI (easier):**

- Go to Storage → `member-qr-codes` bucket
- Click "Policies"
- Add policy:
  - Operation: INSERT
  - With Check: `(bucket_id = 'member-qr-codes') AND (auth.role() = 'authenticated')`

---

## 3. Member Table Photo Uploads (`member_photo` bucket)

### Verify Existing Setup

This bucket should already exist from previous configuration. If you see photo upload working but QR upload failing, the issue is specific to the `member-qr-codes` bucket.

**Verify policies are similar to QR bucket but for `member_photo`:**

```sql
CREATE POLICY "authenticated_upload_member_photo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'member_photo'::uuid
  AND auth.role() = 'authenticated'
);

CREATE POLICY "public_read_member_photo"
ON storage.objects
FOR SELECT
USING (bucket_id = 'member_photo'::uuid);
```

---

## 4. System User Table (Password Change)

If the change password page still has issues after code updates, verify the `system_user` table has appropriate RLS policies:

```sql
-- Allow users to update their own record
CREATE POLICY "user_update_own_password"
ON public.system_user
FOR UPDATE
USING (auth.uid()::text = user_id OR auth.role() = 'authenticated');

-- Restrict reading passwords to authenticated users only
CREATE POLICY "authenticated_read_users"
ON public.system_user
FOR SELECT
USING (auth.role() = 'authenticated');
```

---

## Testing the Configuration

### Test 1: Walk-In Records
1. Go to Dashboard → Payments → Record Payment
2. Select "Walk-in Payment" tab
3. Try adding a walk-in record
4. ✅ Should succeed without errors

### Test 2: Member QR Upload
1. Go to Dashboard → Members → Add Member
2. Fill in member details and submit
3. Click "Email QR ID"
4. ✅ Should succeed and show "QR ID sent to [email]"

### Test 3: Password Change
1. Go to Settings → Change Password
2. Enter current password, new password twice
3. Click Submit
4. ✅ Should redirect to login after success

---

## Troubleshooting

### Error: "new row violates row-level security policy"
- Verify the bucket has the correct RLS policies
- Check that the policy uses `auth.role() = 'authenticated'`
- Ensure the user is properly authenticated (check session token)

### Error: "Unable to save walk-in record"
- Check `walk_in` table has RLS enabled
- Verify INSERT policy exists and allows `auth.role() = 'authenticated'`
- Check browser console for specific error message

### Error: "Missing EmailJS config"
- Ensure `VITE_EMAILJS_TEMPLATE_ID_WELCOME` environment variable is set
- Verify no trailing spaces in the `.env` file
- For Vercel: Add environment variable in Project Settings

---

## Environment Variables

Required for Vercel deployment (add in Project Settings → Environment Variables):

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID_NOTIFICATION=your_template_id
VITE_EMAILJS_TEMPLATE_ID_WELCOME=your_welcome_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

⚠️ **Important**: No trailing spaces on any values!

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Authentication](https://supabase.com/docs/guides/auth)

export function getSupabaseAdminUserIds() {
  return new Set(
    (process.env.SUPABASE_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export function isSupabaseAdminUser(userId) {
  return getSupabaseAdminUserIds().has(userId);
}

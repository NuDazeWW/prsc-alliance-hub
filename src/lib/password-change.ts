/** Recovery and authenticated password changes never require the old password. */
export function passwordChangeAttributes(password: string, confirmation: string) {
  if (password.length < 12) throw new Error("Use at least 12 characters for the new password");
  if (password !== confirmation) throw new Error("The new passwords don't match");
  return { password };
}
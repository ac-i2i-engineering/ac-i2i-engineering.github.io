"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { createClient } from "@/lib/supabase/client";

// Shared by three flows that all land here with a session already
// established, just by different routes:
//   - a temp-password invite (see /api/admin/invite), forced here by the
//     protected layout while admin_users.must_reset_password is true
//   - resetPasswordForEmail (forgot password), via /auth/confirm
//   - an invited/reset user who already has a session but revisits this URL
// All three just need updateUser with the new password, then a call to
// clear must_reset_password (a harmless no-op for the two paths where it
// was already false). Copy stays generic since there's no reliable way to
// tell which flow sent someone here.
export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    await fetch("/api/account/clear-must-reset", { method: "POST" }).catch(() => {
      // Non-fatal -- worst case they're asked to set a password again next
      // login, not locked out or left insecure.
    });

    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="admin.bg">
      <Box w="full" maxW="sm" p={8} borderRadius="2xl" bg="admin.surface" borderWidth="1px" borderColor="admin.border" boxShadow="0 20px 50px -20px rgba(26, 20, 16, 0.2)">
        <Heading size="md" mb={1} color="admin.text">
          Set your password
        </Heading>
        <Text fontSize="sm" color="admin.textMuted" mb={6}>
          Choose a password for your i2i admin account.
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            <Field.Root>
              <Field.Label color="admin.text">New password</Field.Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                color="admin.text"
                borderColor="admin.border"
                _focus={{ borderColor: "brand.emphasized" }}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label color="admin.text">Confirm password</Field.Label>
              <Input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                color="admin.text"
                borderColor="admin.border"
                _focus={{ borderColor: "brand.emphasized" }}
              />
            </Field.Root>

            {error && (
              <Text fontSize="sm" color="red.500">
                {error}
              </Text>
            )}

            <Button type="submit" colorPalette="brand" loading={loading}>
              Set password and sign in
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}

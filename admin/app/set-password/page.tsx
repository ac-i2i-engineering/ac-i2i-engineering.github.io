"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { createClient } from "@/lib/supabase/client";

// Shared by two flows that both land here the same way -- inviteUserByEmail
// (new admin) and resetPasswordForEmail (forgot password), both via their
// redirectTo. Supabase's client SDK reads the token from the URL and
// establishes a session automatically on load -- there's nothing to do here
// except call updateUser with the new password once the form is submitted.
// Copy stays generic since there's no reliable way to tell which flow sent
// someone here.
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
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="#0B0F19">
      <Box w="full" maxW="sm" p={8} borderRadius="lg" bg="#111827" borderWidth="1px" borderColor="whiteAlpha.200">
        <Heading size="md" mb={1} color="white">
          Set your password
        </Heading>
        <Text fontSize="sm" color="gray.400" mb={6}>
          Choose a password for your i2i admin account.
        </Text>

        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            <Field.Root>
              <Field.Label color="gray.300">New password</Field.Label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                color="white"
              />
            </Field.Root>

            <Field.Root>
              <Field.Label color="gray.300">Confirm password</Field.Label>
              <Input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                color="white"
              />
            </Field.Root>

            {error && (
              <Text fontSize="sm" color="red.400">
                {error}
              </Text>
            )}

            <Button type="submit" colorPalette="orange" loading={loading}>
              Set password and sign in
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}

"use client";

import { useState } from "react";
import { Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    // Supabase itself already declines to error out for an email that isn't
    // registered, specifically so this can't be used to check who has an
    // account -- so surfacing whatever error does come back (rate limits,
    // etc.) doesn't leak anything, and hiding it just makes real problems
    // invisible to whoever's actually trying to use this.
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/confirm?next=/set-password`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="#0B0F19">
      <Box w="full" maxW="sm" p={8} borderRadius="lg" bg="#111827" borderWidth="1px" borderColor="whiteAlpha.200">
        <Heading size="md" mb={1} color="white">
          Reset your password
        </Heading>

        {sent ? (
          <Text fontSize="sm" color="gray.400" mt={4}>
            If that email has an admin account, a reset link has been sent to it.
            Check your inbox.
          </Text>
        ) : (
          <>
            <Text fontSize="sm" color="gray.400" mb={6}>
              Enter your email and we&apos;ll send you a link to set a new password.
            </Text>
            <form onSubmit={handleSubmit}>
              <Stack gap={4}>
                <Field.Root>
                  <Field.Label color="gray.300">Email</Field.Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    color="white"
                  />
                </Field.Root>

                {error && (
                  <Text fontSize="sm" color="red.400">
                    {error}
                  </Text>
                )}

                <Button type="submit" colorPalette="orange" loading={loading}>
                  Send reset link
                </Button>
              </Stack>
            </form>
          </>
        )}
      </Box>
    </Box>
  );
}

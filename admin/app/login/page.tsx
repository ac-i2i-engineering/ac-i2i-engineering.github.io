"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Button, Field, Flex, Input, Heading, Stack, Text } from "@chakra-ui/react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError("Incorrect email or password.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="#0B0F19">
      <Box w="full" maxW="sm" p={8} borderRadius="lg" bg="#111827" borderWidth="1px" borderColor="whiteAlpha.200">
        <Heading size="md" mb={1} color="white">
          i2i Admin
        </Heading>
        <Text fontSize="sm" color="gray.400" mb={6}>
          Sign in to manage site content.
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

            <Field.Root>
              <Flex justify="space-between" align="center" mb={1} w="full">
                <Field.Label color="gray.300" mb={0}>Password</Field.Label>
                <Link href="/forgot-password" style={{ fontSize: "12px", color: "#818CF8" }}>
                  Forgot password?
                </Link>
              </Flex>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                color="white"
              />
            </Field.Root>

            {error && (
              <Text fontSize="sm" color="red.400">
                {error}
              </Text>
            )}

            <Button type="submit" colorPalette="orange" loading={loading}>
              Sign in
            </Button>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}

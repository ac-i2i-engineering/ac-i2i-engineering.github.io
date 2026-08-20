"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Box, Button, Field, Flex, Input, Text } from "@chakra-ui/react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
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
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="admin.bg">
      <Box w="full" maxW="sm" p={8} borderRadius="2xl" bg="admin.surface" borderWidth="1px" borderColor="admin.border" boxShadow="0 20px 50px -20px rgba(26, 20, 16, 0.2)">
        <Flex justify="center" mb={6}>
          <Image src="/i2i-logo.png" alt="i2i" width={150} height={45} style={{ height: "40px", width: "auto" }} priority />
        </Flex>

        <Text fontSize="sm" color="admin.textMuted" mb={6} textAlign="center">
          Sign in to manage site content.
        </Text>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap={4}>
            <Field.Root>
              <Field.Label color="admin.text">Email</Field.Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                color="admin.text"
                borderColor="admin.border"
                _focus={{ borderColor: "brand.emphasized" }}
              />
            </Field.Root>

            <Field.Root>
              <Flex justify="space-between" align="center" mb={1} w="full">
                <Field.Label color="admin.text" mb={0}>
                  Password
                </Field.Label>
                <Link href="/forgot-password" style={{ fontSize: "12px", color: "#D24114" }}>
                  Forgot password?
                </Link>
              </Flex>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
              Sign in
            </Button>
          </Flex>
        </form>
      </Box>
    </Box>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Box, Flex, Text, Avatar, Badge, Button } from "@chakra-ui/react";
import { Sidebar } from "./Sidebar";
import { createClient } from "@/lib/supabase/client";
import type { AdminUser } from "@/lib/types";

interface AdminLayoutProps {
  children: React.ReactNode;
  user: { email: string; admin: AdminUser };
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const router = useRouter();
  const displayName = user.admin.full_name || user.email;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Flex minH="100vh" bg="#0B0F19" color="gray.100">
      <Sidebar />
      <Flex direction="column" flex="1" overflowX="hidden">
        {/* Top Header */}
        <Flex
          as="header"
          h="70px"
          px={8}
          bg="rgba(15, 23, 42, 0.8)"
          backdropFilter="blur(16px)"
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor="rgba(255, 255, 255, 0.08)"
          position="sticky"
          top="0"
          zIndex="50"
        >
          <Flex align="center" gap={3}>
            <Text fontWeight="bold" fontSize="lg" className="gradient-text">
              Ideas 2 Innovation
            </Text>
            <Badge bg="rgba(16, 185, 129, 0.15)" color="#34D399" border="1px solid rgba(16, 185, 129, 0.3)" px={2} py={0.5} borderRadius="md" fontSize="xs">
              System Online
            </Badge>
          </Flex>

          <Flex align="center" gap={4}>
            <Box textStyle="sm" textAlign="right">
              <Flex align="center" gap={2} justify="flex-end">
                <Text fontWeight="semibold" color="gray.200" fontSize="sm">
                  {displayName}
                </Text>
                <Badge
                  bg={user.admin.role === "owner" ? "rgba(251, 191, 36, 0.15)" : "rgba(99, 102, 241, 0.15)"}
                  color={user.admin.role === "owner" ? "#FBBF24" : "#818CF8"}
                  fontSize="9px"
                  px={1.5}
                  borderRadius="sm"
                  textTransform="uppercase"
                >
                  {user.admin.role}
                </Badge>
              </Flex>
              <Text fontSize="xs" color="gray.400">
                {user.email}
              </Text>
            </Box>
            <Avatar.Root size="md" border="2px solid rgba(99, 102, 241, 0.5)">
              <Avatar.Fallback name={displayName} bg="indigo.600" color="white" fontWeight="bold" />
            </Avatar.Root>
            <Button size="sm" variant="ghost" color="gray.400" onClick={handleSignOut}>
              Sign out
            </Button>
          </Flex>
        </Flex>

        {/* Main Page Area */}
        <Box as="main" p={{ base: 4, md: 8 }} flex="1">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}

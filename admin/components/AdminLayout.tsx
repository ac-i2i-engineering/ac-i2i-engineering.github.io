"use client";

import { useRouter } from "next/navigation";
import { Box, Flex, Text, Avatar, Badge, Menu, Portal } from "@chakra-ui/react";
import { ChevronDown, Settings, LogOut } from "lucide-react";
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
    // Fixed-height app shell, not minH -- with minH the whole page (sidebar
    // and header included) grew taller than the viewport on long tables and
    // scrolled away with the content, since nothing was actually anchored to
    // the viewport. Only <Box as="main"> below scrolls now.
    <Flex h="100vh" overflow="hidden" bg="admin.bg" color="admin.text">
      <Sidebar />
      <Flex direction="column" flex="1" minW={0} h="100%">
        {/* Top Header */}
        <Flex
          as="header"
          h="64px"
          px={8}
          bg="admin.surface"
          align="center"
          justify="flex-end"
          borderBottom="1px solid"
          borderColor="admin.border"
          flexShrink={0}
        >
          <Menu.Root>
            <Menu.Trigger asChild>
              <Flex align="center" gap={1} p={1} borderRadius="full" cursor="pointer" _hover={{ bg: "#F5F1EB" }} transition="background 0.15s ease">
                <Avatar.Root size="sm">
                  <Avatar.Fallback
                    name={displayName}
                    bg="brand.solid"
                    color="white"
                    fontWeight="bold"
                    w="100%"
                    h="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  />
                  {user.admin.avatar_url && <Avatar.Image src={user.admin.avatar_url} alt={displayName} />}
                </Avatar.Root>
                <ChevronDown size={16} color="#5C4E42" />
              </Flex>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content bg="admin.surface" borderColor="admin.border" borderRadius="xl" boxShadow="0 12px 28px -8px rgba(26, 20, 16, 0.18)" minW="240px" py={1}>
                  <Box px={3} py={2.5}>
                    <Flex align="center" gap={1.5} mb={0.5}>
                      <Text fontWeight="semibold" color="admin.text" fontSize="sm" truncate>
                        {displayName}
                      </Text>
                      <Badge
                        bg={user.admin.role === "owner" ? "#FEF3C7" : "info.subtle"}
                        color={user.admin.role === "owner" ? "#92600A" : "info.fg"}
                        fontSize="9px"
                        px={1.5}
                        borderRadius="sm"
                        textTransform="uppercase"
                        flexShrink={0}
                      >
                        {user.admin.role}
                      </Badge>
                    </Flex>
                    <Text fontSize="xs" color="admin.textMuted" truncate>
                      {user.email}
                    </Text>
                  </Box>
                  <Menu.Separator borderColor="admin.border" />
                  <Menu.Item
                    value="settings"
                    onClick={() => router.push("/settings")}
                    color="admin.text"
                    borderRadius="lg"
                    _hover={{ bg: "#F5F1EB" }}
                  >
                    <Settings size={16} />
                    <Text ml={2}>Account settings</Text>
                  </Menu.Item>
                  <Menu.Separator borderColor="admin.border" />
                  <Menu.Item
                    value="sign-out"
                    onClick={handleSignOut}
                    color="#B23610"
                    borderRadius="lg"
                    _hover={{ bg: "#FEF3EC" }}
                  >
                    <LogOut size={16} />
                    <Text ml={2}>Sign out</Text>
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Flex>

        {/* Main Page Area */}
        <Box as="main" p={{ base: 4, md: 8 }} flex="1" overflowY="auto">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}

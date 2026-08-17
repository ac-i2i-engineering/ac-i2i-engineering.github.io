"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, Heading, Text, VStack, Badge } from "@chakra-ui/react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: "📊" },
  { label: "Teams & Members", href: "/team", icon: "👥" },
  { label: "Events & Hackathons", href: "/events", icon: "📅" },
  { label: "Projects & Startups", href: "/projects", icon: "🚀" },
  { label: "Media Manager", href: "/media", icon: "🖼️" },
  { label: "Settings & Access", href: "/settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <Box
      as="nav"
      w="270px"
      bg="#0D1322"
      color="white"
      minH="100vh"
      p={5}
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      borderRight="1px solid"
      borderColor="rgba(255, 255, 255, 0.08)"
      boxShadow="4px 0 24px rgba(0,0,0,0.3)"
    >
      {/* Brand Header */}
      <Flex align="center" gap={3.5} mb={8} px={2} pt={1}>
        <Flex
          w="42px"
          h="42px"
          borderRadius="xl"
          background="linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)"
          align="center"
          justify="center"
          fontWeight="extrabold"
          fontSize="lg"
          color="white"
          boxShadow="0 0 20px rgba(99, 102, 241, 0.5)"
        >
          i2i
        </Flex>
        <Box>
          <Flex align="center" gap={2}>
            <Heading size="md" color="white" fontWeight="bold" letterSpacing="-0.02em">
              i2i Admin
            </Heading>
            <Badge
              bg="rgba(99, 102, 241, 0.2)"
              color="#A5B4FC"
              border="1px solid rgba(99, 102, 241, 0.4)"
              fontSize="10px"
              px={1.5}
              borderRadius="md"
            >
              PRO
            </Badge>
          </Flex>
          <Text fontSize="xs" color="gray.400" mt={0.5}>
            Ideas 2 Innovation
          </Text>
        </Box>
      </Flex>

      <Text fontSize="11px" fontWeight="bold" color="gray.500" textTransform="uppercase" letterSpacing="0.1em" px={3} mb={3}>
        Main Navigation
      </Text>

      {/* Nav List */}
      <VStack align="stretch" gap={1.5}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <Flex
                align="center"
                justify="space-between"
                px={3.5}
                py={3}
                borderRadius="xl"
                cursor="pointer"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                bg={
                  isActive
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)"
                    : "transparent"
                }
                border="1px solid"
                borderColor={isActive ? "rgba(99, 102, 241, 0.5)" : "transparent"}
                color={isActive ? "white" : "#94A3B8"}
                _hover={{
                  bg: isActive
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)"
                    : "rgba(255, 255, 255, 0.04)",
                  color: "white",
                  transform: "translateX(2px)",
                }}
              >
                <Flex align="center" gap={3}>
                  <Text fontSize="1.1rem">{item.icon}</Text>
                  <Text fontWeight={isActive ? "semibold" : "medium"} fontSize="sm">
                    {item.label}
                  </Text>
                </Flex>
                {isActive && (
                  <Box
                    w="6px"
                    h="6px"
                    borderRadius="full"
                    bg="#818CF8"
                    boxShadow="0 0 10px #818CF8"
                  />
                )}
              </Flex>
            </Link>
          );
        })}
      </VStack>

      {/* Footer Info */}
      <Box mt="auto" pt={6} borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.08)" px={2}>
        <Flex align="center" gap={2.5}>
          <Box w="8px" h="8px" borderRadius="full" bg="#10B981" boxShadow="0 0 10px #10B981" />
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="gray.300">
              Supabase Live DB
            </Text>
            <Text fontSize="10px" color="gray.500">
              Postgres + Auth + Storage
            </Text>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
}

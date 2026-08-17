"use client";

import { Box, Flex, Text, Avatar, Badge } from "@chakra-ui/react";
import { Sidebar } from "./Sidebar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
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
              <Text fontWeight="semibold" color="gray.200" fontSize="sm">
                Simon Iradukunda
              </Text>
              <Text fontSize="xs" color="gray.400">
                admin@i2i-engineering.org
              </Text>
            </Box>
            <Avatar.Root size="md" border="2px solid rgba(99, 102, 241, 0.5)">
              <Avatar.Fallback name="Simon Iradukunda" bg="indigo.600" color="white" fontWeight="bold" />
            </Avatar.Root>
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

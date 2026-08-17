"use client";

import { Box, Flex, Text, Badge } from "@chakra-ui/react";
import { relativeTime } from "@/lib/utils/relativeTime";

interface StatCardProps {
  title: string;
  count: number;
  updatedLast7Days: number;
  lastUpdatedAt: string | null;
  upcomingCount?: number;
  icon?: string;
  gradient?: string;
}

export function StatCard({
  title,
  count,
  updatedLast7Days,
  lastUpdatedAt,
  upcomingCount,
  icon = "📊",
  gradient = "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
}: StatCardProps) {
  return (
    <Box
      className="glass-card"
      p={6}
      borderRadius="2xl"
      position="relative"
      overflow="hidden"
    >
      {/* Background Accent Glow */}
      <Box
        position="absolute"
        top="-20px"
        right="-20px"
        w="100px"
        h="100px"
        borderRadius="full"
        background={gradient}
        filter="blur(30px)"
        opacity="0.6"
        pointerEvents="none"
      />

      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box>
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="0.05em" mb={1}>
            {title}
          </Text>
          <Text fontSize="4xl" fontWeight="extrabold" color="white" letterSpacing="-0.03em">
            {count}
          </Text>
        </Box>
        <Flex
          w="48px"
          h="48px"
          borderRadius="xl"
          bg="rgba(255, 255, 255, 0.06)"
          border="1px solid rgba(255, 255, 255, 0.1)"
          align="center"
          justify="center"
          fontSize="2xl"
          boxShadow="inset 0 1px 1px rgba(255, 255, 255, 0.1)"
        >
          {icon}
        </Flex>
      </Flex>

      <Flex align="center" gap={2} wrap="wrap" mb={4}>
        <Badge
          bg="rgba(99, 102, 241, 0.15)"
          color="#A5B4FC"
          border="1px solid rgba(99, 102, 241, 0.3)"
          px={2.5}
          py={1}
          borderRadius="lg"
          fontSize="xs"
          fontWeight="semibold"
        >
          ⚡ {updatedLast7Days} updated in 7d
        </Badge>

        {upcomingCount !== undefined && (
          <Badge
            bg="rgba(16, 185, 129, 0.15)"
            color="#6EE7B7"
            border="1px solid rgba(16, 185, 129, 0.3)"
            px={2.5}
            py={1}
            borderRadius="lg"
            fontSize="xs"
            fontWeight="semibold"
          >
            🔥 {upcomingCount} upcoming
          </Badge>
        )}
      </Flex>

      <Text fontSize="xs" color="gray.400">
        Last updated: {relativeTime(lastUpdatedAt)}
      </Text>
    </Box>
  );
}

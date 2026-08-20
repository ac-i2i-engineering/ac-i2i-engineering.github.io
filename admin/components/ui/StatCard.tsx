"use client";

import { Box, Flex, Text, Badge } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, CalendarClock } from "lucide-react";
import { relativeTime } from "@/lib/utils/relativeTime";

interface StatCardProps {
  title: string;
  count: number;
  updatedLast7Days: number;
  lastUpdatedAt: string | null;
  upcomingCount?: number;
  icon: LucideIcon;
}

export function StatCard({ title, count, updatedLast7Days, lastUpdatedAt, upcomingCount, icon: Icon }: StatCardProps) {
  return (
    <Box className="admin-card" p={6} borderRadius="2xl">
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Box>
          <Text fontSize="xs" fontWeight="bold" color="admin.textMuted" textTransform="uppercase" letterSpacing="0.05em" mb={1}>
            {title}
          </Text>
          <Text fontSize="4xl" fontWeight="extrabold" color="admin.text" letterSpacing="-0.03em">
            {count}
          </Text>
        </Box>
        <Flex w="44px" h="44px" borderRadius="xl" bg="brand.subtle" align="center" justify="center">
          <Icon size={22} color="#D24114" strokeWidth={2} />
        </Flex>
      </Flex>

      <Flex align="center" gap={2} wrap="wrap" mb={4}>
        <Badge bg="#F0F7F1" color="#2F7A3C" px={2.5} py={1} borderRadius="lg" fontSize="xs" fontWeight="semibold" display="flex" alignItems="center" gap={1}>
          <TrendingUp size={12} />
          {updatedLast7Days} updated in 7d
        </Badge>

        {upcomingCount !== undefined && (
          <Badge bg="info.subtle" color="info.fg" px={2.5} py={1} borderRadius="lg" fontSize="xs" fontWeight="semibold" display="flex" alignItems="center" gap={1}>
            <CalendarClock size={12} />
            {upcomingCount} upcoming
          </Badge>
        )}
      </Flex>

      <Text fontSize="xs" color="admin.textMuted">
        Last updated: {relativeTime(lastUpdatedAt)}
      </Text>
    </Box>
  );
}

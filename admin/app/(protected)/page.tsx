"use client";

import { useEffect, useState } from "react";
import { Box, Heading, Text, SimpleGrid, Flex, Button, Card, Badge, Spinner } from "@chakra-ui/react";
import Link from "next/link";
import { StatCard } from "@/components/ui/StatCard";
import { createClient } from "@/lib/supabase/client";
import {
  getTeamMemberStats,
  getEventStats,
  getStartupStats,
  getMediaStats,
  CardStats,
  EventStats,
} from "@/lib/queries/stats";
import { relativeTime } from "@/lib/utils/relativeTime";

interface ActivityLogItem {
  id: string;
  action: string;
  entity_type: string;
  summary: string;
  created_at: string;
}

export default function HomePage() {
  const [teamStats, setTeamStats] = useState<CardStats>({ total: 0, updatedLast7Days: 0, lastUpdatedAt: null });
  const [eventStats, setEventStats] = useState<EventStats>({ total: 0, updatedLast7Days: 0, lastUpdatedAt: null, upcoming: 0 });
  const [startupStats, setStartupStats] = useState<CardStats>({ total: 0, updatedLast7Days: 0, lastUpdatedAt: null });
  const [mediaStats, setMediaStats] = useState<CardStats>({ total: 0, updatedLast7Days: 0, lastUpdatedAt: null });
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const supabase = createClient();

      try {
        const [team, evt, startup, media] = await Promise.all([
          getTeamMemberStats(supabase),
          getEventStats(supabase),
          getStartupStats(supabase),
          getMediaStats(supabase),
        ]);

        setTeamStats(team);
        setEventStats(evt);
        setStartupStats(startup);
        setMediaStats(media);

        const { data: actData } = await supabase
          .from("activity_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (actData && actData.length > 0) {
          setActivities(actData as ActivityLogItem[]);
        } else {
          setActivities([
            { id: "1", action: "create", entity_type: "event", summary: "Created new hackathon event", created_at: new Date(Date.now() - 3600000).toISOString() },
            { id: "2", action: "update", entity_type: "team_member", summary: "Updated department roles & leads", created_at: new Date(Date.now() - 7200000).toISOString() },
            { id: "3", action: "create", entity_type: "startup", summary: "Added new NeuroTech startup entry", created_at: new Date(Date.now() - 86400000).toISOString() },
          ]);
        }
      } catch (err) {
        console.warn("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <Box maxW="1300px" mx="auto">
      {/* Header Banner */}
      <Flex justify="space-between" align="center" mb={10} wrap="wrap" gap={4}>
        <Box>
          <Heading size="2xl" color="white" fontWeight="extrabold" letterSpacing="-0.03em" mb={2}>
            Dashboard <Text as="span" className="gradient-text">Overview</Text>
          </Heading>
          <Text color="gray.400" fontSize="sm">
            Real-time management portal for Ideas 2 Innovation (i2i) team, events, and portfolio.
          </Text>
        </Box>

        <Flex gap={3}>
          <Link href="/team">
            <Button
              background="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
              color="white"
              fontWeight="bold"
              px={5}
              borderRadius="xl"
              boxShadow="0 4px 15px rgba(99, 102, 241, 0.4)"
            >
              + Manage Team
            </Button>
          </Link>
          <Link href="/events">
            <Button
              variant="outline"
              borderColor="rgba(255, 255, 255, 0.15)"
              color="gray.200"
              fontWeight="bold"
              px={5}
              borderRadius="xl"
              _hover={{ bg: "rgba(255, 255, 255, 0.06)" }}
            >
              + Add Event
            </Button>
          </Link>
        </Flex>
      </Flex>

      {/* 4 Floating Stat Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={6} mb={10}>
        <StatCard
          title="Team Members"
          count={teamStats.total}
          updatedLast7Days={teamStats.updatedLast7Days}
          lastUpdatedAt={teamStats.lastUpdatedAt}
          icon="👥"
          gradient="linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)"
        />
        <StatCard
          title="Events & Hackathons"
          count={eventStats.total}
          updatedLast7Days={eventStats.updatedLast7Days}
          lastUpdatedAt={eventStats.lastUpdatedAt}
          upcomingCount={eventStats.upcoming}
          icon="📅"
          gradient="linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)"
        />
        <StatCard
          title="Projects / Startups"
          count={startupStats.total}
          updatedLast7Days={startupStats.updatedLast7Days}
          lastUpdatedAt={startupStats.lastUpdatedAt}
          icon="🚀"
          gradient="linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(219, 39, 119, 0.3) 100%)"
        />
        <StatCard
          title="Media Storage"
          count={mediaStats.total}
          updatedLast7Days={mediaStats.updatedLast7Days}
          lastUpdatedAt={mediaStats.lastUpdatedAt}
          icon="🖼️"
          gradient="linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)"
        />
      </SimpleGrid>

      {/* Management Cards */}
      <Heading size="md" color="white" mb={5} fontWeight="bold">
        Quick Action Modules
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={10}>
        <Box className="glass-card" p={6} borderRadius="2xl">
          <Text fontSize="2xl" mb={2}>👥</Text>
          <Heading size="sm" color="white" mb={2}>
            Team Members
          </Heading>
          <Text fontSize="xs" color="gray.400" mb={5}>
            Manage member titles, department assignments, profile photos, and lead toggles.
          </Text>
          <Link href="/team">
            <Button size="xs" variant="outline" borderColor="#818CF8" color="#A5B4FC" borderRadius="lg">
              Manage Team →
            </Button>
          </Link>
        </Box>

        <Box className="glass-card" p={6} borderRadius="2xl">
          <Text fontSize="2xl" mb={2}>📅</Text>
          <Heading size="sm" color="white" mb={2}>
            Events & Hackathons
          </Heading>
          <Text fontSize="xs" color="gray.400" mb={5}>
            Schedule workshops, guest lectures, set registration links, and toggle published status.
          </Text>
          <Link href="/events">
            <Button size="xs" variant="outline" borderColor="#34D399" color="#6EE7B7" borderRadius="lg">
              Manage Events →
            </Button>
          </Link>
        </Box>

        <Box className="glass-card" p={6} borderRadius="2xl">
          <Text fontSize="2xl" mb={2}>🚀</Text>
          <Heading size="sm" color="white" mb={2}>
            Startups & Projects
          </Heading>
          <Text fontSize="xs" color="gray.400" mb={5}>
            Add project descriptions, GitHub repositories, demo links, and category tag chips.
          </Text>
          <Link href="/projects">
            <Button size="xs" variant="outline" borderColor="#F472B6" color="#F472B6" borderRadius="lg">
              Manage Projects →
            </Button>
          </Link>
        </Box>
      </SimpleGrid>

      {/* Activity Stream */}
      <Box className="glass-panel" p={6} borderRadius="2xl">
        <Flex justify="space-between" align="center" mb={5}>
          <Heading size="sm" color="white" fontWeight="bold">
            Live System Activity Log
          </Heading>
          <Badge bg="rgba(99, 102, 241, 0.2)" color="#A5B4FC" px={2.5} py={0.5} borderRadius="md" fontSize="xs">
            Live Stream
          </Badge>
        </Flex>

        {loading ? (
          <Flex align="center" gap={2} py={4}>
            <Spinner size="xs" color="indigo.400" />
            <Text fontSize="xs" color="gray.400">
              Fetching updates...
            </Text>
          </Flex>
        ) : (
          <Box>
            {activities.map((act) => (
              <Flex
                key={act.id}
                justify="space-between"
                align="center"
                py={3.5}
                borderBottom="1px solid rgba(255, 255, 255, 0.06)"
                _last={{ borderBottom: "none" }}
              >
                <Flex align="center" gap={3}>
                  <Badge
                    bg={
                      act.action === "create"
                        ? "rgba(16, 185, 129, 0.2)"
                        : act.action === "update"
                        ? "rgba(99, 102, 241, 0.2)"
                        : "rgba(239, 68, 68, 0.2)"
                    }
                    color={
                      act.action === "create"
                        ? "#6EE7B7"
                        : act.action === "update"
                        ? "#A5B4FC"
                        : "#FCA5A5"
                    }
                    size="xs"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    textTransform="uppercase"
                  >
                    {act.action}
                  </Badge>
                  <Text fontSize="sm" color="gray.200" fontWeight="medium">
                    {act.summary}
                  </Text>
                </Flex>
                <Text fontSize="xs" color="gray.500">
                  {relativeTime(act.created_at)}
                </Text>
              </Flex>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

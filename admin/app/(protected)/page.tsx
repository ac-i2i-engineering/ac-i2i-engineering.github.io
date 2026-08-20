"use client";

import { useEffect, useState } from "react";
import { Box, Heading, Text, SimpleGrid, Flex, Button, Badge, Spinner } from "@chakra-ui/react";
import Link from "next/link";
import { Users, CalendarDays, Rocket, Images, ArrowRight } from "lucide-react";
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

const ACTION_STYLE: Record<string, { bg: string; color: string }> = {
  create: { bg: "#F0F7F1", color: "#2F7A3C" },
  update: { bg: "#FEF6F0", color: "#B23610" },
  delete: { bg: "#FCEEEE", color: "#B42318" },
};

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

        setActivities((actData as ActivityLogItem[]) ?? []);
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
      {/* Header */}
      <Flex justify="space-between" align="center" mb={10} wrap="wrap" gap={4}>
        <Box>
          <Heading size="2xl" color="admin.text" fontWeight="extrabold" letterSpacing="-0.02em" mb={2}>
            Dashboard
          </Heading>
          <Text color="admin.textMuted" fontSize="sm">
            Manage the i2i team, events, and portfolio.
          </Text>
        </Box>

        <Flex gap={3}>
          <Link href="/team">
            <Button colorPalette="brand" fontWeight="bold" px={5} borderRadius="xl">
              Manage Team
            </Button>
          </Link>
          <Link href="/events">
            <Button variant="outline" borderColor="admin.border" color="admin.text" fontWeight="bold" px={5} borderRadius="xl" _hover={{ bg: "#F5F1EB" }}>
              Add Event
            </Button>
          </Link>
        </Flex>
      </Flex>

      {/* Stat Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={6} mb={10}>
        <StatCard title="Team Members" count={teamStats.total} updatedLast7Days={teamStats.updatedLast7Days} lastUpdatedAt={teamStats.lastUpdatedAt} icon={Users} />
        <StatCard
          title="Events & Hackathons"
          count={eventStats.total}
          updatedLast7Days={eventStats.updatedLast7Days}
          lastUpdatedAt={eventStats.lastUpdatedAt}
          upcomingCount={eventStats.upcoming}
          icon={CalendarDays}
        />
        <StatCard title="Projects / Startups" count={startupStats.total} updatedLast7Days={startupStats.updatedLast7Days} lastUpdatedAt={startupStats.lastUpdatedAt} icon={Rocket} />
        <StatCard title="Media Storage" count={mediaStats.total} updatedLast7Days={mediaStats.updatedLast7Days} lastUpdatedAt={mediaStats.lastUpdatedAt} icon={Images} />
      </SimpleGrid>

      {/* Quick Actions */}
      <Heading size="md" color="admin.text" mb={5} fontWeight="bold">
        Quick Actions
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={10}>
        <Box className="admin-card" p={6} borderRadius="2xl">
          <Flex w="40px" h="40px" borderRadius="xl" bg="brand.subtle" align="center" justify="center" mb={3}>
            <Users size={20} color="#D24114" />
          </Flex>
          <Heading size="sm" color="admin.text" mb={2}>
            Team Members
          </Heading>
          <Text fontSize="xs" color="admin.textMuted" mb={5}>
            Manage member titles, department assignments, profile photos, and lead toggles.
          </Text>
          <Link href="/team">
            <Flex align="center" gap={1} fontSize="xs" fontWeight="bold" color="brand.fg" _hover={{ gap: 1.5 }} transition="gap 0.15s">
              Manage Team <ArrowRight size={14} />
            </Flex>
          </Link>
        </Box>

        <Box className="admin-card" p={6} borderRadius="2xl">
          <Flex w="40px" h="40px" borderRadius="xl" bg="brand.subtle" align="center" justify="center" mb={3}>
            <CalendarDays size={20} color="#D24114" />
          </Flex>
          <Heading size="sm" color="admin.text" mb={2}>
            Events & Hackathons
          </Heading>
          <Text fontSize="xs" color="admin.textMuted" mb={5}>
            Schedule workshops, guest lectures, set registration links, and toggle published status.
          </Text>
          <Link href="/events">
            <Flex align="center" gap={1} fontSize="xs" fontWeight="bold" color="brand.fg" _hover={{ gap: 1.5 }} transition="gap 0.15s">
              Manage Events <ArrowRight size={14} />
            </Flex>
          </Link>
        </Box>

        <Box className="admin-card" p={6} borderRadius="2xl">
          <Flex w="40px" h="40px" borderRadius="xl" bg="brand.subtle" align="center" justify="center" mb={3}>
            <Rocket size={20} color="#D24114" />
          </Flex>
          <Heading size="sm" color="admin.text" mb={2}>
            Startups & Projects
          </Heading>
          <Text fontSize="xs" color="admin.textMuted" mb={5}>
            Add project descriptions, GitHub repositories, demo links, and category tag chips.
          </Text>
          <Link href="/projects">
            <Flex align="center" gap={1} fontSize="xs" fontWeight="bold" color="brand.fg" _hover={{ gap: 1.5 }} transition="gap 0.15s">
              Manage Projects <ArrowRight size={14} />
            </Flex>
          </Link>
        </Box>
      </SimpleGrid>

      {/* Activity */}
      <Box className="admin-panel" p={6} borderRadius="2xl">
        <Heading size="sm" color="admin.text" fontWeight="bold" mb={5}>
          Recent Activity
        </Heading>

        {loading ? (
          <Flex align="center" gap={2} py={4}>
            <Spinner size="xs" color="brand.solid" />
            <Text fontSize="xs" color="admin.textMuted">
              Loading...
            </Text>
          </Flex>
        ) : activities.length === 0 ? (
          <Text fontSize="sm" color="admin.textMuted" py={4}>
            No activity yet. Actions taken across Team, Events, Projects, and Media will show up here.
          </Text>
        ) : (
          <Box>
            {activities.map((act) => {
              const style = ACTION_STYLE[act.action] ?? ACTION_STYLE.update;
              return (
                <Flex key={act.id} justify="space-between" align="center" py={3.5} borderBottom="1px solid" borderColor="admin.border" _last={{ borderBottom: "none" }}>
                  <Flex align="center" gap={3}>
                    <Badge bg={style.bg} color={style.color} size="xs" px={2} py={0.5} borderRadius="md" textTransform="uppercase">
                      {act.action}
                    </Badge>
                    <Text fontSize="sm" color="admin.text" fontWeight="medium">
                      {act.summary}
                    </Text>
                  </Flex>
                  <Text fontSize="xs" color="admin.textMuted">
                    {relativeTime(act.created_at)}
                  </Text>
                </Flex>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}

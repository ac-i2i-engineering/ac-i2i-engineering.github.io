"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Box, Flex, Text, VStack, IconButton } from "@chakra-ui/react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Rocket,
  Images,
  Settings,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Team", href: "/team", icon: Users },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Projects & Startups", href: "/projects", icon: Rocket },
  { label: "Media", href: "/media", icon: Images },
  { label: "Settings & Access", href: "/settings", icon: Settings },
];

const STORAGE_KEY = "i2i-admin-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Reading localStorage genuinely has to happen post-mount, not during
  // a lazy useState initializer -- the server render (and client's first
  // render, pre-hydration) has no window/localStorage at all, so computing
  // this eagerly would produce a hydration mismatch instead of just a
  // one-frame flash of the default state.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "true") setCollapsed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  return (
    <Box
      as="nav"
      w={collapsed ? "76px" : "260px"}
      flexShrink={0}
      bg="admin.surface"
      h="100%"
      overflowY="auto"
      p={collapsed ? 3 : 5}
      display={{ base: "none", md: "flex" }}
      flexDirection="column"
      borderRight="1px solid"
      borderColor="admin.border"
      transition="width 0.18s ease"
    >
      {/* Brand Header */}
      <Flex align="center" justify={collapsed ? "center" : "space-between"} mb={8} px={collapsed ? 0 : 2} pt={1}>
        {collapsed ? (
          <Flex w="32px" h="32px" borderRadius="lg" bg="brand.solid" align="center" justify="center" flexShrink={0}>
            <Text fontSize="10px" fontWeight="extrabold" color="white" letterSpacing="-0.02em">
              i2i
            </Text>
          </Flex>
        ) : (
          <Image src="/i2i-logo.png" alt="i2i" width={120} height={36} style={{ height: "32px", width: "auto" }} priority />
        )}
        {!collapsed && (
          <IconButton
            aria-label="Collapse sidebar"
            size="xs"
            variant="ghost"
            color="admin.textMuted"
            onClick={() => setCollapsed(true)}
            _hover={{ bg: "#F5F1EB", color: "brand.fg" }}
          >
            <PanelLeftClose size={16} />
          </IconButton>
        )}
      </Flex>

      {collapsed && (
        <Flex justify="center" mb={4}>
          <IconButton
            aria-label="Expand sidebar"
            size="xs"
            variant="ghost"
            color="admin.textMuted"
            onClick={() => setCollapsed(false)}
            _hover={{ bg: "#F5F1EB", color: "brand.fg" }}
          >
            <PanelLeftOpen size={16} />
          </IconButton>
        </Flex>
      )}

      {!collapsed && (
        <Text fontSize="11px" fontWeight="bold" color="admin.textMuted" textTransform="uppercase" letterSpacing="0.1em" px={3} mb={3}>
          Main Navigation
        </Text>
      )}

      {/* Nav List */}
      <VStack align="stretch" gap={1}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }} title={collapsed ? item.label : undefined}>
              <Flex
                align="center"
                justify={collapsed ? "center" : "flex-start"}
                gap={3}
                px={collapsed ? 0 : 3.5}
                py={2.5}
                borderRadius="lg"
                cursor="pointer"
                transition="all 0.15s ease"
                bg={isActive ? "brand.subtle" : "transparent"}
                color={isActive ? "brand.fg" : "#4A4038"}
                fontWeight={isActive ? "semibold" : "medium"}
                _hover={{ bg: isActive ? "brand.subtle" : "#F5F1EB", color: "brand.fg" }}
              >
                <Icon size={18} strokeWidth={2} />
                {!collapsed && <Text fontSize="sm">{item.label}</Text>}
              </Flex>
            </Link>
          );
        })}
      </VStack>

      {/* Footer */}
      <Box mt="auto" pt={5} borderTop="1px solid" borderColor="admin.border" px={collapsed ? 0 : 1}>
        <a
          href="https://ac-i2i-engineering.github.io/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
          title={collapsed ? "View public site" : undefined}
        >
          <Flex
            align="center"
            justify={collapsed ? "center" : "flex-start"}
            gap={2}
            px={collapsed ? 0 : 2.5}
            py={2}
            borderRadius="lg"
            color="admin.textMuted"
            fontSize="xs"
            fontWeight="medium"
            _hover={{ color: "brand.fg", bg: "#F5F1EB" }}
          >
            <ExternalLink size={14} />
            {!collapsed && <Text>View public site</Text>}
          </Flex>
        </a>
      </Box>
    </Box>
  );
}

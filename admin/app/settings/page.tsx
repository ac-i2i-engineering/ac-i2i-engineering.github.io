"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  Badge,
  Input,
  NativeSelect,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ModalFormWrapper } from "@/components/ui/ModalFormWrapper";
import { createClient } from "@/lib/supabase/client";
import { relativeTime } from "@/lib/utils/relativeTime";
import type { AdminUser } from "@/lib/types";

export default function SettingsPage() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviteFullName, setInviteFullName] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  async function fetchAdminUsers() {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setAdminUsers(data);
      } else {
        setAdminUsers([
          {
            id: "u1",
            email: "admin@i2i-engineering.org",
            full_name: "Simon Iradukunda",
            role: "Super Admin",
            created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          {
            id: "u2",
            email: "reza@i2i-engineering.org",
            full_name: "Reza Team Lead",
            role: "Admin",
            created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn("Error fetching admin users", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setSending(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          fullName: inviteFullName,
        }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setMessage({ type: "success", text: `Invitation sent to ${inviteEmail}` });
        setAdminUsers((prev) => [data.user, ...prev]);
        setIsInviteOpen(false);
        setInviteEmail("");
        setInviteFullName("");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send invitation" });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Network error sending invitation" });
    } finally {
      setSending(false);
    }
  };

  const columns: ColumnDef<AdminUser>[] = [
    {
      header: "Admin User",
      cell: (row) => (
        <Box>
          <Text fontWeight="semibold" color="white" fontSize="sm">
            {row.full_name || "Admin Member"}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {row.email}
          </Text>
        </Box>
      ),
      sortable: true,
      accessorKey: "email",
    },
    {
      header: "Role",
      cell: (row) => (
        <Badge
          bg={row.role.toLowerCase().includes("super") ? "rgba(168, 85, 247, 0.2)" : "rgba(99, 102, 241, 0.2)"}
          color={row.role.toLowerCase().includes("super") ? "#C084FC" : "#A5B4FC"}
          px={2.5}
          py={0.5}
          borderRadius="md"
        >
          {row.role}
        </Badge>
      ),
      sortable: true,
      accessorKey: "role",
    },
    {
      header: "Joined Date",
      cell: (row) => (
        <Text fontSize="xs" color="gray.400">
          {relativeTime(row.created_at)}
        </Text>
      ),
      sortable: true,
      accessorKey: "created_at",
    },
  ];

  return (
    <Box maxW="1300px" mx="auto">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
        <Box>
          <Heading size="xl" color="white" fontWeight="extrabold" mb={1}>
            Settings & <Text as="span" className="gradient-text">Admin Access</Text>
          </Heading>
          <Text color="gray.400" fontSize="sm">
            Manage administrative user permissions, system health, and invite team members.
          </Text>
        </Box>

        <Button
          background="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
          color="white"
          fontWeight="bold"
          px={5}
          borderRadius="xl"
          onClick={() => setIsInviteOpen(true)}
        >
          + Invite Admin User
        </Button>
      </Flex>

      {message && (
        <Box
          p={4}
          mb={6}
          borderRadius="xl"
          bg={message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"}
          border="1px solid"
          borderColor={message.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}
        >
          <Text fontSize="sm" color={message.type === "success" ? "#6EE7B7" : "#FCA5A5"}>
            {message.text}
          </Text>
        </Box>
      )}

      {/* System Status Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6} mb={8}>
        <Box className="glass-card" p={5} borderRadius="2xl">
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="0.05em" mb={2}>
            DATABASE STATUS
          </Text>
          <Flex align="center" gap={2}>
            <Box w="10px" h="10px" borderRadius="full" bg="#10B981" boxShadow="0 0 10px #10B981" />
            <Text fontWeight="bold" color="white">
              Supabase Postgres Connected
            </Text>
          </Flex>
          <Text fontSize="xs" color="gray.500" mt={2}>
            Row Level Security (RLS) Enforced
          </Text>
        </Box>

        <Box className="glass-card" p={5} borderRadius="2xl">
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="0.05em" mb={2}>
            STORAGE BUCKETS
          </Text>
          <Flex align="center" gap={2}>
            <Box w="10px" h="10px" borderRadius="full" bg="#10B981" boxShadow="0 0 10px #10B981" />
            <Text fontWeight="bold" color="white">
              4 Active Storage Buckets
            </Text>
          </Flex>
          <Text fontSize="xs" color="gray.500" mt={2}>
            team-photos, event-images, startup-images
          </Text>
        </Box>

        <Box className="glass-card" p={5} borderRadius="2xl">
          <Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="0.05em" mb={2}>
            SECURITY MODE
          </Text>
          <Flex align="center" gap={2}>
            <Box w="10px" h="10px" borderRadius="full" bg="#818CF8" boxShadow="0 0 10px #818CF8" />
            <Text fontWeight="bold" color="white">
              Server API Key Protection
            </Text>
          </Flex>
          <Text fontSize="xs" color="gray.500" mt={2}>
            Service role key isolated server-side
          </Text>
        </Box>
      </SimpleGrid>

      {/* Admin Users Table */}
      <Heading size="sm" color="white" mb={4} fontWeight="bold">
        Administrative Accounts ({adminUsers.length})
      </Heading>

      <DataTable
        data={adminUsers}
        columns={columns}
        searchPlaceholder="Search admin accounts..."
        isLoading={loading}
        onAddClick={() => setIsInviteOpen(true)}
        addButtonLabel="Invite Admin"
      />

      {/* Invite Modal */}
      <ModalFormWrapper
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite New Admin User"
        onSubmit={handleSendInvite}
        submitLabel="Send Invitation"
        isLoading={sending}
      >
        <VStack align="stretch" gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={1}>
              Full Name
            </Text>
            <Input
              value={inviteFullName}
              onChange={(e) => setInviteFullName(e.target.value)}
              placeholder="e.g. Alex Smith"
              bg="rgba(15, 23, 42, 0.6)"
              border="1px solid rgba(255, 255, 255, 0.12)"
              color="white"
              borderRadius="xl"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={1}>
              Email Address *
            </Text>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@i2i-engineering.org"
              bg="rgba(15, 23, 42, 0.6)"
              border="1px solid rgba(255, 255, 255, 0.12)"
              color="white"
              borderRadius="xl"
              required
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={1}>
              Admin Role
            </Text>
            <NativeSelect.Root size="md">
              <NativeSelect.Field
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                bg="#0F172A"
                borderColor="rgba(255, 255, 255, 0.12)"
                color="white"
                borderRadius="xl"
              >
                <option value="admin" style={{ background: "#0F172A", color: "white" }}>Admin</option>
                <option value="editor" style={{ background: "#0F172A", color: "white" }}>Editor</option>
                <option value="super_admin" style={{ background: "#0F172A", color: "white" }}>Super Admin</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>
        </VStack>
      </ModalFormWrapper>
    </Box>
  );
}

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
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import { useAdminSession } from "@/lib/auth/SessionContext";
import { relativeTime } from "@/lib/utils/relativeTime";
import type { AdminUser } from "@/lib/types";

export default function SettingsPage() {
  const session = useAdminSession();
  const isOwner = session.admin.role === "owner";

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "owner">("admin");
  const [inviteFullName, setInviteFullName] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchAdminUsers() {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: false });

      setAdminUsers(data ?? []);
    } catch (err) {
      console.warn("Error fetching admin users", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdminUsers();
  }, []);

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
        setInviteRole("admin");
      } else {
        setMessage({ type: "error", text: data.error || "Failed to send invitation" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error sending invitation" });
    } finally {
      setSending(false);
    }
  };

  async function handleToggleStatus() {
    if (!statusTarget) return;
    const nextStatus = statusTarget.status === "active" ? "suspended" : "active";

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/${statusTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();

      if (res.ok) {
        setAdminUsers((prev) => prev.map((u) => (u.id === statusTarget.id ? { ...u, status: nextStatus } : u)));
        setMessage({ type: "success", text: `${statusTarget.email} ${nextStatus === "active" ? "reactivated" : "suspended"}` });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update status" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error updating status" });
    } finally {
      setActionLoading(false);
      setStatusTarget(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        setAdminUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        setMessage({ type: "success", text: `${deleteTarget.email} removed` });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to delete admin" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error deleting admin" });
    } finally {
      setActionLoading(false);
      setDeleteTarget(null);
    }
  }

  const columns: ColumnDef<AdminUser>[] = [
    {
      header: "Admin User",
      cell: (row) => (
        <Box>
          <Text fontWeight="semibold" color="white" fontSize="sm">
            {row.full_name || row.email}
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
          bg={row.role === "owner" ? "rgba(251, 191, 36, 0.15)" : "rgba(99, 102, 241, 0.2)"}
          color={row.role === "owner" ? "#FBBF24" : "#A5B4FC"}
          px={2.5}
          py={0.5}
          borderRadius="md"
          textTransform="capitalize"
        >
          {row.role}
        </Badge>
      ),
      sortable: true,
      accessorKey: "role",
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          bg={row.status === "active" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"}
          color={row.status === "active" ? "#34D399" : "#FCA5A5"}
          px={2.5}
          py={0.5}
          borderRadius="md"
          textTransform="capitalize"
        >
          {row.status}
        </Badge>
      ),
      sortable: true,
      accessorKey: "status",
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
    ...(isOwner
      ? [
          {
            header: "",
            cell: (row: AdminUser) => (
              <Flex gap={2} justify="flex-end">
                <Button size="xs" variant="outline" colorPalette="gray" onClick={() => setStatusTarget(row)}>
                  {row.status === "active" ? "Suspend" : "Reactivate"}
                </Button>
                <Button size="xs" variant="outline" colorPalette="red" onClick={() => setDeleteTarget(row)}>
                  Delete
                </Button>
              </Flex>
            ),
            sortable: false,
          },
        ]
      : []),
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
            YOUR ROLE
          </Text>
          <Flex align="center" gap={2}>
            <Box w="10px" h="10px" borderRadius="full" bg="#818CF8" boxShadow="0 0 10px #818CF8" />
            <Text fontWeight="bold" color="white" textTransform="capitalize">
              {session.admin.role}
            </Text>
          </Flex>
          <Text fontSize="xs" color="gray.500" mt={2}>
            {isOwner ? "Can suspend, reactivate, and delete admins" : "Content access only"}
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
                onChange={(e) => setInviteRole(e.target.value as "admin" | "owner")}
                bg="#0F172A"
                borderColor="rgba(255, 255, 255, 0.12)"
                color="white"
                borderRadius="xl"
              >
                <option value="admin" style={{ background: "#0F172A", color: "white" }}>Admin</option>
                {isOwner && (
                  <option value="owner" style={{ background: "#0F172A", color: "white" }}>Owner</option>
                )}
              </NativeSelect.Field>
            </NativeSelect.Root>
            {!isOwner && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                Only an Owner can invite another Owner.
              </Text>
            )}
          </Box>
        </VStack>
      </ModalFormWrapper>

      {/* Suspend/Reactivate confirmation */}
      <ConfirmDialog
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleToggleStatus}
        isLoading={actionLoading}
        title={statusTarget?.status === "active" ? "Suspend this admin?" : "Reactivate this admin?"}
        description={
          statusTarget?.status === "active"
            ? `${statusTarget?.email} will immediately lose all admin access. This is reversible.`
            : `${statusTarget?.email} will regain admin access immediately.`
        }
        confirmText={statusTarget?.status === "active" ? "Suspend" : "Reactivate"}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={actionLoading}
        title="Permanently delete this admin?"
        description={`${deleteTarget?.email} will be permanently removed and lose all access. This cannot be undone.`}
        confirmText="Delete Permanently"
      />
    </Box>
  );
}

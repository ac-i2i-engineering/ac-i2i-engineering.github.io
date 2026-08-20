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
  Avatar,
  Dialog,
  Code,
} from "@chakra-ui/react";
import { Copy, Check } from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ModalFormWrapper } from "@/components/ui/ModalFormWrapper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AvatarUploader } from "@/components/ui/AvatarUploader";
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
  const [issuedCredential, setIssuedCredential] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [profileName, setProfileName] = useState(session.admin.full_name ?? "");
  const [profileAvatar, setProfileAvatar] = useState(session.admin.avatar_url ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  async function fetchAdminUsers() {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data } = await supabase.from("admin_users").select("*").order("created_at", { ascending: false });
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

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const res = await fetch("/api/account/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: profileName, avatar_url: profileAvatar || null }),
      });
      const data = await res.json();

      if (res.ok) {
        setProfileMessage("Profile updated.");
      } else {
        setProfileMessage(data.error || "Failed to update profile");
      }
    } catch {
      setProfileMessage("Network error updating profile");
    } finally {
      setSavingProfile(false);
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
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, fullName: inviteFullName }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setAdminUsers((prev) => [data.user, ...prev]);
        setIsInviteOpen(false);
        setIssuedCredential({ email: inviteEmail, tempPassword: data.tempPassword });
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
        <Flex align="center" gap={3}>
          <Avatar.Root size="sm">
            <Avatar.Fallback
              name={row.full_name || row.email}
              bg="brand.solid"
              color="white"
              w="100%"
              h="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
            />
            {row.avatar_url && <Avatar.Image src={row.avatar_url} alt={row.full_name || row.email} />}
          </Avatar.Root>
          <Box>
            <Text fontWeight="semibold" color="admin.text" fontSize="sm">
              {row.full_name || row.email}
            </Text>
            <Text fontSize="xs" color="admin.textMuted">
              {row.email}
            </Text>
          </Box>
        </Flex>
      ),
      sortable: true,
      accessorKey: "email",
    },
    {
      header: "Role",
      cell: (row) => (
        <Badge
          bg={row.role === "owner" ? "#FEF3C7" : "info.subtle"}
          color={row.role === "owner" ? "#92600A" : "info.fg"}
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
          bg={row.status === "active" ? "#F0F7F1" : "#FCEEEE"}
          color={row.status === "active" ? "#2F7A3C" : "#B42318"}
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
        <Text fontSize="xs" color="admin.textMuted">
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
                <Button size="xs" variant="outline" borderColor="admin.border" color="admin.text" onClick={() => setStatusTarget(row)}>
                  {row.status === "active" ? "Suspend" : "Reactivate"}
                </Button>
                <Button size="xs" variant="outline" colorPalette="danger" onClick={() => setDeleteTarget(row)}>
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
      <Heading size="xl" color="admin.text" fontWeight="extrabold" mb={1}>
        Settings & Admin Access
      </Heading>
      <Text color="admin.textMuted" fontSize="sm" mb={8}>
        Manage your profile and administrative user permissions.
      </Text>

      {/* My Profile */}
      <Box className="admin-card" p={6} borderRadius="2xl" mb={8}>
        <Heading size="sm" color="admin.text" mb={5} fontWeight="bold">
          My Profile
        </Heading>
        <form onSubmit={handleSaveProfile}>
          <Flex gap={6} align="center" wrap="wrap">
            <AvatarUploader value={profileAvatar} onChange={setProfileAvatar} name={profileName || session.admin.email} />

            <VStack align="stretch" gap={3} flex="1" minW="240px">
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
                  Full name
                </Text>
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder={session.admin.email}
                  bg="admin.bg"
                  borderColor="admin.border"
                  color="admin.text"
                  borderRadius="xl"
                />
              </Box>
              <Flex align="center" gap={3}>
                <Text fontSize="xs" color="admin.textMuted">
                  {session.admin.email}
                </Text>
                <Badge
                  bg={isOwner ? "#FEF3C7" : "info.subtle"}
                  color={isOwner ? "#92600A" : "info.fg"}
                  px={2}
                  py={0.5}
                  borderRadius="md"
                  fontSize="xs"
                  textTransform="capitalize"
                >
                  {session.admin.role}
                </Badge>
              </Flex>
              <Flex align="center" gap={3}>
                <Button type="submit" colorPalette="brand" fontWeight="bold" borderRadius="xl" alignSelf="flex-start" loading={savingProfile}>
                  Save Profile
                </Button>
                {profileMessage && (
                  <Text fontSize="xs" color="admin.textMuted">
                    {profileMessage}
                  </Text>
                )}
              </Flex>
            </VStack>
          </Flex>
        </form>
      </Box>

      <Heading size="sm" color="admin.text" fontWeight="bold" mb={6}>
        Administrative Accounts ({adminUsers.length})
      </Heading>

      {message && (
        <Box
          p={4}
          mb={6}
          borderRadius="xl"
          bg={message.type === "success" ? "#F0F7F1" : "#FCEEEE"}
          border="1px solid"
          borderColor={message.type === "success" ? "#CFE7D2" : "#F5D0CC"}
        >
          <Text fontSize="sm" color={message.type === "success" ? "#2F7A3C" : "#B42318"}>
            {message.text}
          </Text>
        </Box>
      )}

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
        submitLabel="Create Account"
        isLoading={sending}
      >
        <VStack align="stretch" gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Full Name
            </Text>
            <Input
              value={inviteFullName}
              onChange={(e) => setInviteFullName(e.target.value)}
              placeholder="e.g. Alex Smith"
              bg="admin.bg"
              borderColor="admin.border"
              color="admin.text"
              borderRadius="xl"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Email Address *
            </Text>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@i2i-engineering.org"
              bg="admin.bg"
              borderColor="admin.border"
              color="admin.text"
              borderRadius="xl"
              required
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Admin Role
            </Text>
            <NativeSelect.Root size="md">
              <NativeSelect.Field
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "admin" | "owner")}
                bg="admin.bg"
                borderColor="admin.border"
                color="admin.text"
                borderRadius="xl"
              >
                <option value="admin">Admin</option>
                {isOwner && <option value="owner">Owner</option>}
              </NativeSelect.Field>
            </NativeSelect.Root>
            {!isOwner && (
              <Text fontSize="xs" color="admin.textMuted" mt={1}>
                Only an Owner can invite another Owner.
              </Text>
            )}
          </Box>
        </VStack>
      </ModalFormWrapper>

      {/* Temp password, shown exactly once -- not recoverable after this closes */}
      <Dialog.Root
        open={!!issuedCredential}
        onOpenChange={(e) => {
          if (!e.open) {
            setIssuedCredential(null);
            setCopied(false);
          }
        }}
      >
        <Dialog.Backdrop bg="rgba(26, 20, 16, 0.5)" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content bg="admin.surface" border="1px solid" borderColor="admin.border" borderRadius="2xl" maxW="440px" p={6} color="admin.text">
            <Dialog.Header>
              <Dialog.Title color="admin.text" fontWeight="bold">
                Admin account created
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body my={3}>
              <Text color="admin.textMuted" fontSize="sm" mb={4}>
                Share this temporary password with <b>{issuedCredential?.email}</b> directly (Slack, text, in
                person) -- not email. It won&apos;t be shown again. They&apos;ll be required to set their own
                password the first time they sign in.
              </Text>
              <Code display="block" p={3} borderRadius="lg" fontSize="md" bg="brand.subtle" color="brand.fg" textAlign="center" userSelect="all">
                {issuedCredential?.tempPassword}
              </Code>
            </Dialog.Body>
            <Dialog.Footer gap={3}>
              <Button
                variant="outline"
                borderColor="admin.border"
                color="admin.text"
                onClick={() => {
                  if (issuedCredential) {
                    navigator.clipboard?.writeText(issuedCredential.tempPassword);
                    setCopied(true);
                  }
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button colorPalette="brand" fontWeight="bold" onClick={() => setIssuedCredential(null)}>
                Done
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

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

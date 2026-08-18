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
  Switch,
  Image,
} from "@chakra-ui/react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ModalFormWrapper } from "@/components/ui/ModalFormWrapper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { PublishToggle } from "@/components/ui/PublishToggle";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember, TeamDepartment } from "@/lib/types";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<TeamDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeptFilter, setActiveDeptFilter] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);
  const [saving, setSaving] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  async function fetchTeamData() {
    setLoading(true);
    const supabase = createClient();

    try {
      const [deptRes, memberRes] = await Promise.all([
        supabase.from("team_departments").select("*").order("sort_order", { ascending: true }),
        supabase.from("team_members").select("*").order("sort_order", { ascending: true }),
      ]);

      if (deptRes.data) {
        setDepartments(deptRes.data);
      }
      if (memberRes.data) {
        setMembers(memberRes.data);
      }
    } catch (err) {
      console.warn("Failed to fetch team data", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = members.filter((m) => {
    if (activeDeptFilter === "all") return true;
    return m.department_id === activeDeptFilter;
  });

  const openCreateModal = () => {
    setEditingMember({
      name: "",
      role: "",
      department_id: departments[0]?.id ?? null,
      image_url: "",
      is_lead: false,
      sort_order: members.length + 1,
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.name) return;

    setSaving(true);
    const supabase = createClient();

    try {
      if (editingMember.id) {
        const { error } = await supabase
          .from("team_members")
          .update({
            name: editingMember.name,
            role: editingMember.role,
            department_id: editingMember.department_id,
            image_url: editingMember.image_url,
            is_lead: editingMember.is_lead ?? false,
            sort_order: editingMember.sort_order ?? 0,
            is_published: editingMember.is_published ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMember.id);

        if (!error) {
          setMembers((prev) =>
            prev.map((m) => (m.id === editingMember.id ? ({ ...m, ...editingMember } as TeamMember) : m))
          );
        }
      } else {
        const newObj = {
          name: editingMember.name,
          role: editingMember.role || "",
          department_id: editingMember.department_id || null,
          image_url: editingMember.image_url || null,
          is_lead: editingMember.is_lead ?? false,
          sort_order: editingMember.sort_order ?? 0,
          is_published: editingMember.is_published ?? true,
        };

        const { data, error } = await supabase.from("team_members").insert([newObj]).select();

        if (!error && data) {
          setMembers((prev) => [...prev, data[0] as TeamMember]);
        }
      }
      setIsModalOpen(false);
      fetchTeamData();
    } catch (err) {
      console.warn("Error saving team member", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const supabase = createClient();

    try {
      const { error } = await supabase.from("team_members").delete().eq("id", deletingId);
      if (!error) {
        setMembers((prev) => prev.filter((m) => m.id !== deletingId));
      }
    } catch (err) {
      console.warn("Delete error", err);
    } finally {
      setDeletingId(null);
      fetchTeamData();
    }
  };

  const columns: ColumnDef<TeamMember>[] = [
    {
      header: "Member",
      cell: (row) => (
        <Flex align="center" gap={3}>
          <Box w="40px" h="40px" borderRadius="full" overflow="hidden" bg="gray.800" border="2px solid rgba(99, 102, 241, 0.4)" flexShrink={0}>
            {row.image_url ? (
              <Image src={row.image_url} alt={row.name} w="100%" h="100%" objectFit="cover" />
            ) : (
              <Flex align="center" justify="center" h="100%" color="indigo.300" fontSize="sm" fontWeight="bold">
                {row.name.charAt(0)}
              </Flex>
            )}
          </Box>
          <Box>
            <Text fontWeight="semibold" color="white" fontSize="sm">
              {row.name}
            </Text>
            <Text fontSize="xs" color="gray.400">
              {row.role || "Member"}
            </Text>
          </Box>
        </Flex>
      ),
      sortable: true,
      accessorKey: "name",
    },
    {
      header: "Department",
      cell: (row) => {
        const dept = departments.find((d) => d.id === row.department_id);
        return (
          <Badge bg="rgba(99, 102, 241, 0.15)" color="#A5B4FC" border="1px solid rgba(99, 102, 241, 0.3)" px={2.5} py={0.5} borderRadius="md">
            {dept?.title || "General"}
          </Badge>
        );
      },
    },
    {
      header: "Lead",
      cell: (row) =>
        row.is_lead ? (
          <Badge bg="rgba(168, 85, 247, 0.2)" color="#C084FC" border="1px solid rgba(168, 85, 247, 0.4)" px={2.5} py={0.5} borderRadius="md">
            ★ Dept Lead
          </Badge>
        ) : (
          <Text fontSize="xs" color="gray.600">—</Text>
        ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          bg={row.is_published ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)"}
          color={row.is_published ? "#6EE7B7" : "#FDE68A"}
          px={2.5}
          py={0.5}
          borderRadius="md"
        >
          {row.is_published ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <Flex gap={2}>
          <Button size="xs" variant="outline" borderColor="rgba(255, 255, 255, 0.15)" color="gray.200" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button
            size="xs"
            colorPalette="red"
            variant="ghost"
            onClick={() => {
              setDeletingId(row.id);
              setIsDeleteOpen(true);
            }}
          >
            Delete
          </Button>
        </Flex>
      ),
    },
  ];

  return (
    <Box maxW="1300px" mx="auto">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
        <Box>
          <Heading size="xl" color="white" fontWeight="extrabold" mb={1}>
            Teams & Members <Text as="span" className="gradient-text">Management</Text>
          </Heading>
          <Text color="gray.400" fontSize="sm">
            Organize team members, assign department leads, and manage profile photos.
          </Text>
        </Box>
      </Flex>

      {/* Filter Tabs */}
      <Flex gap={2} mb={6} wrap="wrap">
        <Button
          size="sm"
          borderRadius="xl"
          bg={activeDeptFilter === "all" ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "rgba(15, 23, 42, 0.6)"}
          border="1px solid"
          borderColor={activeDeptFilter === "all" ? "transparent" : "rgba(255, 255, 255, 0.1)"}
          color="white"
          onClick={() => setActiveDeptFilter("all")}
        >
          All Members ({members.length})
        </Button>
        {departments.map((dept) => {
          const count = members.filter((m) => m.department_id === dept.id).length;
          const isActive = activeDeptFilter === dept.id;
          return (
            <Button
              key={dept.id}
              size="sm"
              borderRadius="xl"
              bg={isActive ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "rgba(15, 23, 42, 0.6)"}
              border="1px solid"
              borderColor={isActive ? "transparent" : "rgba(255, 255, 255, 0.1)"}
              color="white"
              onClick={() => setActiveDeptFilter(dept.id)}
            >
              {dept.title} ({count})
            </Button>
          );
        })}
      </Flex>

      {/* Main Table */}
      <DataTable
        data={filteredMembers}
        columns={columns}
        searchPlaceholder="Search members by name, role, department..."
        isLoading={loading}
        onAddClick={openCreateModal}
        addButtonLabel="Add Team Member"
      />

      {/* Create / Edit Modal */}
      <ModalFormWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember?.id ? "Edit Team Member" : "Add New Team Member"}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <VStack align="stretch" gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={1}>
              Full Name *
            </Text>
            <Input
              value={editingMember?.name || ""}
              onChange={(e) => setEditingMember((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Jane Doe"
              bg="rgba(15, 23, 42, 0.6)"
              border="1px solid rgba(255, 255, 255, 0.12)"
              color="white"
              borderRadius="xl"
              required
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={1}>
              Role / Title
            </Text>
            <Input
              value={editingMember?.role || ""}
              onChange={(e) => setEditingMember((prev) => ({ ...prev, role: e.target.value }))}
              placeholder="e.g. Senior Software Engineer"
              bg="rgba(15, 23, 42, 0.6)"
              border="1px solid rgba(255, 255, 255, 0.12)"
              color="white"
              borderRadius="xl"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={1}>
              Department
            </Text>
            <NativeSelect.Root size="md">
              <NativeSelect.Field
                value={editingMember?.department_id || ""}
                onChange={(e) => setEditingMember((prev) => ({ ...prev, department_id: e.target.value }))}
                bg="#0F172A"
                borderColor="rgba(255, 255, 255, 0.12)"
                color="white"
                borderRadius="xl"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id} style={{ background: "#0F172A", color: "white" }}>
                    {d.title}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>

          <ImageUploader
            value={editingMember?.image_url}
            onChange={(url) => setEditingMember((prev) => ({ ...prev, image_url: url }))}
            bucketName="team-photos"
            label="Profile Photo"
          />

          <Flex align="center" justify="space-between" p={4} border="1px solid rgba(255, 255, 255, 0.12)" borderRadius="xl" bg="rgba(15, 23, 42, 0.6)">
            <Text fontSize="sm" fontWeight="semibold" color="gray.300">
              Department Lead Flag
            </Text>
            <Switch.Root
              checked={editingMember?.is_lead ?? false}
              onCheckedChange={(e) => setEditingMember((prev) => ({ ...prev, is_lead: e.checked }))}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </Flex>

          <PublishToggle
            isChecked={editingMember?.is_published ?? true}
            onChange={(val) => setEditingMember((prev) => ({ ...prev, is_published: val }))}
          />
        </VStack>
      </ModalFormWrapper>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Team Member"
        description="Are you sure you want to delete this team member? Their photo and details will be removed."
      />
    </Box>
  );
}

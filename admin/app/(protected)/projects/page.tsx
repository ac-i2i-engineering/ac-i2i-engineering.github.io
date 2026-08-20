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
  Textarea,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { ExternalLink } from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ModalFormWrapper } from "@/components/ui/ModalFormWrapper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TagInput } from "@/components/ui/TagInput";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { PublishToggle } from "@/components/ui/PublishToggle";
import { createClient } from "@/lib/supabase/client";
import type { Startup } from "@/lib/types";

export default function ProjectsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStartup, setEditingStartup] = useState<Partial<Startup> | null>(null);
  const [saving, setSaving] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStartups();
  }, []);

  async function fetchStartups() {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("startups")
        .select("*")
        .order("sort_order", { ascending: true });

      if (data) {
        setStartups(data);
      } else if (error) {
        console.warn("Supabase fetch error", error);
      }
    } catch (err) {
      console.warn("Error fetching startups", err);
    } finally {
      setLoading(false);
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  const openCreateModal = () => {
    setEditingStartup({
      title: "",
      slug: "",
      description: "",
      image_url: "",
      github_url: "",
      github_text: "GitHub",
      demo_url: "",
      demo_text: "Live Demo",
      tags: ["Innovation", "Engineering"],
      sort_order: startups.length + 1,
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (startup: Startup) => {
    setEditingStartup(startup);
    setIsModalOpen(true);
  };

  const handleTitleChange = (newTitle: string) => {
    setEditingStartup((prev) => ({
      ...prev,
      title: newTitle,
      slug: prev?.id ? prev.slug : generateSlug(newTitle),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStartup || !editingStartup.title) return;

    setSaving(true);
    const supabase = createClient();
    const slug = editingStartup.slug || generateSlug(editingStartup.title);

    try {
      if (editingStartup.id && !editingStartup.id.startsWith("s")) {
        const { error } = await supabase
          .from("startups")
          .update({
            title: editingStartup.title,
            slug,
            description: editingStartup.description,
            image_url: editingStartup.image_url,
            github_url: editingStartup.github_url,
            github_text: editingStartup.github_text,
            demo_url: editingStartup.demo_url,
            demo_text: editingStartup.demo_text,
            tags: editingStartup.tags || [],
            sort_order: editingStartup.sort_order ?? 0,
            is_published: editingStartup.is_published ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingStartup.id);

        if (!error) {
          setStartups((prev) =>
            prev.map((s) => (s.id === editingStartup.id ? ({ ...s, ...editingStartup, slug } as Startup) : s))
          );
        }
      } else {
        const newObj = {
          title: editingStartup.title,
          slug,
          description: editingStartup.description || "",
          image_url: editingStartup.image_url || null,
          github_url: editingStartup.github_url || "",
          github_text: editingStartup.github_text || "GitHub",
          demo_url: editingStartup.demo_url || "",
          demo_text: editingStartup.demo_text || "Live Demo",
          tags: editingStartup.tags || [],
          sort_order: editingStartup.sort_order ?? 0,
          is_published: editingStartup.is_published ?? true,
        };

        const { data, error } = await supabase.from("startups").insert([newObj]).select();

        if (!error && data) {
          setStartups((prev) => [...prev, data[0] as Startup]);
        }
      }
      setIsModalOpen(false);
      fetchStartups();
    } catch (err) {
      console.warn("Error saving startup", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const supabase = createClient();

    // Immediately purge from local state
    setStartups((prev) => prev.filter((s) => s.id !== deletingId));

    try {
      if (!deletingId.startsWith("s")) {
        await supabase.from("startups").delete().eq("id", deletingId);
      }
    } catch (err) {
      console.warn("Delete startup error", err);
    } finally {
      setDeletingId(null);
    }
  };

  const columns: ColumnDef<Startup>[] = [
    {
      header: "Project Title",
      cell: (row) => (
        <Box>
          <Text fontWeight="semibold" color="admin.text" fontSize="sm">
            {row.title}
          </Text>
          <Text fontSize="xs" color="admin.textMuted">
            /{row.slug}
          </Text>
        </Box>
      ),
      sortable: true,
      accessorKey: "title",
    },
    {
      header: "Tags",
      cell: (row) => (
        <Flex wrap="wrap" gap={1.5}>
          {(row.tags || []).map((tag, idx) => (
            <Badge key={idx} bg="info.subtle" color="info.fg" px={2} py={0.5} borderRadius="md" fontSize="xs">
              {tag}
            </Badge>
          ))}
        </Flex>
      ),
    },
    {
      header: "Links",
      cell: (row) => (
        <HStack gap={2}>
          {row.github_url && (
            <a href={row.github_url} target="_blank" rel="noreferrer">
              <Button size="xs" variant="outline" borderColor="admin.border" color="admin.text">
                GitHub <ExternalLink size={11} />
              </Button>
            </a>
          )}
          {row.demo_url && (
            <a href={row.demo_url} target="_blank" rel="noreferrer">
              <Button size="xs" bg="info.subtle" color="info.fg">
                Demo <ExternalLink size={11} />
              </Button>
            </a>
          )}
        </HStack>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge bg={row.is_published ? "#F0F7F1" : "#FDF6E9"} color={row.is_published ? "#2F7A3C" : "#92600A"} px={2.5} py={0.5} borderRadius="md">
          {row.is_published ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (row) => (
        <Flex gap={2}>
          <Button size="xs" variant="outline" borderColor="admin.border" color="admin.text" onClick={() => openEditModal(row)}>
            Edit
          </Button>
          <Button
            size="xs"
            colorPalette="danger"
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
          <Heading size="xl" color="admin.text" fontWeight="extrabold" mb={1}>
            Projects & Startups
          </Heading>
          <Text color="admin.textMuted" fontSize="sm">
            Manage incubated student projects, GitHub repositories, demo links, and tag chips.
          </Text>
        </Box>
      </Flex>

      {/* Main Table */}
      <DataTable
        data={startups}
        columns={columns}
        searchPlaceholder="Search projects by title, tags, description..."
        isLoading={loading}
        onAddClick={openCreateModal}
        addButtonLabel="Add Project"
      />

      {/* Create / Edit Modal */}
      <ModalFormWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStartup?.id ? "Edit Project / Startup" : "Add New Project"}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <VStack align="stretch" gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Project Title *
            </Text>
            <Input
              value={editingStartup?.title || ""}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. EcoGrid Energy"
              bg="admin.bg"
              border="1px solid"
              borderColor="admin.border"
              color="admin.text"
              borderRadius="xl"
              required
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              URL Slug
            </Text>
            <Input
              value={editingStartup?.slug || ""}
              onChange={(e) => setEditingStartup((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="auto-generated-slug"
              bg="admin.bg"
              border="1px solid"
              borderColor="admin.border"
              color="admin.text"
              borderRadius="xl"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Description
            </Text>
            <Textarea
              value={editingStartup?.description || ""}
              onChange={(e) => setEditingStartup((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the project mission, tech stack, and key metrics..."
              bg="admin.bg"
              border="1px solid"
              borderColor="admin.border"
              color="admin.text"
              borderRadius="xl"
              rows={3}
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Category Tags (Chips)
            </Text>
            <TagInput
              tags={editingStartup?.tags || []}
              onChange={(newTags) => setEditingStartup((prev) => ({ ...prev, tags: newTags }))}
            />
          </Box>

          <HStack gap={4}>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
                GitHub Repository URL
              </Text>
              <Input
                value={editingStartup?.github_url || ""}
                onChange={(e) => setEditingStartup((prev) => ({ ...prev, github_url: e.target.value }))}
                placeholder="https://github.com/..."
                bg="admin.bg"
                border="1px solid"
                borderColor="admin.border"
                color="admin.text"
                borderRadius="xl"
              />
            </Box>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
                Demo / Website URL
              </Text>
              <Input
                value={editingStartup?.demo_url || ""}
                onChange={(e) => setEditingStartup((prev) => ({ ...prev, demo_url: e.target.value }))}
                placeholder="https://myproject.com"
                bg="admin.bg"
                border="1px solid"
                borderColor="admin.border"
                color="admin.text"
                borderRadius="xl"
              />
            </Box>
          </HStack>

          <ImageUploader
            value={editingStartup?.image_url}
            onChange={(url) => setEditingStartup((prev) => ({ ...prev, image_url: url }))}
            bucketName="startup-images"
            label="Project Logo / Banner"
          />

          <PublishToggle
            isChecked={editingStartup?.is_published ?? true}
            onChange={(val) => setEditingStartup((prev) => ({ ...prev, is_published: val }))}
          />
        </VStack>
      </ModalFormWrapper>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? It will be removed from the website."
      />
    </Box>
  );
}

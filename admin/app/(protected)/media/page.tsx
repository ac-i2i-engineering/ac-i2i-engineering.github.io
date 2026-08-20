"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  Badge,
  Image,
  Input,
  NativeSelect,
  VStack,
} from "@chakra-ui/react";
import { Upload, Link2, Pencil } from "lucide-react";
import { ModalFormWrapper } from "@/components/ui/ModalFormWrapper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { PublishToggle } from "@/components/ui/PublishToggle";
import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKETS, Media, MediaAttachedToType } from "@/lib/types";

export default function MediaPage() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Partial<Media> | null>(null);
  const [saving, setSaving] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia() {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setMediaList(data);
      } else if (error) {
        console.warn("Supabase fetch error", error);
      }
    } catch (err) {
      console.warn("Error fetching media", err);
    } finally {
      setLoading(false);
    }
  }

  const openUploadModal = () => {
    setEditingMedia({
      url: "",
      alt_text: "",
      caption: "",
      attached_to_type: null,
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Media) => {
    setEditingMedia(item);
    setIsModalOpen(true);
  };

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia?.url) return;

    setSaving(true);
    const supabase = createClient();

    try {
      if (editingMedia.id) {
        const { error } = await supabase
          .from("media")
          .update({
            alt_text: editingMedia.alt_text || "Media Image",
            caption: editingMedia.caption || null,
            attached_to_type: (editingMedia.attached_to_type as MediaAttachedToType) || null,
            is_published: editingMedia.is_published ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingMedia.id);

        if (!error) {
          setMediaList((prev) =>
            prev.map((m) => (m.id === editingMedia.id ? ({ ...m, ...editingMedia } as Media) : m))
          );
        }
      } else {
        const newMedia = {
          storage_path: editingMedia.url,
          url: editingMedia.url,
          alt_text: editingMedia.alt_text || "Media Image",
          caption: editingMedia.caption || null,
          attached_to_type: (editingMedia.attached_to_type as MediaAttachedToType) || null,
          attached_to_id: null,
          sort_order: mediaList.length + 1,
          is_published: editingMedia.is_published ?? true,
        };

        const { data, error } = await supabase.from("media").insert([newMedia]).select();

        if (!error && data) {
          setMediaList((prev) => [data[0] as Media, ...prev]);
        }
      }

      setIsModalOpen(false);
      setEditingMedia(null);
      fetchMedia();
    } catch (err) {
      console.warn("Error saving media", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const supabase = createClient();

    // Purge immediately from local state
    setMediaList((prev) => prev.filter((m) => m.id !== deletingId));

    try {
      if (!deletingId.startsWith("m")) {
        await supabase.from("media").delete().eq("id", deletingId);
      }
    } catch (err) {
      console.warn("Delete media error", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Box maxW="1300px" mx="auto">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
        <Box>
          <Heading size="xl" color="admin.text" fontWeight="extrabold" mb={1}>
            Media Manager
          </Heading>
          <Text color="admin.textMuted" fontSize="sm">
            Browse uploaded images across storage buckets, upload new files, and link them to records.
          </Text>
        </Box>

        <Button colorPalette="brand" fontWeight="bold" px={5} borderRadius="xl" onClick={openUploadModal}>
          <Upload size={16} />
          Upload Media
        </Button>
      </Flex>

      {/* Bucket Filter Bar */}
      <Flex gap={2} mb={6} wrap="wrap">
        <Button
          size="sm"
          borderRadius="xl"
          bg={activeBucket === "all" ? "brand.solid" : "admin.surface"}
          border="1px solid"
          borderColor={activeBucket === "all" ? "transparent" : "admin.border"}
          color={activeBucket === "all" ? "white" : "admin.text"}
          onClick={() => setActiveBucket("all")}
        >
          All Media ({mediaList.length})
        </Button>
        {Object.entries(STORAGE_BUCKETS).map(([key, bucket]) => (
          <Button
            key={key}
            size="sm"
            borderRadius="xl"
            bg={activeBucket === bucket ? "brand.solid" : "admin.surface"}
            border="1px solid"
            borderColor={activeBucket === bucket ? "transparent" : "admin.border"}
            color={activeBucket === bucket ? "white" : "admin.text"}
            onClick={() => setActiveBucket(bucket)}
          >
            {bucket}
          </Button>
        ))}
      </Flex>

      {/* Media Grid */}
      {loading ? (
        <Text color="admin.textMuted">Loading media items...</Text>
      ) : mediaList.length === 0 ? (
        <Box className="admin-panel" p={12} textAlign="center" borderRadius="2xl">
          <Text color="admin.textMuted" mb={4}>No media items uploaded yet.</Text>
          <Button colorPalette="brand" size="sm" borderRadius="xl" onClick={openUploadModal}>
            Upload Your First Image
          </Button>
        </Box>
      ) : (
        <Box className="media-masonry">
          {mediaList.map((item) => (
            <Box key={item.id} className="admin-card media-masonry-item" borderRadius="2xl" overflow="hidden">
              <Box bg="admin.bg" overflow="hidden">
                <Image src={item.url} alt={item.alt_text || "Media"} w="100%" h="auto" display="block" />
              </Box>

              <Box p={4}>
                <Text fontSize="xs" fontWeight="bold" color="admin.text" truncate mb={1}>
                  {item.alt_text || "Untitled Media"}
                </Text>
                {item.caption && (
                  <Text fontSize="xs" color="admin.textMuted" lineClamp={2} mb={3}>
                    {item.caption}
                  </Text>
                )}

                <Flex align="center" gap={1.5} wrap="wrap" mb={3}>
                  {item.attached_to_type ? (
                    <Badge
                      bg="#FBE9C9"
                      color="#7A4D08"
                      fontWeight="semibold"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      fontSize="xs"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      w="fit-content"
                    >
                      <Link2 size={10} /> {item.attached_to_type}
                    </Badge>
                  ) : (
                    <Badge bg="admin.bg" color="admin.text" fontWeight="semibold" border="1px solid" borderColor="admin.border" px={2} py={0.5} borderRadius="md" fontSize="xs">
                      Unattached
                    </Badge>
                  )}
                  <Badge
                    bg={item.is_published ? "#E3F3E5" : "#FBE9C9"}
                    color={item.is_published ? "#256633" : "#7A4D08"}
                    fontWeight="semibold"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    fontSize="xs"
                  >
                    {item.is_published ? "Visible" : "Hidden"}
                  </Badge>
                </Flex>

                <Flex justify="space-between" align="center" pt={3} borderTop="1px solid" borderColor="admin.border">
                  <Button size="xs" variant="outline" borderColor="admin.border" color="admin.text" onClick={() => openEditModal(item)}>
                    <Pencil size={12} /> Edit
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="danger"
                    variant="ghost"
                    onClick={() => {
                      setDeletingId(item.id);
                      setIsDeleteOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </Flex>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Upload / Edit Modal */}
      <ModalFormWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMedia?.id ? "Edit Media" : "Upload New Media"}
        onSubmit={handleSaveMedia}
        submitLabel={editingMedia?.id ? "Save Changes" : "Save Media Item"}
        isLoading={saving}
      >
        <VStack align="stretch" gap={4}>
          <ImageUploader
            value={editingMedia?.url}
            onChange={(url) => setEditingMedia((prev) => ({ ...prev, url }))}
            bucketName="media-gallery"
            label="Media File"
          />

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Alt Text
            </Text>
            <Input
              value={editingMedia?.alt_text || ""}
              onChange={(e) => setEditingMedia((prev) => ({ ...prev, alt_text: e.target.value }))}
              placeholder="Descriptive text for accessibility"
              bg="admin.bg"
              border="1px solid"
              borderColor="admin.border"
              color="admin.text"
              borderRadius="xl"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Caption
            </Text>
            <Input
              value={editingMedia?.caption || ""}
              onChange={(e) => setEditingMedia((prev) => ({ ...prev, caption: e.target.value }))}
              placeholder="Optional photo caption"
              bg="admin.bg"
              border="1px solid"
              borderColor="admin.border"
              color="admin.text"
              borderRadius="xl"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Attach to Record Type
            </Text>
            <NativeSelect.Root size="md">
              <NativeSelect.Field
                value={editingMedia?.attached_to_type || ""}
                onChange={(e) => setEditingMedia((prev) => ({ ...prev, attached_to_type: e.target.value as MediaAttachedToType }))}
                bg="admin.bg"
                borderColor="admin.border"
                color="admin.text"
                borderRadius="xl"
              >
                <option value="">None (Standalone Media)</option>
                <option value="team_member">Team Member</option>
                <option value="event">Event</option>
                <option value="startup">Startup Project</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>

          <PublishToggle
            isChecked={editingMedia?.is_published ?? true}
            onChange={(val) => setEditingMedia((prev) => ({ ...prev, is_published: val }))}
            label="Visible in public Media Gallery"
          />
        </VStack>
      </ModalFormWrapper>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Media File"
        description="Are you sure you want to delete this media file? It will be removed permanently."
      />
    </Box>
  );
}

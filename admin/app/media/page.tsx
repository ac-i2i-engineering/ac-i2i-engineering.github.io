"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Button,
  Badge,
  SimpleGrid,
  Image,
  Input,
  NativeSelect,
  VStack,
} from "@chakra-ui/react";
import { ModalFormWrapper } from "@/components/ui/ModalFormWrapper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKETS, Media, MediaAttachedToType } from "@/lib/types";

export default function MediaPage() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState<string>("all");

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [altText, setAltText] = useState("");
  const [attachedType, setAttachedType] = useState<MediaAttachedToType | "">("");
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

  const handleSaveMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedUrl) return;

    setSaving(true);
    const supabase = createClient();

    try {
      const newMedia = {
        storage_path: uploadedUrl,
        url: uploadedUrl,
        alt_text: altText || "Media Image",
        caption: caption || null,
        attached_to_type: (attachedType as MediaAttachedToType) || null,
        attached_to_id: null,
        sort_order: mediaList.length + 1,
      };

      const { data, error } = await supabase.from("media").insert([newMedia]).select();

      if (!error && data) {
        setMediaList((prev) => [data[0] as Media, ...prev]);
      }

      setIsUploadOpen(false);
      setUploadedUrl("");
      setCaption("");
      setAltText("");
      setAttachedType("");
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
          <Heading size="xl" color="white" fontWeight="extrabold" mb={1}>
            Media <Text as="span" className="gradient-text-cyan">Manager</Text>
          </Heading>
          <Text color="gray.400" fontSize="sm">
            Browse uploaded images across storage buckets, upload new files, and link them to records.
          </Text>
        </Box>

        <Button
          background="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
          color="white"
          fontWeight="bold"
          px={5}
          borderRadius="xl"
          onClick={() => setIsUploadOpen(true)}
        >
          + Upload Media
        </Button>
      </Flex>

      {/* Bucket Filter Bar */}
      <Flex gap={2} mb={6} wrap="wrap">
        <Button
          size="sm"
          borderRadius="xl"
          bg={activeBucket === "all" ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "rgba(15, 23, 42, 0.6)"}
          border="1px solid"
          borderColor={activeBucket === "all" ? "transparent" : "rgba(255, 255, 255, 0.1)"}
          color="white"
          onClick={() => setActiveBucket("all")}
        >
          All Media ({mediaList.length})
        </Button>
        {Object.entries(STORAGE_BUCKETS).map(([key, bucket]) => (
          <Button
            key={key}
            size="sm"
            borderRadius="xl"
            bg={activeBucket === bucket ? "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" : "rgba(15, 23, 42, 0.6)"}
            border="1px solid"
            borderColor={activeBucket === bucket ? "transparent" : "rgba(255, 255, 255, 0.1)"}
            color="white"
            onClick={() => setActiveBucket(bucket)}
          >
            {bucket}
          </Button>
        ))}
      </Flex>

      {/* Media Grid */}
      {loading ? (
        <Text color="gray.400">Loading media items...</Text>
      ) : mediaList.length === 0 ? (
        <Box className="glass-panel" p={12} textAlign="center" borderRadius="2xl">
          <Text color="gray.400" mb={4}>No media items uploaded yet.</Text>
          <Button
            background="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
            color="white"
            size="sm"
            borderRadius="xl"
            onClick={() => setIsUploadOpen(true)}
          >
            Upload Your First Image
          </Button>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
          {mediaList.map((item) => (
            <Box key={item.id} className="glass-card" borderRadius="2xl" overflow="hidden">
              <Box h="180px" bg="gray.900" overflow="hidden" position="relative">
                <Image src={item.url} alt={item.alt_text || "Media"} w="100%" h="100%" objectFit="cover" />
              </Box>

              <Box p={4}>
                <Text fontSize="xs" fontWeight="bold" color="white" truncate mb={1}>
                  {item.alt_text || "Untitled Media"}
                </Text>
                {item.caption && (
                  <Text fontSize="xs" color="gray.400" lineClamp={2} mb={3}>
                    {item.caption}
                  </Text>
                )}

                <Flex justify="space-between" align="center" pt={3} borderTop="1px solid rgba(255, 255, 255, 0.08)">
                  {item.attached_to_type ? (
                    <Badge bg="rgba(168, 85, 247, 0.2)" color="#C084FC" px={2} py={0.5} borderRadius="md" fontSize="xs">
                      Attached: {item.attached_to_type}
                    </Badge>
                  ) : (
                    <Badge bg="rgba(255, 255, 255, 0.08)" color="gray.400" px={2} py={0.5} borderRadius="md" fontSize="xs">
                      Unattached
                    </Badge>
                  )}

                  <Button
                    size="xs"
                    colorPalette="red"
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
        </SimpleGrid>
      )}

      {/* Upload Modal */}
      <ModalFormWrapper
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload New Media"
        onSubmit={handleSaveMedia}
        submitLabel="Save Media Item"
        isLoading={saving}
      >
        <VStack align="stretch" gap={4}>
          <ImageUploader
            value={uploadedUrl}
            onChange={(url) => setUploadedUrl(url)}
            bucketName="media-gallery"
            label="Media File"
          />

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={1}>
              Alt Text
            </Text>
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Descriptive text for accessibility"
              bg="rgba(15, 23, 42, 0.6)"
              border="1px solid rgba(255, 255, 255, 0.12)"
              color="white"
              borderRadius="xl"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={1}>
              Caption
            </Text>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional photo caption"
              bg="rgba(15, 23, 42, 0.6)"
              border="1px solid rgba(255, 255, 255, 0.12)"
              color="white"
              borderRadius="xl"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={1}>
              Attach to Record Type
            </Text>
            <NativeSelect.Root size="md">
              <NativeSelect.Field
                value={attachedType}
                onChange={(e) => setAttachedType(e.target.value as MediaAttachedToType)}
                bg="#0F172A"
                borderColor="rgba(255, 255, 255, 0.12)"
                color="white"
                borderRadius="xl"
              >
                <option value="" style={{ background: "#0F172A", color: "white" }}>None (Standalone Media)</option>
                <option value="team_member" style={{ background: "#0F172A", color: "white" }}>Team Member</option>
                <option value="event" style={{ background: "#0F172A", color: "white" }}>Event</option>
                <option value="startup" style={{ background: "#0F172A", color: "white" }}>Startup Project</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>
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

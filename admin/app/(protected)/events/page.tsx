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
  SimpleGrid,
} from "@chakra-ui/react";
import { CalendarDays, MapPin, List, LayoutGrid, Plus } from "lucide-react";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { ModalFormWrapper } from "@/components/ui/ModalFormWrapper";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { PublishToggle } from "@/components/ui/PublishToggle";
import { createClient } from "@/lib/supabase/client";
import type { Event } from "@/lib/types";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
  const [saving, setSaving] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });

      if (data) {
        setEvents(data);
      } else if (error) {
        console.warn("Supabase fetch error, using fallback", error);
      }
    } catch (err) {
      console.warn("Error fetching events", err);
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setEditingEvent({
      title: "",
      description: "",
      event_date: today,
      start_time: "09:00",
      end_time: "17:00",
      location: "",
      image_url: "",
      registration_url: "",
      is_published: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editingEvent.title) return;

    setSaving(true);
    const supabase = createClient();

    try {
      if (editingEvent.id) {
        const { error } = await supabase
          .from("events")
          .update({
            title: editingEvent.title,
            description: editingEvent.description,
            event_date: editingEvent.event_date,
            start_time: editingEvent.start_time,
            end_time: editingEvent.end_time,
            location: editingEvent.location,
            image_url: editingEvent.image_url,
            registration_url: editingEvent.registration_url,
            is_published: editingEvent.is_published ?? true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingEvent.id);

        if (!error) {
          setEvents((prev) =>
            prev.map((ev) => (ev.id === editingEvent.id ? ({ ...ev, ...editingEvent } as Event) : ev))
          );
        }
      } else {
        const newObj = {
          title: editingEvent.title,
          description: editingEvent.description || "",
          event_date: editingEvent.event_date,
          start_time: editingEvent.start_time || null,
          end_time: editingEvent.end_time || null,
          location: editingEvent.location || "",
          image_url: editingEvent.image_url || null,
          registration_url: editingEvent.registration_url || "",
          is_published: editingEvent.is_published ?? true,
        };

        const { data, error } = await supabase.from("events").insert([newObj]).select();

        if (!error && data && data.length > 0) {
          setEvents((prev) => [data[0] as Event, ...prev]);
        }
      }
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      console.warn("Error saving event", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const supabase = createClient();

    try {
      const { error } = await supabase.from("events").delete().eq("id", deletingId);
      if (!error) {
        setEvents((prev) => prev.filter((ev) => ev.id !== deletingId));
      } else {
        console.warn("Supabase delete error", error);
      }
    } catch (err) {
      console.warn("Delete event exception", err);
    } finally {
      setDeletingId(null);
      fetchEvents();
    }
  };

  const columns: ColumnDef<Event>[] = [
    {
      header: "Event Title",
      cell: (row) => (
        <Box>
          <Text fontWeight="semibold" color="admin.text" fontSize="sm">
            {row.title}
          </Text>
          {row.description && (
            <Text fontSize="xs" color="admin.textMuted" maxW="300px" truncate>
              {row.description}
            </Text>
          )}
        </Box>
      ),
      sortable: true,
      accessorKey: "title",
    },
    {
      header: "Date & Time",
      cell: (row) => (
        <Box>
          <Flex align="center" gap={1.5} fontWeight="semibold" fontSize="xs" color="#2F7A3C">
            <CalendarDays size={12} /> {row.event_date}
          </Flex>
          {row.start_time && (
            <Text fontSize="xs" color="admin.textMuted">
              {row.start_time.substring(0, 5)} {row.end_time ? `- ${row.end_time.substring(0, 5)}` : ""}
            </Text>
          )}
        </Box>
      ),
      sortable: true,
      accessorKey: "event_date",
    },
    {
      header: "Location",
      cell: (row) => (
        <Flex align="center" gap={1.5} fontSize="xs" color="admin.text">
          <MapPin size={12} /> {row.location || "Online"}
        </Flex>
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
            Events & Hackathons
          </Heading>
          <Text color="admin.textMuted" fontSize="sm">
            Schedule workshops, guest lectures, set registration URLs, and switch calendar views.
          </Text>
        </Box>

        <HStack gap={3}>
          <Button
            size="sm"
            borderRadius="xl"
            bg={viewMode === "table" ? "brand.solid" : "admin.surface"}
            border="1px solid"
            borderColor={viewMode === "table" ? "transparent" : "admin.border"}
            color={viewMode === "table" ? "white" : "admin.text"}
            onClick={() => setViewMode("table")}
          >
            <List size={15} /> Table View
          </Button>
          <Button
            size="sm"
            borderRadius="xl"
            bg={viewMode === "calendar" ? "brand.solid" : "admin.surface"}
            border="1px solid"
            borderColor={viewMode === "calendar" ? "transparent" : "admin.border"}
            color={viewMode === "calendar" ? "white" : "admin.text"}
            onClick={() => setViewMode("calendar")}
          >
            <LayoutGrid size={15} /> Grid View
          </Button>
        </HStack>
      </Flex>

      {/* View Switcher */}
      {viewMode === "table" ? (
        <DataTable
          data={events}
          columns={columns}
          searchPlaceholder="Search events by title, description, location..."
          isLoading={loading}
          onAddClick={openCreateModal}
          addButtonLabel="Create Event"
        />
      ) : (
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontWeight="semibold" color="admin.text">
              Event Cards Gallery
            </Text>
            <Button colorPalette="brand" size="sm" borderRadius="xl" onClick={openCreateModal}>
              <Plus size={15} /> Create Event
            </Button>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {events.map((ev) => (
              <Box key={ev.id} className="admin-card" p={6} borderRadius="2xl">
                <Flex justify="space-between" align="flex-start" mb={3}>
                  <Badge bg={ev.is_published ? "#F0F7F1" : "#FDF6E9"} color={ev.is_published ? "#2F7A3C" : "#92600A"} px={2.5} py={0.5} borderRadius="md" fontSize="xs">
                    {ev.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Flex align="center" gap={1} fontSize="xs" fontWeight="bold" color="#2F7A3C">
                    <CalendarDays size={12} /> {ev.event_date}
                  </Flex>
                </Flex>

                <Heading size="sm" color="admin.text" mb={2}>
                  {ev.title}
                </Heading>

                <Text fontSize="xs" color="admin.textMuted" mb={4} lineClamp={2}>
                  {ev.description || "No description provided."}
                </Text>

                <Flex align="center" gap={1} fontSize="xs" color="admin.text" mb={4}>
                  <MapPin size={12} /> {ev.location || "Location TBD"}
                </Flex>

                <Flex justify="flex-end" gap={2} pt={4} borderTop="1px solid" borderColor="admin.border">
                  <Button size="xs" variant="outline" borderColor="admin.border" color="admin.text" onClick={() => openEditModal(ev)}>
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="danger"
                    variant="ghost"
                    onClick={() => {
                      setDeletingId(ev.id);
                      setIsDeleteOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </Flex>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* Create / Edit Modal */}
      <ModalFormWrapper
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent?.id ? "Edit Event" : "Create New Event"}
        onSubmit={handleSave}
        isLoading={saving}
      >
        <VStack align="stretch" gap={4}>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Event Title *
            </Text>
            <Input
              value={editingEvent?.title || ""}
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. AI Innovation Summit"
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
              Description
            </Text>
            <Textarea
              value={editingEvent?.description || ""}
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe event agenda, speakers, and instructions..."
              bg="admin.bg"
              border="1px solid"
              borderColor="admin.border"
              color="admin.text"
              borderRadius="xl"
              rows={3}
            />
          </Box>

          <HStack gap={4}>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
                Event Date *
              </Text>
              <Input
                type="date"
                value={editingEvent?.event_date || ""}
                onChange={(e) => setEditingEvent((prev) => ({ ...prev, event_date: e.target.value }))}
                bg="admin.bg"
                border="1px solid"
                borderColor="admin.border"
                color="admin.text"
                borderRadius="xl"
                required
              />
            </Box>

            <Box flex="1">
              <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
                Start Time
              </Text>
              <Input
                type="time"
                value={editingEvent?.start_time || ""}
                onChange={(e) => setEditingEvent((prev) => ({ ...prev, start_time: e.target.value }))}
                bg="admin.bg"
                border="1px solid"
                borderColor="admin.border"
                color="admin.text"
                borderRadius="xl"
              />
            </Box>
          </HStack>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Location / Venue
            </Text>
            <Input
              value={editingEvent?.location || ""}
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Room 302 or Online Zoom Link"
              bg="admin.bg"
              border="1px solid"
              borderColor="admin.border"
              color="admin.text"
              borderRadius="xl"
            />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={1}>
              Registration Link
            </Text>
            <Input
              value={editingEvent?.registration_url || ""}
              onChange={(e) => setEditingEvent((prev) => ({ ...prev, registration_url: e.target.value }))}
              placeholder="https://eventbrite.com/..."
              bg="admin.bg"
              border="1px solid"
              borderColor="admin.border"
              color="admin.text"
              borderRadius="xl"
            />
          </Box>

          <ImageUploader
            value={editingEvent?.image_url}
            onChange={(url) => setEditingEvent((prev) => ({ ...prev, image_url: url }))}
            bucketName="event-images"
            label="Banner / Cover Image"
          />

          <PublishToggle
            isChecked={editingEvent?.is_published ?? true}
            onChange={(val) => setEditingEvent((prev) => ({ ...prev, is_published: val }))}
          />
        </VStack>
      </ModalFormWrapper>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        description="Are you sure you want to delete this event? It will no longer appear on the website."
      />
    </Box>
  );
}

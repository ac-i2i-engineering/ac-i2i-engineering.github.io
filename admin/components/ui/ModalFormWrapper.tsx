"use client";

import { Dialog, Button, Flex } from "@chakra-ui/react";

interface ModalFormWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export function ModalFormWrapper({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Save Changes",
  isLoading = false,
}: ModalFormWrapperProps) {
  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop bg="rgba(26, 20, 16, 0.5)" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="admin.surface"
          border="1px solid"
          borderColor="admin.border"
          borderRadius="2xl"
          maxW="560px"
          w="92vw"
          p={6}
          as="form"
          onSubmit={onSubmit}
          boxShadow="0 25px 50px -12px rgba(26, 20, 16, 0.25)"
          color="admin.text"
        >
          <Dialog.Header pb={4} borderBottom="1px solid" borderColor="admin.border">
            <Dialog.Title color="admin.text" fontWeight="bold" fontSize="lg">
              {title}
            </Dialog.Title>
            <Dialog.CloseTrigger onClick={onClose} color="admin.textMuted" _hover={{ color: "admin.text" }} />
          </Dialog.Header>

          <Dialog.Body py={5} maxH="70vh" overflowY="auto">
            {children}
          </Dialog.Body>

          <Dialog.Footer pt={4} borderTop="1px solid" borderColor="admin.border">
            <Flex gap={3} justify="flex-end" w="100%">
              <Button variant="outline" borderColor="admin.border" color="admin.text" onClick={onClose} type="button" disabled={isLoading}>
                Cancel
              </Button>
              <Button colorPalette="brand" type="submit" loading={isLoading} fontWeight="bold" px={6} borderRadius="xl">
                {submitLabel}
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

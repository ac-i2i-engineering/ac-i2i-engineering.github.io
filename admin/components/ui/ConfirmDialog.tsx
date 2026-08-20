"use client";

import { Button, Dialog, Text } from "@chakra-ui/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Delete Permanently",
  cancelText = "Cancel",
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop bg="rgba(26, 20, 16, 0.5)" backdropFilter="blur(4px)" />
      <Dialog.Positioner>
        <Dialog.Content bg="admin.surface" border="1px solid" borderColor="admin.border" borderRadius="2xl" maxW="420px" p={6} color="admin.text">
          <Dialog.Header>
            <Dialog.Title color="admin.text" fontWeight="bold">
              {title}
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body my={3}>
            <Text color="admin.textMuted" fontSize="sm">
              {description}
            </Text>
          </Dialog.Body>
          <Dialog.Footer gap={3}>
            <Button variant="outline" borderColor="admin.border" color="admin.text" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </Button>
            <Button
              bg="#C0341A"
              color="white"
              fontWeight="bold"
              _hover={{ bg: "#A32B15" }}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              loading={isLoading}
            >
              {confirmText}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

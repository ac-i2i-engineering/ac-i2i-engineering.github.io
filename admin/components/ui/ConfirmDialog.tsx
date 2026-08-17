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
      <Dialog.Backdrop bg="rgba(0, 0, 0, 0.75)" backdropFilter="blur(8px)" />
      <Dialog.Positioner>
        <Dialog.Content bg="#0F172A" border="1px solid rgba(255, 255, 255, 0.12)" borderRadius="2xl" maxW="420px" p={6} color="white">
          <Dialog.Header>
            <Dialog.Title color="white" fontWeight="bold">
              {title}
            </Dialog.Title>
          </Dialog.Header>
          <Dialog.Body my={3}>
            <Text color="gray.400" fontSize="sm">
              {description}
            </Text>
          </Dialog.Body>
          <Dialog.Footer gap={3}>
            <Button variant="outline" borderColor="rgba(255, 255, 255, 0.15)" color="gray.300" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </Button>
            <Button
              bg="linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
              color="white"
              fontWeight="bold"
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

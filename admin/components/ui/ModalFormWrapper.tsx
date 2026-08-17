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
      <Dialog.Backdrop bg="rgba(0, 0, 0, 0.75)" backdropFilter="blur(8px)" />
      <Dialog.Positioner>
        <Dialog.Content
          bg="#0F172A"
          border="1px solid rgba(255, 255, 255, 0.12)"
          borderRadius="2xl"
          maxW="560px"
          w="92vw"
          p={6}
          as="form"
          onSubmit={onSubmit}
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.8)"
          color="white"
        >
          <Dialog.Header pb={4} borderBottom="1px solid rgba(255, 255, 255, 0.08)">
            <Dialog.Title color="white" fontWeight="bold" fontSize="lg">
              {title}
            </Dialog.Title>
            <Dialog.CloseTrigger onClick={onClose} color="gray.400" _hover={{ color: "white" }} />
          </Dialog.Header>

          <Dialog.Body py={5} maxH="70vh" overflowY="auto">
            {children}
          </Dialog.Body>

          <Dialog.Footer pt={4} borderTop="1px solid rgba(255, 255, 255, 0.08)">
            <Flex gap={3} justify="flex-end" w="100%">
              <Button
                variant="outline"
                borderColor="rgba(255, 255, 255, 0.15)"
                color="gray.300"
                onClick={onClose}
                type="button"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                background="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
                color="white"
                type="submit"
                loading={isLoading}
                fontWeight="bold"
                px={6}
                borderRadius="xl"
              >
                {submitLabel}
              </Button>
            </Flex>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

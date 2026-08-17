"use client";

import { Box, Flex, Switch, Text, Badge } from "@chakra-ui/react";

interface PublishToggleProps {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function PublishToggle({
  isChecked,
  onChange,
  label = "Status & Visibility",
}: PublishToggleProps) {
  return (
    <Flex
      align="center"
      justify="space-between"
      p={4}
      border="1px solid rgba(255, 255, 255, 0.12)"
      borderRadius="xl"
      bg="rgba(15, 23, 42, 0.6)"
    >
      <Box>
        <Text fontSize="sm" fontWeight="semibold" color="gray.200">
          {label}
        </Text>
        <Badge
          bg={isChecked ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)"}
          color={isChecked ? "#6EE7B7" : "#FDE68A"}
          border={isChecked ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)"}
          px={2.5}
          py={0.5}
          borderRadius="md"
          fontSize="xs"
          mt={1}
        >
          {isChecked ? "🟢 Live / Published" : "🟡 Draft / Hidden"}
        </Badge>
      </Box>
      <Switch.Root checked={isChecked} onCheckedChange={(e) => onChange(e.checked)}>
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Root>
    </Flex>
  );
}

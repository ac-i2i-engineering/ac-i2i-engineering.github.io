"use client";

import { Box, Flex, Switch, Text, Badge } from "@chakra-ui/react";
import { CircleCheck, CircleDashed } from "lucide-react";

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
    <Flex align="center" justify="space-between" p={4} border="1px solid" borderColor="admin.border" borderRadius="xl" bg="admin.bg">
      <Box>
        <Text fontSize="sm" fontWeight="semibold" color="admin.text">
          {label}
        </Text>
        <Badge
          bg={isChecked ? "#F0F7F1" : "#FDF6E9"}
          color={isChecked ? "#2F7A3C" : "#92600A"}
          px={2.5}
          py={0.5}
          borderRadius="md"
          fontSize="xs"
          mt={1}
          display="flex"
          alignItems="center"
          gap={1}
          w="fit-content"
        >
          {isChecked ? <CircleCheck size={12} /> : <CircleDashed size={12} />}
          {isChecked ? "Live / Published" : "Draft / Hidden"}
        </Badge>
      </Box>
      <Switch.Root checked={isChecked} onCheckedChange={(e) => onChange(e.checked)} colorPalette="brand">
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Root>
    </Flex>
  );
}

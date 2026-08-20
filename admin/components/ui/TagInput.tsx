"use client";

import { useState } from "react";
import { Box, Flex, Input, Badge, Text } from "@chakra-ui/react";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (newTags: string[]) => void;
  placeholder?: string;
}

export function TagInput({
  tags,
  onChange,
  placeholder = "Type tag and press Enter...",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Box>
      <Flex wrap="wrap" gap={2} p={2.5} border="1px solid" borderColor="admin.border" borderRadius="xl" bg="admin.bg" minH="48px" align="center">
        {tags.map((tag, idx) => (
          <Badge key={idx} bg="info.subtle" color="info.fg" px={3} py={1} borderRadius="lg" display="flex" alignItems="center" gap={2}>
            <Text fontSize="xs" fontWeight="semibold">
              {tag}
            </Text>
            <Box as="span" cursor="pointer" onClick={() => removeTag(tag)} display="flex" _hover={{ color: "#B23610" }}>
              <X size={12} strokeWidth={2.5} />
            </Box>
          </Badge>
        ))}

        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          variant="outline"
          border="none"
          outline="none"
          size="sm"
          color="admin.text"
          flex="1"
          minW="140px"
          _placeholder={{ color: "admin.textMuted" }}
          _focus={{ boxShadow: "none" }}
        />
      </Flex>
      <Text fontSize="xs" color="admin.textMuted" mt={1}>
        Press Enter or comma (,) to add tags. Backspace to remove last.
      </Text>
    </Box>
  );
}

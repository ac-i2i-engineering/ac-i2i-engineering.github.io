"use client";

import { useState } from "react";
import { Box, Flex, Input, Badge, Text } from "@chakra-ui/react";

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
      <Flex
        wrap="wrap"
        gap={2}
        p={2.5}
        border="1px solid rgba(255, 255, 255, 0.12)"
        borderRadius="xl"
        bg="rgba(15, 23, 42, 0.6)"
        minH="48px"
        align="center"
      >
        {tags.map((tag, idx) => (
          <Badge
            key={idx}
            bg="linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)"
            color="#C7D2FE"
            border="1px solid rgba(99, 102, 241, 0.4)"
            px={3}
            py={1}
            borderRadius="lg"
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Text fontSize="xs" fontWeight="semibold">
              {tag}
            </Text>
            <Text
              as="span"
              cursor="pointer"
              fontWeight="bold"
              fontSize="xs"
              onClick={() => removeTag(tag)}
              _hover={{ color: "red.300" }}
            >
              ✕
            </Text>
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
          color="white"
          flex="1"
          minW="140px"
          _placeholder={{ color: "gray.500" }}
          _focus={{ boxShadow: "none" }}
        />
      </Flex>
      <Text fontSize="xs" color="gray.500" mt={1}>
        Press Enter or comma (,) to add tags. Backspace to remove last.
      </Text>
    </Box>
  );
}

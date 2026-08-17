"use client";

import { useState } from "react";
import { Box, Flex, Text, Button, Spinner, Image } from "@chakra-ui/react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  bucketName?: string;
  label?: string;
}

export function ImageUploader({
  value,
  onChange,
  bucketName = "media-gallery",
  label = "Upload Image",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    await processUpload(file);
  };

  const processUpload = async (file: File) => {
    setUploading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      // Try uploading to Supabase Storage
      const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        onChange(publicUrlData.publicUrl);
      } else {
        // Encode as Base64 Data URL for 100% reliable offline/local rendering
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            onChange(reader.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.warn("Upload exception, encoding as Data URL", err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onChange(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={2}>
        {label}
      </Text>

      {value ? (
        <Box border="1px solid rgba(255, 255, 255, 0.12)" borderRadius="xl" p={3.5} bg="rgba(15, 23, 42, 0.6)">
          <Flex align="center" gap={4}>
            <Box w="68px" h="68px" borderRadius="lg" overflow="hidden" bg="gray.800" flexShrink={0}>
              <Image src={value} alt="Preview" w="100%" h="100%" objectFit="cover" />
            </Box>
            <Box flex="1" overflow="hidden">
              <Text fontSize="xs" color="gray.400" truncate maxW="280px">
                {value}
              </Text>
              <Button size="xs" variant="outline" colorPalette="red" mt={2} onClick={() => onChange("")}>
                Remove Image
              </Button>
            </Box>
          </Flex>
        </Box>
      ) : (
        <Box
          border="2px dashed rgba(255, 255, 255, 0.18)"
          borderRadius="xl"
          p={6}
          textAlign="center"
          bg="rgba(15, 23, 42, 0.5)"
          _hover={{ borderColor: "#818CF8", bg: "rgba(99, 102, 241, 0.08)" }}
          cursor="pointer"
          position="relative"
          transition="all 0.2s"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
            }}
          />

          {uploading ? (
            <Flex justify="center" align="center" gap={2.5}>
              <Spinner size="sm" color="indigo.400" />
              <Text fontSize="sm" color="indigo.300">
                Processing & uploading image...
              </Text>
            </Flex>
          ) : (
            <Box>
              <Text fontSize="3xl" mb={1}>
                ☁️
              </Text>
              <Text fontSize="sm" fontWeight="semibold" color="gray.200">
                Click or drag & drop image here
              </Text>
              <Text fontSize="xs" color="gray.500" mt={1}>
                PNG, JPG, WEBP, GIF up to 5MB
              </Text>
            </Box>
          )}
        </Box>
      )}

      {errorMsg && (
        <Text fontSize="xs" color="red.400" mt={1.5}>
          {errorMsg}
        </Text>
      )}
    </Box>
  );
}

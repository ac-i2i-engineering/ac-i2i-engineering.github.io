"use client";

import { useState } from "react";
import { Box, Flex, Text, Button, Spinner, Image } from "@chakra-ui/react";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  bucketName?: string;
  label?: string;
  /** Fires with the raw File as soon as one is picked, before upload starts
   *  -- lets a caller read client-side-only data (e.g. EXIF) that isn't
   *  recoverable from the uploaded URL alone. */
  onFileSelected?: (file: File) => void;
}

export function ImageUploader({
  value,
  onChange,
  bucketName = "media-gallery",
  label = "Upload Image",
  onFileSelected,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    onFileSelected?.(file);
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
    } catch (err) {
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
      <Text fontSize="sm" fontWeight="semibold" color="admin.text" mb={2}>
        {label}
      </Text>

      {value ? (
        <Box border="1px solid" borderColor="admin.border" borderRadius="xl" p={3.5} bg="admin.bg">
          <Flex align="center" gap={4}>
            <Box w="68px" h="68px" borderRadius="lg" overflow="hidden" bg="admin.border" flexShrink={0}>
              <Image src={value} alt="Preview" w="100%" h="100%" objectFit="cover" />
            </Box>
            <Box flex="1" overflow="hidden">
              <Text fontSize="xs" color="admin.textMuted" truncate maxW="280px">
                {value}
              </Text>
              <Button size="xs" variant="outline" colorPalette="danger" mt={2} onClick={() => onChange("")}>
                Remove Image
              </Button>
            </Box>
          </Flex>
        </Box>
      ) : (
        <Box
          border="2px dashed"
          borderColor="admin.border"
          borderRadius="xl"
          p={6}
          textAlign="center"
          bg="admin.bg"
          _hover={{ borderColor: "brand.emphasized", bg: "brand.subtle" }}
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
              <Spinner size="sm" color="brand.solid" />
              <Text fontSize="sm" color="brand.fg">
                Processing & uploading image...
              </Text>
            </Flex>
          ) : (
            <Box>
              <Flex justify="center" mb={2}>
                <Upload size={26} color="#5C4E42" strokeWidth={1.75} />
              </Flex>
              <Text fontSize="sm" fontWeight="semibold" color="admin.text">
                Click or drag & drop image here
              </Text>
              <Text fontSize="xs" color="admin.textMuted" mt={1}>
                PNG, JPG, WEBP, GIF up to 5MB
              </Text>
            </Box>
          )}
        </Box>
      )}

      {errorMsg && (
        <Text fontSize="xs" color="red.500" mt={1.5}>
          {errorMsg}
        </Text>
      )}
    </Box>
  );
}

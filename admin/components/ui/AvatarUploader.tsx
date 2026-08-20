"use client";

import { useState } from "react";
import { Avatar, Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AvatarUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  name: string;
  bucketName?: string;
}

// A circular profile-photo picker, distinct from ImageUploader (which is a
// drag-and-drop dropzone meant for banner/cover images) -- putting that same
// large rectangular dropzone next to a name field read as cluttered for
// something as small as an avatar.
export function AvatarUploader({ value, onChange, name, bucketName = "admin-avatars" }: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

      const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        onChange(publicUrlData.publicUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) onChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn("Avatar upload exception", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Flex direction="column" align="center" gap={2}>
      <Box position="relative" w="88px" h="88px">
        {/* Chakra's size="full" sets --avatar-font-size to the CSS
            percentage "100%" (inherits ambient text size), not a size
            scaled to the avatar's own box -- setting both custom properties
            directly is what the "full" variant is actually shorthand for,
            just with real pixel values instead. Fallback also needs an
            explicit w/h/display -- Chakra's avatar recipe never sizes it to
            the root, so without this it just centers a small pill sized to
            its own text instead of filling the circle. */}
        <Avatar.Root style={{ "--avatar-size": "88px", "--avatar-font-size": "2rem" } as React.CSSProperties}>
          <Avatar.Fallback
            name={name}
            bg="brand.solid"
            color="white"
            fontWeight="bold"
            w="100%"
            h="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
          />
          {value && <Avatar.Image src={value} alt={name} />}
        </Avatar.Root>

        <Flex
          as="label"
          position="absolute"
          bottom="-2px"
          right="-2px"
          w="30px"
          h="30px"
          borderRadius="full"
          bg="brand.solid"
          border="2px solid"
          borderColor="admin.surface"
          align="center"
          justify="center"
          cursor="pointer"
          _hover={{ bg: "brand.emphasized" }}
        >
          {uploading ? <Spinner size="xs" color="white" /> : <Camera size={14} color="white" />}
          <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} disabled={uploading} />
        </Flex>
      </Box>
      <Text fontSize="xs" color="admin.textMuted">
        Click the icon to change
      </Text>
    </Flex>
  );
}

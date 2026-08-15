import { Box, Heading, Text } from "@chakra-ui/react";

// Owner: UI.
// TODO: Grid browse of media rows, upload (ImageUploader -> Storage bucket
//       per STORAGE_BUCKETS in lib/types.ts), preview, delete, and an
//       "attach to record" picker that sets attached_to_type/attached_to_id.
export default function MediaPage() {
  return (
    <Box p={8}>
      <Heading size="lg" mb={2}>
        Media Manager
      </Heading>
      <Text color="gray.500">Coming soon.</Text>
    </Box>
  );
}

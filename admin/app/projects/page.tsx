import { Box, Heading, Text } from "@chakra-ui/react";

// Owner: UI.
// TODO: DataTable of startups (title, tags, published?); Create/Edit form
//       (auto-slug from title, tags as chips via TagInput); delete with
//       ConfirmDialog. See lib/types.ts.
export default function ProjectsPage() {
  return (
    <Box p={8}>
      <Heading size="lg" mb={2}>
        Projects / Startups
      </Heading>
      <Text color="gray.500">Coming soon.</Text>
    </Box>
  );
}

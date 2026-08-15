import { Box, Heading, Text } from "@chakra-ui/react";

// Owner: UI.
// TODO: DataTable of events (title, date, location, published?) + date-picker/
//       calendar view; Create/Edit form with is_published toggle; delete with
//       ConfirmDialog. See lib/types.ts.
export default function EventsPage() {
  return (
    <Box p={8}>
      <Heading size="lg" mb={2}>
        Events
      </Heading>
      <Text color="gray.500">Coming soon.</Text>
    </Box>
  );
}

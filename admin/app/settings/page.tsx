import { Box, Heading, Text } from "@chakra-ui/react";

// Owner: UI.
// TODO: Read-only list of admin_users (email, role, created_at) + an
//       "invite admin" form that POSTs to an API route using the
//       service_role key server-side (never call admin_users directly
//       from the client — there is no client-write RLS policy for it).
export default function SettingsPage() {
  return (
    <Box p={8}>
      <Heading size="lg" mb={2}>
        Settings
      </Heading>
      <Text color="gray.500">Coming soon.</Text>
    </Box>
  );
}

import { Box, Heading, Text } from "@chakra-ui/react";

// Owner: UI.
// TODO: DataTable of team_members (name, role, department, lead?, published?)
//       with search + sort; secondary tab/list for team_departments (~7 rows);
//       Create/Edit modal; delete with ConfirmDialog. See lib/types.ts.
export default function TeamPage() {
  return (
    <Box p={8}>
      <Heading size="lg" mb={2}>
        Teams
      </Heading>
      <Text color="gray.500">Coming soon.</Text>
    </Box>
  );
}

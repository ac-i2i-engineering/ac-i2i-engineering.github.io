import { Box, Heading, Text } from "@chakra-ui/react";

// Owner: UI.
// TODO: 4 stat cards (Team Members, Events w/ upcoming sub-count,
//       Projects/Startups, Media), each showing count + last-updated +
//       "N updated in last 7 days". Backing queries: owner Database + API,
//       lib/queries/stats.ts.
export default function HomePage() {
  return (
    <Box p={8}>
      <Heading size="lg" mb={2}>
        Dashboard
      </Heading>
      <Text color="gray.500">Coming soon.</Text>
    </Box>
  );
}

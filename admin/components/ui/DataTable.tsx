"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Table,
  Input,
  Button,
  Text,
  Spinner,
} from "@chakra-ui/react";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  isLoading?: boolean;
  onAddClick?: () => void;
  addButtonLabel?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Search records...",
  isLoading = false,
  onAddClick,
  addButtonLabel = "Add New",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <Box
      className="glass-panel"
      borderRadius="2xl"
      p={{ base: 4, md: 6 }}
      boxShadow="0 20px 40px rgba(0, 0, 0, 0.4)"
    >
      {/* Header Bar */}
      <Flex justify="space-between" align="center" mb={6} gap={4} wrap="wrap">
        <Box maxW="360px" w="100%">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            bg="rgba(15, 23, 42, 0.6)"
            border="1px solid rgba(255, 255, 255, 0.12)"
            color="white"
            borderRadius="xl"
            px={4}
            py={2.5}
            fontSize="sm"
            _placeholder={{ color: "gray.500" }}
            _focus={{ borderColor: "#818CF8", boxShadow: "0 0 12px rgba(99, 102, 241, 0.3)" }}
          />
        </Box>

        {onAddClick && (
          <Button
            background="linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)"
            color="white"
            fontWeight="bold"
            px={6}
            py={2.5}
            borderRadius="xl"
            boxShadow="0 4px 15px rgba(99, 102, 241, 0.4)"
            _hover={{
              transform: "translateY(-1px)",
              boxShadow: "0 6px 20px rgba(99, 102, 241, 0.6)",
            }}
            onClick={onAddClick}
          >
            + {addButtonLabel}
          </Button>
        )}
      </Flex>

      {/* Table Container */}
      <Box overflowX="auto">
        {isLoading ? (
          <Flex justify="center" align="center" py={16} gap={3}>
            <Spinner size="md" color="indigo.400" />
            <Text color="gray.400" fontSize="sm">
              Loading records...
            </Text>
          </Flex>
        ) : (
          <Table.Root size="md" variant="outline" borderColor="rgba(255, 255, 255, 0.08)">
            <Table.Header bg="rgba(15, 23, 42, 0.8)">
              <Table.Row borderBottom="1px solid rgba(255, 255, 255, 0.1)">
                {columns.map((col, idx) => (
                  <Table.ColumnHeader
                    key={idx}
                    fontWeight="bold"
                    color="gray.400"
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                    py={3.5}
                    cursor={col.sortable ? "pointer" : "default"}
                    onClick={() => col.sortable && handleSort(col.accessorKey)}
                  >
                    <Flex align="center" gap={1.5}>
                      {col.header}
                      {col.sortable && sortKey === col.accessorKey && (
                        <Text color="#818CF8">{sortOrder === "asc" ? "▲" : "▼"}</Text>
                      )}
                    </Flex>
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {paginatedData.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={columns.length} textAlign="center" py={12}>
                    <Text color="gray.500">No matching records found.</Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                paginatedData.map((row, rowIdx) => (
                  <Table.Row
                    key={row.id ?? rowIdx}
                    borderBottom="1px solid rgba(255, 255, 255, 0.06)"
                    transition="all 0.15s"
                    _hover={{ bg: "rgba(255, 255, 255, 0.03)" }}
                  >
                    {columns.map((col, colIdx) => (
                      <Table.Cell key={colIdx} py={4} color="gray.200">
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? String(row[col.accessorKey] ?? "—")
                          : "—"}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {/* Footer Pagination */}
      <Flex justify="space-between" align="center" mt={5} pt={4} borderTop="1px solid" borderColor="rgba(255, 255, 255, 0.08)">
        <Text fontSize="xs" color="gray.400">
          Showing {paginatedData.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, sortedData.length)} of {sortedData.length} entries
        </Text>

        <Flex gap={2} align="center">
          <Button
            size="xs"
            variant="outline"
            borderColor="rgba(255, 255, 255, 0.15)"
            color="gray.300"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            _hover={{ bg: "rgba(255, 255, 255, 0.08)" }}
          >
            Previous
          </Button>
          <Text fontSize="xs" color="gray.400" px={2}>
            Page {page} of {totalPages}
          </Text>
          <Button
            size="xs"
            variant="outline"
            borderColor="rgba(255, 255, 255, 0.15)"
            color="gray.300"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            _hover={{ bg: "rgba(255, 255, 255, 0.08)" }}
          >
            Next
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

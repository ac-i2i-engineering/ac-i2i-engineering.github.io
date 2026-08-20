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
import { Plus, ChevronUp, ChevronDown, Search } from "lucide-react";

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

// Generic row type varies per page (TeamMember/Event/Startup/AdminUser/...),
// none declare an index signature, so a stricter bound than `any` here
// rejects all of them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <Box className="admin-panel" borderRadius="2xl" p={{ base: 4, md: 6 }}>
      {/* Header Bar */}
      <Flex justify="space-between" align="center" mb={6} gap={4} wrap="wrap">
        <Box maxW="360px" w="100%" position="relative">
          <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" color="admin.textMuted" pointerEvents="none">
            <Search size={16} />
          </Box>
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            bg="admin.bg"
            border="1px solid"
            borderColor="admin.border"
            color="admin.text"
            borderRadius="xl"
            pl={9}
            pr={4}
            py={2.5}
            fontSize="sm"
            _placeholder={{ color: "admin.textMuted" }}
            _focus={{ borderColor: "brand.emphasized", boxShadow: "0 0 0 3px {colors.brand.subtle}" }}
          />
        </Box>

        {onAddClick && (
          <Button colorPalette="brand" fontWeight="bold" px={6} py={2.5} borderRadius="xl" onClick={onAddClick}>
            <Plus size={16} />
            {addButtonLabel}
          </Button>
        )}
      </Flex>

      {/* Table Container */}
      <Box overflowX="auto">
        {isLoading ? (
          <Flex justify="center" align="center" py={16} gap={3}>
            <Spinner size="md" color="brand.solid" />
            <Text color="admin.textMuted" fontSize="sm">
              Loading records...
            </Text>
          </Flex>
        ) : (
          <Table.Root size="md" variant="outline" borderColor="admin.border">
            <Table.Header bg="admin.bg">
              <Table.Row borderBottom="1px solid" borderColor="admin.border">
                {columns.map((col, idx) => (
                  <Table.ColumnHeader
                    key={idx}
                    fontWeight="bold"
                    color="admin.textMuted"
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="0.05em"
                    py={3.5}
                    cursor={col.sortable ? "pointer" : "default"}
                    onClick={() => col.sortable && handleSort(col.accessorKey)}
                  >
                    <Flex align="center" gap={1}>
                      {col.header}
                      {col.sortable &&
                        sortKey === col.accessorKey &&
                        (sortOrder === "asc" ? (
                          <ChevronUp size={13} color="var(--chakra-colors-brand-fg)" />
                        ) : (
                          <ChevronDown size={13} color="var(--chakra-colors-brand-fg)" />
                        ))}
                    </Flex>
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {paginatedData.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={columns.length} textAlign="center" py={12}>
                    <Text color="admin.textMuted">No matching records found.</Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                paginatedData.map((row, rowIdx) => (
                  <Table.Row
                    key={row.id ?? rowIdx}
                    borderBottom="1px solid"
                    borderColor="admin.border"
                    transition="all 0.15s"
                    _hover={{ bg: "admin.bg" }}
                  >
                    {columns.map((col, colIdx) => (
                      <Table.Cell key={colIdx} py={4} color="admin.text">
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
      <Flex justify="space-between" align="center" mt={5} pt={4} borderTop="1px solid" borderColor="admin.border">
        <Text fontSize="xs" color="admin.textMuted">
          Showing {paginatedData.length > 0 ? (page - 1) * pageSize + 1 : 0} to{" "}
          {Math.min(page * pageSize, sortedData.length)} of {sortedData.length} entries
        </Text>

        <Flex gap={2} align="center">
          <Button
            size="xs"
            variant="outline"
            borderColor="admin.border"
            color="admin.text"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            _hover={{ bg: "admin.bg" }}
          >
            Previous
          </Button>
          <Text fontSize="xs" color="admin.textMuted" px={2}>
            Page {page} of {totalPages}
          </Text>
          <Button
            size="xs"
            variant="outline"
            borderColor="admin.border"
            color="admin.text"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            _hover={{ bg: "admin.bg" }}
          >
            Next
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
}

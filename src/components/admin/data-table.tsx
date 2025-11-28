'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Edit, Trash2, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Link from 'next/link';

export interface Column<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: string[];
  searchable?: boolean; // Whether this column should be included in multi-column search
  sortFn?: (a: T, b: T) => number; // Custom sort function
}

export interface CustomAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  show?: (row: T) => boolean; // Conditionally show action
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: string; // Single column search (for backward compatibility)
  searchKeys?: string[]; // Multi-column search keys
  searchPlaceholder?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  editUrl?: (row: T) => string;
  viewUrl?: (row: T) => string;
  actions?: boolean;
  customActions?: (row: T) => React.ReactNode; // Custom action buttons renderer
  actionButtons?: CustomAction<T>[]; // Array of custom action buttons
  enablePagination?: boolean;
  defaultPageSize?: number;
  filters?: Record<string, string[]>;
  onFiltersChange?: (filters: Record<string, string[]>) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKey,
  searchKeys,
  searchPlaceholder = 'Cari...',
  onEdit,
  onDelete,
  onView,
  editUrl,
  viewUrl,
  actions = true,
  customActions,
  actionButtons,
  enablePagination = true,
  defaultPageSize = 25,
  filters,
  onFiltersChange,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [localFilters, setLocalFilters] = React.useState<Record<string, string[]>>(filters || {});

  // Determine search keys: use searchKeys if provided, otherwise use searchable columns, otherwise fallback to searchKey
  const effectiveSearchKeys = React.useMemo(() => {
    if (searchKeys && searchKeys.length > 0) {
      return searchKeys;
    }
    if (searchKey) {
      return [searchKey];
    }
    // Auto-detect searchable columns
    return columns.filter(col => col.searchable !== false).map(col => col.key);
  }, [searchKeys, searchKey, columns]);

  const filteredData = React.useMemo(() => {
    let result = [...data];

    // Multi-column search filter
    if (search && effectiveSearchKeys.length > 0) {
      const searchLower = search.toLowerCase();
      result = result.filter((item) => {
        return effectiveSearchKeys.some((key) => {
          const value = (item as any)[key];
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(searchLower);
        });
      });
    }

    // Column filters
    const activeFilters = onFiltersChange ? filters || {} : localFilters;
    Object.entries(activeFilters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        result = result.filter((item) => {
          const value = (item as any)[key];
          return values.includes(String(value));
        });
      }
    });

    // Sort
    if (sortBy) {
      const column = columns.find(col => col.key === sortBy);
      if (column?.sortFn) {
        // Use custom sort function
        result.sort((a, b) => {
          const comparison = column.sortFn!(a, b);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      } else {
        // Default sort
        result.sort((a, b) => {
          const aVal = (a as any)[sortBy];
          const bVal = (b as any)[sortBy];
          
          // Handle null/undefined
          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;
          
          // Handle dates
          if (aVal instanceof Date && bVal instanceof Date) {
            const comparison = aVal.getTime() - bVal.getTime();
            return sortOrder === 'asc' ? comparison : -comparison;
          }
          
          // Handle date strings (ISO format)
          if (typeof aVal === 'string' && typeof bVal === 'string' && 
              /^\d{4}-\d{2}-\d{2}/.test(aVal) && /^\d{4}-\d{2}-\d{2}/.test(bVal)) {
            const comparison = new Date(aVal).getTime() - new Date(bVal).getTime();
            return sortOrder === 'asc' ? comparison : -comparison;
          }
          
          // Handle numbers
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            const comparison = aVal - bVal;
            return sortOrder === 'asc' ? comparison : -comparison;
          }
          
          // Handle strings
          const comparison = String(aVal).localeCompare(String(bVal));
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [data, search, effectiveSearchKeys, sortBy, sortOrder, filters, localFilters, onFiltersChange, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = enablePagination 
    ? filteredData.slice(startIndex, endIndex)
    : filteredData;

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, filters, localFilters]);

  const handleFilterChange = (key: string, values: string[]) => {
    if (onFiltersChange) {
      onFiltersChange({ ...(filters || {}), [key]: values });
    } else {
      setLocalFilters(prev => ({ ...prev, [key]: values }));
    }
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {(searchKey || effectiveSearchKeys.length > 0) && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
        {enablePagination && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select value={String(pageSize)} onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  {column.header}
                  {column.sortable && sortBy === column.key && (
                    <span className="ml-2">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </TableHead>
              ))}
              {actions && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.cell ? column.cell(row) : (row as any)[column.key]}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Custom actions renderer */}
                        {customActions && customActions(row)}
                        
                        {/* Custom action buttons */}
                        {actionButtons && actionButtons
                          .filter(action => !action.show || action.show(row))
                          .map((action, idx) => (
                            <Button
                              key={idx}
                              variant={action.variant || 'ghost'}
                              size={action.size || 'icon'}
                              onClick={() => action.onClick(row)}
                              title={action.label}
                            >
                              {action.icon || action.label}
                            </Button>
                          ))}
                        
                        {/* Standard actions */}
                        {!customActions && !actionButtons && (
                          <>
                            {viewUrl && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={viewUrl(row)}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {onView && (
                              <Button variant="ghost" size="icon" onClick={() => onView(row)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {editUrl && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={editUrl(row)}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {onEdit && (
                              <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(row)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="text-sm text-muted-foreground">
          Menampilkan {enablePagination ? `${startIndex + 1}-${Math.min(endIndex, filteredData.length)}` : filteredData.length} dari {filteredData.length} data
          {filteredData.length !== data.length && ` (dari ${data.length} total)`}
        </div>
        {enablePagination && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm">
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


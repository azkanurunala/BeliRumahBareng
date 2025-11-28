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
import { Search, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

export interface Column<T> {
  key: string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: string;
  searchPlaceholder?: string;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  editUrl?: (row: T) => string;
  viewUrl?: (row: T) => string;
  actions?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Cari...',
  onEdit,
  onDelete,
  onView,
  editUrl,
  viewUrl,
  actions = true,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const filteredData = React.useMemo(() => {
    let result = [...data];

    // Search filter
    if (search && searchKey) {
      const searchLower = search.toLowerCase();
      result = result.filter((item) => {
        const value = (item as any)[searchKey];
        return value?.toString().toLowerCase().includes(searchLower);
      });
    }

    // Sort
    if (sortBy) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortBy];
        const bVal = (b as any)[sortBy];
        const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, search, searchKey, sortBy, sortOrder]);

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
      {searchKey && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}
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
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                  Tidak ada data
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.cell ? column.cell(row) : (row as any)[column.key]}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-sm text-muted-foreground">
        Menampilkan {filteredData.length} dari {data.length} data
      </div>
    </div>
  );
}


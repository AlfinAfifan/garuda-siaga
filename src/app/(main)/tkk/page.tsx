'use client';

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Trash2, FolderDown } from 'lucide-react';
import { ColumnDef, DataTable } from '@/components/ui/data-table';
import { CustomPagination } from '@/components/ui/pagination';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import moment from 'moment';
import { getMembers } from '@/services/member';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { createTkk, deleteTkk, exportTkk, getTkk, getSummary, TkkPayload } from '@/services/tkk';
import { TkkData } from './types';
import { useNavbarAction } from '../layout';
import { getTypeTkk } from '@/services/type-tkk';
import { utils, writeFile } from 'xlsx';

export default function TKKPage() {
  const queryClient = useQueryClient();
  const { setButtonAction } = useNavbarAction();

  const [modalOpen, setModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const [paramsTkk, setParamsTkk] = useState({ search: '', page: 1, limit: 10 });
  const [paramsMember, setParamsMember] = useState({ search: '', page: 1, limit: 10 });
  const [paramsTypeTkk, setParamsTypeTkk] = useState({ search: '', page: 1, limit: 10 });

  const [dataDelete, setDataDelete] = useState<TkkData | null>(null);

  const [form, setFormTkk] = useState<TkkPayload>({
    member_id: '',
    type_tkk_id: '',
    examiner_name: '',
    examiner_address: '',
    examiner_position: '',
  });

  const { data: memberOptions, isPending: isPendingMember } = useQuery({
    queryKey: ['members', paramsMember],
    queryFn: async () => getMembers(paramsMember),
  });
  const { data: typeTkkOptions, isPending: isPendingTypeTkk } = useQuery({
    queryKey: ['type-tkk', paramsTypeTkk],
    queryFn: async () => getTypeTkk(paramsTypeTkk),
  });
  const {
    data: dataTkk,
    refetch: refetchTkk,
    isPending: isPendingTkk,
  } = useQuery({
    queryKey: ['tkk', paramsTkk],
    queryFn: () => getTkk(paramsTkk),
    retry: 1,
    retryDelay: 1000,
  });

  const createDataTkk = useMutation({
    mutationFn: createTkk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tkk'] });
      setModalOpen(false);
    },
  });

  const deleteDataTkk = useMutation({
    mutationFn: (id: string) => deleteTkk(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tkk'] });
    },
  });

  const handleSubmitTkk = async (e: React.FormEvent) => {
    e.preventDefault();
    await toast.promise(createDataTkk.mutateAsync(form), {
      loading: 'Mengirim permintaan...',
      success: 'Data berhasil disimpan!',
      error: (err) => `Gagal menyimpan request: ${err}`,
    });
    setShowAddModal(false);
    setFormTkk({
      member_id: '',
      type_tkk_id: '',
      examiner_name: '',
      examiner_address: '',
      examiner_position: '',
    });
  };

  const handleConfirmDelete = async () => {
    await toast.promise(deleteDataTkk.mutateAsync(dataDelete?._id || ''), {
      loading: 'Menghapus data...',
      success: 'Data berhasil dihapus!',
      error: (err) => `Gagal menghapus data: ${err}`,
    });
  };

  const handleDelete = (item: TkkData) => {
    setDataDelete(item);
    setDeleteModal(true);
  };

  const handleExport = async () => {
    try {
      const response = await exportTkk();

      const rows = response.data.map((item: any) => ({
        Nama: item.member_name || '',
        NTA: item.member_number || '',
        Lembaga: item.institution_name || '',
        Tanggal: item.date || '',
        SK: item.sk || '',
        Penguji: item.examiner_name || '',
        'Posisi Penguji': item.examiner_position || '',
        'Alamat Penguji': item.examiner_address || '',
      }));

      const worksheet = utils.json_to_sheet(rows);
      const workbook = utils.book_new();

      utils.book_append_sheet(workbook, worksheet, 'RekapTKK');
      utils.sheet_add_aoa(worksheet, [['Nama', 'NTA', 'Lembaga', 'Tanggal', 'SK', 'Penguji', 'Posisi Penguji', 'Alamat Penguji']], { origin: 'A1' });

      worksheet['!cols'] = [
        { wch: 20 }, // Nama
        { wch: 15 }, // NTA
        { wch: 25 }, // Lembaga
        { wch: 10 }, // TKK
        { wch: 15 }, // Tanggal
        { wch: 20 }, // SK
        { wch: 25 }, // Penguji
      ];

      writeFile(workbook, 'RekapTKK.xlsx', {
        compression: true,
      });
    } catch (error) {
      console.error('Error downloading export:', error);
      toast.error('Gagal mengunduh data. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    setButtonAction(
      <div className="flex items-center space-x-2">
        <Button className="bg-primary-600 hover:bg-primary-700" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Data
        </Button>

        <Button className="bg-green-600 hover:bg-green-700" onClick={handleExport}>
          <FolderDown className="w-4 h-4 mr-2" />
          Excel
        </Button>
      </div>
    );
    return () => setButtonAction(undefined);
  }, [setButtonAction]);

  // Columns per tab
  const columns: ColumnDef<TkkData>[] = [
    {
      header: 'Nama',
      accessor: 'member.name',
      cell: (item) => item.member?.name || '-',
    },
    {
      header: 'NTA',
      accessor: 'member.member_number',
      cell: (item) => item.member?.member_number || '-',
    },
    {
      header: 'Lembaga',
      accessor: 'institution.name',
      cell: (item) => item.institution?.name || '-',
    },
    {
      header: 'Jenis TKK',
      accessor: 'type_tkk.name',
    },
    {
      header: 'SK',
      accessor: 'sk',
    },
    {
      header: 'Penguji',
      accessor: 'examiner_name',
    },
    {
      header: 'Tanggal Tkk',
      accessor: 'date',
      cell: (item) => (item.date ? moment(item.date).format('DD/MM/YYYY') : '-'),
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (item) => (
        <div className="flex gap-4 items-center">
          <Button onClick={() => handleDelete(item)} size="icon" className="size-8 bg-red-50 hover:bg-red-100 text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Dialog
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) {
            setFormTkk({
              member_id: '',
              type_tkk_id: '',
              examiner_name: '',
              examiner_address: '',
              examiner_position: '',
            });
          }
        }}
      >
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Tambah Data TKK</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitTkk} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member_id">Pilih Anggota</Label>
              <SearchableSelect
                value={form.member_id ?? ''}
                options={memberOptions?.data}
                isLoading={isPendingMember}
                placeholder="Pilih anggota"
                searchValue={paramsMember.search}
                onValueChange={(value) => setFormTkk((prev) => ({ ...prev, member_id: value }))}
                onSearchChange={(value) => setParamsMember((prev) => ({ ...prev, search: value }))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type_tkk_id">Pilih Jenis TKK</Label>
              <SearchableSelect
                value={form.type_tkk_id ?? ''}
                options={typeTkkOptions?.data}
                isLoading={isPendingTypeTkk}
                placeholder="Pilih jenis TKK"
                searchValue={paramsTypeTkk.search}
                onValueChange={(value) => setFormTkk((prev) => ({ ...prev, type_tkk_id: value }))}
                onSearchChange={(value) => setParamsTypeTkk((prev) => ({ ...prev, search: value }))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examiner_name">Nama Penguji</Label>
              <Input id="examiner_name" value={form.examiner_name} onChange={(e) => setFormTkk((prev) => ({ ...prev, examiner_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examiner_address">Alamat Penguji</Label>
              <Input id="examiner_address" value={form.examiner_address} onChange={(e) => setFormTkk((prev) => ({ ...prev, examiner_address: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examiner_position">Jabatan Penguji</Label>
              <Input id="examiner_position" value={form.examiner_position} onChange={(e) => setFormTkk((prev) => ({ ...prev, examiner_position: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setFormTkk({
                    member_id: '',
                    type_tkk_id: '',
                    examiner_name: '',
                    examiner_address: '',
                    examiner_position: '',
                  });
                }}
              >
                Batal
              </Button>
              <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white" disabled={!form.member_id}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Daftar TKK</CardTitle>
          <CardAction>
            <div className="relative sm:max-w-xs w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari berdasarkan nama..." className="pl-8" value={paramsTkk.search} onChange={(e) => setParamsTkk((prev) => ({ ...prev, page: 1, search: e.target.value }))} />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={dataTkk?.data}
            isLoading={isPendingTkk}
            keyField="_id"
            emptyMessage={{
              title: 'Data TKK tidak ditemukan',
              description: 'Tambahkan data TKK anggota',
              buttonText: 'Tambah TKK',
              icon: Plus,
              onButtonClick: () => setShowAddModal(true),
            }}
          />
          <CustomPagination
            currentPage={paramsTkk.page}
            totalPages={dataTkk?.pagination?.total_pages}
            onPageChange={(page) => setParamsTkk((prev) => ({ ...prev, page }))}
            itemsPerPage={paramsTkk.limit}
            onItemsPerPageChange={(limit) => setParamsTkk((prev) => ({ ...prev, limit, page: 1 }))}
          />
        </CardContent>
      </Card>

      <DeleteConfirmation
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Data TKK"
        description="Apakah Anda yakin ingin menghapus data TKK ini? Aksi ini tidak dapat dibatalkan."
        itemName={dataDelete?.member?.name || ''}
        isLoading={deleteDataTkk.isPending}
      />
    </div>
  );
}

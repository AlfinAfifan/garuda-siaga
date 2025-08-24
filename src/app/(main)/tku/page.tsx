'use client';

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trophy, Plus, Search, Filter, CheckCircle, Clock, Trash2, FileText, CircleCheckBig, FolderDown } from 'lucide-react';
import { ColumnDef, DataTable } from '@/components/ui/data-table';
import { CustomPagination } from '@/components/ui/pagination';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { TkuData } from './types';
import toast from 'react-hot-toast';
import { createBantu, createMula, createTata, deleteMula, deleteBantu, deleteTata, getMula, getBantu, getTata, getSummary, exportTku } from '@/services/tku';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { UpdateConfirmation } from '@/components/ui/update-confirmation';
import moment from 'moment';
import { getMembers } from '@/services/member';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useNavbarAction } from '../layout';
import { utils, writeFile } from 'xlsx';

export default function TKKPage() {
  const queryClient = useQueryClient();
  const { setButtonAction } = useNavbarAction();

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [updateConfirmModal, setUpdateConfirmModal] = useState(false);

  const [params, setParams] = useState({ search: '', page: 1, limit: 10 });
  const [paramsMember, setParamsMember] = useState({ search: '', page: 1, limit: 10 });
  const [activeTab, setActiveTab] = useState<'mula' | 'bantu' | 'tata'>('mula');

  const [updateData, setUpdateData] = useState<TkuData | null>(null);
  const [dataDelete, setDataDelete] = useState<TkuData | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const { data: memberOptions, isPending: isPendingMember } = useQuery({
    queryKey: ['members', paramsMember],
    queryFn: async () => getMembers(paramsMember),
  });
  const { data: summary, isPending: isPendingSummary } = useQuery({
    queryKey: ['tku-summary'],
    queryFn: getSummary,
  });
  const {
    data: dataMula,
    refetch: refetchMula,
    isPending: isPendingMula,
  } = useQuery({
    queryKey: ['tku-mula', params],
    queryFn: () => getMula(params),
    retry: 1,
    retryDelay: 1000,
    enabled: activeTab === 'mula',
  });
  const {
    data: dataBantu,
    refetch: refetchBantu,
    isPending: isPendingBantu,
  } = useQuery({
    queryKey: ['tku-bantu', params],
    queryFn: () => getBantu(params),
    retry: 1,
    retryDelay: 1000,
    enabled: activeTab === 'bantu',
  });
  const {
    data: dataTata,
    refetch: refetchTata,
    isPending: isPendingTata,
  } = useQuery({
    queryKey: ['tku-tata', params],
    queryFn: () => getTata(params),
    retry: 1,
    retryDelay: 1000,
    enabled: activeTab === 'tata',
  });

  const createDataMula = useMutation({
    mutationFn: createMula,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tku-mula'] });
      setModalOpen(false);
    },
  });

  const createDataBantu = useMutation({
    mutationFn: createBantu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tku-bantu'] });
      setModalOpen(false);
    },
  });

  const createDataTata = useMutation({
    mutationFn: createTata,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tku-tata'] });
      setModalOpen(false);
    },
  });

  const deleteDataMula = useMutation({
    mutationFn: (id: string) => deleteMula(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tku-mula'] });
    },
  });
  const deleteDataBantu = useMutation({
    mutationFn: (id: string) => deleteBantu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tku-bantu'] });
    },
  });
  const deleteDataTata = useMutation({
    mutationFn: (id: string) => deleteTata(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tku-tata'] });
    },
  });

  const handleSubmit = async (data: { member_id: string }) => {
    await toast.promise(createDataMula.mutateAsync(data), {
      loading: 'Mengirim permintaan...',
      success: 'Data berhasil disimpan!',
      error: (err) => `Gagal menyimpan request: ${err}`,
    });
  };

  const handleConfirmUpdate = async () => {
    if (activeTab === 'mula') {
      await toast.promise(createDataBantu.mutateAsync({ id: updateData?._id || '' }), {
        loading: 'Mengupdate data...',
        success: 'Data berhasil diupdate!',
        error: (err) => `Gagal mengupdate data: ${err}`,
      });
    } else if (activeTab === 'bantu') {
      await toast.promise(createDataTata.mutateAsync({ id: updateData?._id || '' }), {
        loading: 'Mengupdate data...',
        success: 'Data berhasil diupdate!',
        error: (err) => `Gagal mengupdate data: ${err}`,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (activeTab === 'mula') {
      await toast.promise(deleteDataMula.mutateAsync(dataDelete?._id || ''), {
        loading: 'Menghapus data...',
        success: 'Data berhasil dihapus!',
        error: (err) => `Gagal menghapus data: ${err}`,
      });
    } else if (activeTab === 'bantu') {
      await toast.promise(deleteDataBantu.mutateAsync(dataDelete?._id || ''), {
        loading: 'Menghapus data...',
        success: 'Data berhasil dihapus!',
        error: (err) => `Gagal menghapus data: ${err}`,
      });
    } else if (activeTab === 'tata') {
      await toast.promise(deleteDataTata.mutateAsync(dataDelete?._id || ''), {
        loading: 'Menghapus data...',
        success: 'Data berhasil dihapus!',
        error: (err) => `Gagal menghapus data: ${err}`,
      });
    }
  };

  const handleUpdate = (item: TkuData) => {
    setUpdateData(item);
    setUpdateConfirmModal(true);
  };

  const handleDelete = (item: TkuData) => {
    setDataDelete(item);
    setDeleteModal(true);
  };

  const handleExport = async () => {
    try {
      const response = await exportTku();

      const rows = response.data.map((item: any) => ({
        Nama: item.member_name || '',
        NTA: item.member_number || '',
        Lembaga: item.institution_name || '',
        'TKU Mula': item.mula ? 'Ya' : 'Tidak',
        'TKU Bantu': item.bantu ? 'Ya' : 'Tidak',
        'TKU Tata': item.tata ? 'Ya' : 'Tidak',
        'Tanggal Mula': item.date_mula ? new Date(item.date_mula).toLocaleDateString() : '',
        'Tanggal Bantu': item.date_bantu ? new Date(item.date_bantu).toLocaleDateString() : '',
        'Tanggal Tata': item.date_tata ? new Date(item.date_tata).toLocaleDateString() : '',
        'SK Mula': item.sk_mula || '',
        'SK Bantu': item.sk_bantu || '',
        'SK Tata': item.sk_tata || '',
      }));

      const worksheet = utils.json_to_sheet(rows);
      const workbook = utils.book_new();

      utils.book_append_sheet(workbook, worksheet, 'RekapData');

      // Tambahkan header manual di baris A1
      utils.sheet_add_aoa(worksheet, [['Nama', 'NTA', 'Lembaga', 'TKU Mula', 'TKU Bantu', 'TKU Tata', 'Tanggal Mula', 'Tanggal Bantu', 'Tanggal Tata', 'SK Mula', 'SK Bantu', 'SK Tata']], { origin: 'A1' });

      worksheet['!cols'] = [
        { wch: 20 }, // Nama
        { wch: 15 }, // NTA
        { wch: 30 }, // Lembaga
        { wch: 10 }, // TKU Mula
        { wch: 10 }, // TKU Bantu
        { wch: 10 }, // TKU Tata
        { wch: 15 }, // Tanggal Mula
        { wch: 15 }, // Tanggal Bantu
        { wch: 15 }, // Tanggal Tata
        { wch: 25 }, // SK Mula
        { wch: 25 }, // SK Bantu
        { wch: 25 }, // SK Tata
      ];

      writeFile(workbook, 'RekapTKU.xlsx', { compression: true });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Gagal mengunduh template. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    if (activeTab) {
      if (activeTab === 'mula') {
        setParams((prev) => ({ ...prev, page: 1 }));
        refetchMula();
      } else if (activeTab === 'bantu') {
        setParams((prev) => ({ ...prev, page: 1 }));
        refetchBantu();
      } else if (activeTab === 'tata') {
        setParams((prev) => ({ ...prev, page: 1 }));
        refetchTata();
      }
    }
  }, [activeTab]);

  useEffect(() => {
    setButtonAction(
      <div className="flex items-center gap-2">
        <Button className="bg-primary-600 hover:bg-primary-700" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Mula
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
  const columnsMula: ColumnDef<TkuData>[] = [
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
      header: 'SK Mula',
      accessor: 'sk_mula',
    },
    {
      header: 'Tanggal Mula',
      accessor: 'date_mula',
      cell: (item) => (item.date_mula ? moment(item.date_mula).format('DD/MM/YYYY') : '-'),
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (item) => (
        <div className="flex gap-4 items-center">
          <Button disabled={item.bantu} onClick={() => handleUpdate(item)} size="icon" className="size-8 bg-blue-50 hover:bg-blue-100 text-blue-600">
            <CircleCheckBig className="h-4 w-4" />
          </Button>
          <Button disabled={item.bantu} onClick={() => handleDelete(item)} size="icon" className="size-8 bg-red-50 hover:bg-red-100 text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const columnsBantu: ColumnDef<TkuData>[] = [
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
      header: 'SK Bantu',
      accessor: 'sk_bantu',
    },
    {
      header: 'Tanggal Bantu',
      accessor: 'date_bantu',
      cell: (item) => (item.date_bantu ? moment(item.date_bantu).format('DD/MM/YYYY') : '-'),
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (item) => (
        <div className="flex gap-4 items-center">
          <Button disabled={item.tata} onClick={() => handleUpdate(item)} size="icon" className="size-8 bg-blue-50 hover:bg-blue-100 text-blue-600">
            <CircleCheckBig className="h-4 w-4" />
          </Button>
          <Button disabled={item.tata} onClick={() => handleDelete(item)} size="icon" className="size-8 bg-red-50 hover:bg-red-100 text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const columnsTata: ColumnDef<TkuData>[] = [
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
      header: 'SK Tata',
      accessor: 'sk_tata',
    },
    {
      header: 'Tanggal Tata',
      accessor: 'date_tata',
      cell: (item) => (item.date_tata ? moment(item.date_tata).format('DD/MM/YYYY') : '-'),
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
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Mula</CardTitle>
            <div className="p-2 rounded-full bg-blue-500">
              <Trophy className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{isPendingSummary ? '-' : summary?.total_mula ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Bantu</CardTitle>
            <div className="p-2 rounded-full bg-green-500">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{isPendingSummary ? '-' : summary?.total_bantu ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Tata</CardTitle>
            <div className="p-2 rounded-full bg-yellow-500">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{isPendingSummary ? '-' : summary?.total_tata ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Mula, Bantu, Tata */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full mt-6">
        <TabsList className="mb-4 bg-gray-200">
          <TabsTrigger className="w-20" value="mula">
            Mula
          </TabsTrigger>
          <TabsTrigger className="w-20" value="bantu">
            Bantu
          </TabsTrigger>
          <TabsTrigger className="w-20" value="tata">
            Tata
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mula">
          <Card>
            <CardHeader>
              <CardTitle>Daftar TKU Mula</CardTitle>
              <CardAction>
                <div className="relative sm:max-w-xs w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari berdasarkan nama..." className="pl-8" value={params.search} onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))} />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columnsMula}
                data={dataMula?.data}
                isLoading={isPendingMula}
                keyField="_id"
                emptyMessage={{
                  title: 'Data TKU Mula tidak ditemukan',
                  description: 'Tambahkan data TKU Mula anggota',
                  buttonText: 'Tambah TKU Mula',
                  icon: Plus,
                  onButtonClick: () => setShowAddModal(true),
                }}
              />
              <CustomPagination
                currentPage={params.page}
                totalPages={dataMula?.pagination?.total_pages}
                onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
                itemsPerPage={params.limit}
                onItemsPerPageChange={(limit) => setParams((prev) => ({ ...prev, limit, page: 1 }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="bantu">
          <Card>
            <CardHeader>
              <CardTitle>Daftar TKU Bantu</CardTitle>
              <CardAction>
                <div className="relative sm:max-w-xs w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari berdasarkan nama..." className="pl-8" value={params.search} onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))} />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columnsBantu}
                data={dataBantu?.data}
                isLoading={isPendingBantu}
                keyField="_id"
                emptyMessage={{
                  title: 'Data TKU Bantu tidak ditemukan',
                  description: 'Update data dari Mula untuk menambahkan data Bantu',
                  icon: FileText,
                }}
              />
              <CustomPagination
                currentPage={params.page}
                totalPages={dataBantu?.pagination?.total_pages}
                onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
                itemsPerPage={params.limit}
                onItemsPerPageChange={(limit) => setParams((prev) => ({ ...prev, limit, page: 1 }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tata">
          <Card>
            <CardHeader>
              <CardTitle>Daftar TKU Tata</CardTitle>
              <CardAction>
                <div className="relative sm:max-w-xs w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Cari berdasarkan nama..." className="pl-8" value={params.search} onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))} />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columnsTata}
                data={dataTata?.data}
                isLoading={isPendingTata}
                keyField="_id"
                emptyMessage={{
                  title: 'Data TKU Tata tidak ditemukan',
                  description: 'Update data dari Bantu untuk menambahkan data Tata',
                  icon: FileText,
                }}
              />
              <CustomPagination
                currentPage={params.page}
                totalPages={dataTata?.pagination?.total_pages}
                onPageChange={(page) => setParams((prev) => ({ ...prev, page }))}
                itemsPerPage={params.limit}
                onItemsPerPageChange={(limit) => setParams((prev) => ({ ...prev, limit, page: 1 }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteConfirmation
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Data TKU"
        description="Apakah Anda yakin ingin menghapus data TKU ini? Aksi ini tidak dapat dibatalkan."
        itemName={dataDelete?.member?.name || ''}
        isLoading={activeTab === 'mula' ? deleteDataMula.isPending : activeTab === 'bantu' ? deleteDataBantu.isPending : deleteDataTata.isPending}
      />

      <UpdateConfirmation
        isOpen={updateConfirmModal}
        onClose={() => setUpdateConfirmModal(false)}
        onConfirm={handleConfirmUpdate}
        title="Update Data TKU"
        description="Apakah Anda yakin ingin mengupdate data TKU ini? Aksi ini tidak dapat dibatalkan."
        itemName={updateData?.member?.name || ''}
        isLoading={createDataBantu.isPending}
      />

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Tambah Data TKU</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedMemberId) {
                handleSubmit({ member_id: selectedMemberId });
                setShowAddModal(false);
                setSelectedMemberId('');
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="member_id">Pilih Anggota</Label>
              <SearchableSelect
                value={selectedMemberId ?? ''}
                options={memberOptions?.data}
                isLoading={isPendingMember}
                placeholder="Pilih anggota"
                searchValue={paramsMember.search}
                onValueChange={(value) => setSelectedMemberId(value)}
                onSearchChange={(value) => setParamsMember((prev) => ({ ...prev, search: value }))}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white" disabled={!selectedMemberId}>
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

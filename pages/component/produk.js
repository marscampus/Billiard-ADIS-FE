import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { formatRibuan, getDBConfig } from '../../component/GeneralFunction/GeneralFunction';
import postData from '../../lib/Axios';

export default function Produk({ produkDialog, setProdukDialog, btnProduk, handleProdukData, handleProdukData2, handleProduk }) {
    const apiEndPointGetProduk = '/api/produk/get-filter';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingProduk, setLoadingProduk] = useState(false);
    const [produkTabel, setProdukTabel] = useState(null);
    const [produkTabelFilt, setProdukTabelFilt] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const op = useRef(null);
    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    const apiEndPointGetAllConfig = '/api/info_kasir/get_alldbconfig';
    const [msPPN, setMsPPN] = useState(0);
    useEffect(() => {
        // Cek apakah dialog produk ditampilkan dan tombol produk diklik
        const fetchConfig = async () => {
            try {
                const vaTable = await getDBConfig('ppn');
                const json = vaTable;
                setMsPPN(json.ppn); // Mengubah persentase ke desimal
            } catch (error) {
                console.error('Error while loading data:', error);
                const e = error?.response?.data || error;
                console.log(e?.message || 'Terjadi Kesalahan');
            }
        };
        if (produkDialog && btnProduk) {
            toggleProduk();
            fetchConfig();
        }
    }, [produkDialog, btnProduk, lazyState]);

    useEffect(() => {
        setProdukTabelFilt(produkTabel);
    }, [produkTabel, lazyState]);
    // -----------------------------------------------------------------------------------------------------------------< Produk >
    const dropdownValues = [
        { name: 'Kode', label: 'st.Kode' },
        { name: 'Barcode', label: 'st.Kode_Toko' },
        { name: 'Nama', label: 'st.Nama' }
    ];
    const [timer, setTimer] = useState(null);

    const headerProduk = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    {/* <Calendar name="startDate" value={startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={refresh}/> */}
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );
    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = produkTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.KODE_TOKO) || x.test(d.NAMA) || x.test(d.Penerimaan) || x.test(d.Pengeluaran) || x.test(d.Keterangan) : []));
            setSearch(searchVal);
        }

        setProdukTabelFilt(filtered);
    };
    const toggleProduk = async (event) => {
        setLoadingProduk(true);
        // setProdukDialog(true);
        try {
            const vaTable = await postData(apiEndPointGetProduk, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setProdukTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            console.log(e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingProduk(false);
        }
        setLoadingProduk(false);
    };

    const onRowSelectProduk = (event) => {
        const selectedKode = event.data.KODE_TOKO;
        const selectedProduk = produkTabel.find((produk) => produk.KODE_TOKO === selectedKode);
        const produkData = {
            KODE: selectedProduk.KODE,
            BKP: selectedProduk.BKP,
            KODE_TOKO: selectedProduk.KODE_TOKO,
            NAMA: selectedProduk.NAMA,
            GOLONGAN: selectedProduk.GOLONGAN,
            GUDANG: selectedProduk.GUDANG,
            SATUAN: selectedProduk.SATUAN,
            HARGABELI: selectedProduk.HARGABELI,
            HJ: selectedProduk.HJ,
            TGLEXP: selectedProduk.TGLEXP,
            DISCOUNT: selectedProduk.DISCOUNT,
            PAJAK: selectedProduk.PAJAK,
            TERIMA: selectedProduk.TERIMA,
            TGLPERUBAHANHJ: selectedProduk.TGLPERUBAHANHJ,
            DISKONPERIODE: selectedProduk.DISKONPERIODE,
            KUOTADISKONTERJUAL: selectedProduk.KUOTADISKONTERJUAL,
            SISAKUOTADISKON: selectedProduk.SISAKUOTADISKON,
            SISASTOCKBARANG: selectedProduk.SISASTOCKBARANG
        };

        if (handleProdukData) {
            handleProdukData(produkData);
        } else if (handleProdukData2) {
            handleProdukData2(produkData.KODE_TOKO, produkData.NAMA);
        } else {
            handleProduk(produkData);
        }
        setProdukDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Produk  */}
                <Dialog visible={produkDialog} style={{ width: '75%' }} header="Produk" modal className="p-fluid" onHide={() => setProdukDialog(false)}>
                    <DataTable
                        value={produkTabelFilt}
                        // globalFilter={globalFilter}
                        filters={lazyState.filters}
                        header={headerProduk}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                        paginator
                        paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords} // Total number of records
                        size="small"
                        loading={loadingProduk}
                        emptyMessage="Data Kosong"
                        onRowSelect={onRowSelectProduk}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                        onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                    >
                        <Column field="KODE" header="KODE"></Column>
                        <Column field="KODE_TOKO" header="BARCODE"></Column>
                        <Column field="NAMA" header="NAMA"></Column>
                        <Column field="DISCOUNT" header="DISC %" body={(rowData) => (rowData.DISCOUNT === 0 ? '-' : rowData.DISCOUNT)} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column field="BKP" header="BKP" body={(rowData) => (rowData.BKP === '1' ? msPPN : '-')} bodyStyle={{ textAlign: 'center' }} />
                        <Column field="HJ" bodyStyle={{ textAlign: 'right' }} body={(rowData) => formatRibuan(rowData.HJ)} header="HARGA"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}

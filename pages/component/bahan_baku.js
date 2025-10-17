
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { formatRibuan } from '../../component/GeneralFunction/GeneralFunction';
import postData from '../../lib/Axios';

export default function BahanBaku({ bahanBakuDialog, setBahanBakuDialog, btnBahanBakuDialog, handleBahanBakuData, handleBahanBakuData2, handleBahanBaku }) {
    const apiEndPointGetProduk = '/api/bahan-baku/get-filter';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingProduk, setLoadingProduk] = useState(false);
    const [produkTabel, setProdukTabel] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
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
                const vaTable = await postData(apiEndPointGetAllConfig);
                const json = vaTable.data;
                setMsPPN(json.data.msPPN); // Mengubah persentase ke desimal
            } catch (error) {
                console.error('Error while loading data:', error);
            }
        };
        if (bahanBakuDialog && btnBahanBakuDialog) {
            toggleProduk();
            fetchConfig();
        }
    }, [bahanBakuDialog, btnBahanBakuDialog, lazyState]);
    // -----------------------------------------------------------------------------------------------------------------< Produk >
    const dropdownValues = [
        { name: 'Kode', label: 'st.Kode' },
        { name: 'Barcode', label: 'st.Kode_Toko' },
        { name: 'Nama', label: 'st.Nama' }
    ];
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            console.log('_lazyState[]', _lazyState['filters']);

            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.label != null) {
                _lazyState['filters'][defaultOption.label] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const headerProduk = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih Kolom" />
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );
    const toggleProduk = async (event) => {
        setLoadingProduk(true);
        // setBahanBakuDialog(true);
        try {
            const vaTable = await postData(apiEndPointGetProduk, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setProdukTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
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
            KUOTADISKONTERJUAL: selectedProduk.KUOTADISKONTERJUAL,
            SISAKUOTADISKON: selectedProduk.SISAKUOTADISKON,
            SISASTOCKBARANG: selectedProduk.SISASTOCKBARANG
        };

        if (handleBahanBakuData) {
            handleBahanBakuData(produkData);
        }
        else if (handleBahanBakuData2) {
            handleBahanBakuData2(produkData.KODE_TOKO, produkData.NAMA);
        } else {
            handleBahanBaku(produkData);
        }
        setBahanBakuDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Produk  */}
                <Dialog visible={bahanBakuDialog} style={{ width: '75%' }} header="Produk" modal className="p-fluid" onHide={() => setBahanBakuDialog(false)}>
                    <DataTable
                        value={produkTabel}
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

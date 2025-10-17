import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../lib/Axios';

export default function Supplier({ supplierDialog, setSupplierDialog, btnSupplier, handleSupplierData }) {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetSupplier = '/api/supplier/get';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingSupplier, setLoadingSupplier] = useState(false);
    const [supplierTabel, setSupplierTabel] = useState([]);
    const [supplierTabelFilt, setSupplierTabelFilt] = useState([]);
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
    };

    useEffect(() => {
        if (supplierDialog && btnSupplier) {
            toggleSupplier();
        }
    }, [supplierDialog, btnSupplier, lazyState]);
    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'NAMA', label: 'NAMA' }
    ];
    const [timer, setTimer] = useState(null);
    // const inputChanged = (e) => {
    //     clearTimeout(timer);

    //     const newTimer = setTimeout(() => {
    //         let _lazyState = { ...lazyState };
    //         console.log('_lazyState[]', _lazyState['filters']);

    //         _lazyState['filters'] = { ...lazyState.filters };
    //         if (defaultOption != null && defaultOption.label != null) {
    //             _lazyState['filters'][defaultOption.label] = e;
    //         }
    //         onPage(_lazyState);
    //     }, 500);

    //     setTimer(newTimer);
    // };

    useEffect(() => {
        setSupplierTabelFilt(supplierTabel);
    }, [supplierTabel, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = supplierTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.KODE_TOKO) || x.test(d.NAMA) || x.test(d.Penerimaan) || x.test(d.Pengeluaran) || x.test(d.Keterangan) : []));
            setSearch(searchVal);
        }

        setSupplierTabelFilt(filtered);
    };

    const headerSupplier = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                &nbsp; */}
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );
    const toggleSupplier = async (event) => {
        setLoadingSupplier(true);
        try {
            const vaTable = await postData(apiEndPointGetSupplier, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setSupplierTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingSupplier(false);
        }
        setLoadingSupplier(false);
    };

    const onRowSelectSupplier = (event) => {
        const selectedKode = event.data.KODE;
        const selectedSupplier = supplierTabel.find((supplier) => supplier.KODE === selectedKode);
        handleSupplierData(selectedSupplier.KODE, selectedSupplier.NAMA, selectedSupplier.ALAMAT);
        setSupplierDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Supplier  */}
                <Dialog visible={supplierDialog} header="Supplier" modal className="p-fluid" onHide={() => setSupplierDialog(false)}>
                    <DataTable
                        value={supplierTabelFilt}
                        // globalFilter={globalFilter}
                        filters={lazyState.filters}
                        header={headerSupplier}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                        paginator
                        paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords} // Total number of records
                        size="small"
                        loading={loadingSupplier}
                        emptyMessage="Data Kosong"
                        onRowSelect={onRowSelectSupplier}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                        onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="ALAMAT" header="ALAMAT"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}

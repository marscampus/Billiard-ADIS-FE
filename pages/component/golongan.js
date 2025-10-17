import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../lib/Axios';

export default function Golongan({ golonganDialog, setGolonganDialog, btnGolongan, handleGolonganData }) {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetGolongan = '/api/golongan_stock/get';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingGolongan, setLoadingGolongan] = useState(false);
    const [golonganTabel, setGolonganTabel] = useState(null);
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

    useEffect(() => {
        if (golonganDialog && btnGolongan) {
            toggleGolongan();
        }
    }, [golonganDialog, btnGolongan, lazyState]);

    // -----------------------------------------------------------------------------------------------------------------< Golongan >
    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'KETERANGAN', label: 'KETERANGAN' }
    ];
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            console.log('_lazyState[]', _lazyState['filters']);

            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters

            if (defaultOption != null && defaultOption.label != null) {
                _lazyState['filters'][defaultOption.label] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const headerGolongan = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );
    const toggleGolongan = async (event) => {
        setLoadingGolongan(true);

        try {
            const vaTable = await postData(apiEndPointGetGolongan, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setGolonganTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoadingGolongan(false);
        }
        setLoadingGolongan(false);
    };

    const onRowSelectGolongan = (event) => {
        const selectedKode = event.data.KODE;
        const selectedGolongan = golonganTabel.find((golongan) => golongan.KODE === selectedKode);
        handleGolonganData(selectedGolongan.KODE, selectedGolongan.KETERANGAN);
        setGolonganDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog Golongan  */}
                <Dialog visible={golonganDialog} header="Golongan Stock" modal className="p-fluid" onHide={() => setGolonganDialog(false)}>
                    <DataTable
                        value={golonganTabel}
                        // globalFilter={globalFilter}
                        filters={lazyState.filters}
                        header={headerGolongan}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                        paginator
                        paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords} // Total number of records
                        size="small"
                        loading={loadingGolongan}
                        emptyMessage="Data Kosong"
                        onRowSelect={onRowSelectGolongan}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                        onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { TabPanel, TabView } from 'primereact/tabview';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import TabelSkaleton from '../../component/tabel/skaleton';
import postData from '../../lib/Axios';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';

export default function RekeningCOA({ rekeningDialog, setRekeningDialog, handleRekeningData }) {
    const apiEndPointGetRekening = '/api/rekening/get';

    const toast = useRef(null);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [dataRekening, setDataRekening] = useState({
        data: [],
        load: false,
        filterValue: '',
        filteredData: []
    });
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {
            kode: 1,
            search: ''
        }
    });

    const onPage = (event) => {
        // Set lazyState from event
        setlazyState(event);

        // Ensure filters remain as strings if they are objects
        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        // Set first and rows for pagination
        setFirst(event.first);
        setRows(event.rows);
        // loadLazyData();
    };

    //  Yang Handle Toast
    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const loadLazyData = async () => {
        setDataRekening((prev) => ({ ...prev, load: true }));
        try {
            const res = await postData(apiEndPointGetRekening, lazyState);
            setDataRekening((prev) => ({ ...prev, data: res.data.data, load: false }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
            setDataRekening((prev) => ({ ...prev, data: [], load: false }));
        }
    };

    useEffect(() => {
        if (rekeningDialog) {
            loadLazyData();
        }
    }, [rekeningDialog, activeIndex]);

    const onRowSelect = (event) => {
        const selectedKode = event.data;
        handleRekeningData(selectedKode.kode, selectedKode.keterangan, selectedKode.jenis_rekening);
        setRekeningDialog(false);
    };

    // Yang Handle Search
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup"></div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search..." value={dataRekening.filterValue} onChange={(e) => filterSearch(e.target.value)} />
                </span>
            </div>
        </div>
    );

    const filterSearch = (searchVal) => {
        const regex = searchVal ? new RegExp(searchVal, 'i') : null;

        // Jika tidak ada teks pencarian, kembalikan data asli
        const filtered = !searchVal
            ? dataRekening.data
            : dataRekening.data.map((item) => ({
                  ...item,
                  detail: regex ? item.detail.filter((k) => regex.test(k.kode) || regex.test(k.keterangan)) : item.detail
              }));

        setDataRekening((prev) => ({
            ...prev,
            filteredData: filtered,
            filterValue: searchVal
        }));
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <Toast ref={toast}></Toast>
                {/* Dialog Rekening  */}
                <Dialog visible={rekeningDialog} style={{ width: '50%' }} header="Rekening" modal className="p-fluid" onHide={() => setRekeningDialog(false)}>
                    <TabView>
                        {(dataRekening.filterValue ? dataRekening.filteredData : dataRekening.data).map((item, index) => {
                            return (
                                <TabPanel key={index} header={item.tipe_rekening}>
                                    <DataTable
                                        value={item.detail}
                                        filters={lazyState.filters}
                                        header={header}
                                        first={first}
                                        rows={rows}
                                        onPage={onPage}
                                        paginator
                                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                        totalRecords={totalRecords}
                                        size="small"
                                        onRowSelect={onRowSelect}
                                        selectionMode="single"
                                        loading={loading}
                                        className="datatable-responsive"
                                        emptyMessage="Data Kosong"
                                        onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                                    >
                                        <Column headerStyle={{ textAlign: 'center' }} field="kode" header="KODE"></Column>
                                        <Column headerStyle={{ textAlign: 'center' }} field="keterangan" header="KETERANGAN"></Column>
                                        <Column headerStyle={{ textAlign: 'center' }} field="jenis_rekening" header="JENIS REKENING" body={(rowData) => (rowData.jenis_rekening === 'I' ? 'Induk' : 'Detail')}></Column>
                                    </DataTable>
                                </TabPanel>
                            );
                        })}
                    </TabView>
                </Dialog>
            </div>
        </div>
    );
}

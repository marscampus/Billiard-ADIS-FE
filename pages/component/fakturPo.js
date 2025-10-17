import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import { formatDateTable } from '../../component/GeneralFunction/GeneralFunction';
import postData from '../../lib/Axios';

export default function FakturPo({ fakturPoDialog, setFakturPoDialog, btnFakturPo, handleFakturPoData }) {
    const apiEndPointGetFakturPo = '/api/pembelian/get_fakturpo';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fakturPoTabel, setFakturPoTabel] = useState([]);
    const [defaultOption, setDropdownValue] = useState(null);
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
        if (fakturPoDialog && btnFakturPo) {
            toggleFakturPo();
        }
    }, [fakturPoDialog, btnFakturPo, lazyState]);

    // -----------------------------------------------------------------------------------------------------------------< FakturPo >
    const dropdownValues = [
        { name: 'FAKTUR', label: 'FAKTUR' },
        { name: 'SUPPLIER', label: 'KODE SUPPLIER' }
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
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const headerFakturPo = (
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
    const toggleFakturPo = async (event) => {
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGetFakturPo, lazyState);
            const json = vaTable.data;
            // setTotalRecords(json.total);
            setFakturPoTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };

    const onRowSelectFakturPo = (event) => {
        handleFakturPoData(event.data);
        setFakturPoDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog FakturPo  */}
                <Dialog visible={fakturPoDialog} style={{ width: '75%' }} header="Faktur Purchase Order" modal className="p-fluid" onHide={() => setFakturPoDialog(false)}>
                    <DataTable
                        size="small"
                        value={fakturPoTabel}
                        lazy
                        dataKey="FAKTUR"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                        onRowSelect={onRowSelectFakturPo}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageRedatart RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        filters={lazyState.filters}
                        // header={headerFakturPo}
                        emptyMessage="Data Kosong"
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="faktur" header="FAKTUR"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="nama" header="SUPPLIER"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="total" header="TOTAL" body={(rowData) => (rowData.total ? `${rowData.total.toLocaleString()}` : '0')}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="tgl" header="TGL" body={(rowData) => formatDateTable(rowData.tgl)}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="jthtmp" header="JATUH TEMPO" body={(rowData) => formatDateTable(rowData.jthtmp)}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="keterangan" header="KETERANGAN"></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="pobrg"
                            header="PO BRG"
                            body={(rowData) => {
                                const value = rowData.pobrg ? parseInt(rowData.pobrg).toLocaleString() : 0;
                                return value;
                            }}
                        ></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="terimabrg"
                            header="BRG DITERIMA"
                            body={(rowData) => {
                                const value = rowData.terimabrg ? parseInt(rowData.terimabrg).toLocaleString() : 0;
                                return value;
                            }}
                        ></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}

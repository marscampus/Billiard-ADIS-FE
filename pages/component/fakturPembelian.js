import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import postData from '../../lib/Axios';

export default function FakturPembelian({ fakturPembelianDialog, setFakturPembelianDialog, btnFakturPembelian, handleFakturPembelianData }) {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetFakturPembelian = '/api/rtnpembelian_faktur/get_fakturpembelian';
    // const apiEndPointGetFakturPembelian = "/api/pembelian/get";

    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [fakturPembelianTabel, setFakturPembelianTabel] = useState(null);
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

    // useEffect(() => {
    //     loadLazyData();
    // }, [lazyState]);

    // useEffect(() => {
    //     toggleFakturPembelian();
    // }, [btnFakturPembelian]);

    useEffect(() => {
        // Cek apakah dialog produk ditampilkan dan tombol produk diklik
        if (fakturPembelianDialog && btnFakturPembelian) {
            toggleFakturPembelian();
        }
    }, [fakturPembelianDialog, btnFakturPembelian, lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetFakturPembelian
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetFakturPembelian, lazyState);
            const json = vaTable.data;
            console.log('json', json);
            setTotalRecords(json.total);
            setFakturPembelianTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< FakturPembelian >
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
    const headerFakturPembelian = (
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
    const toggleFakturPembelian = async (event) => {
        setLoading(true);
        // setFakturPembelianDialog(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetFakturPembelian
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetFakturPembelian, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setFakturPembelianTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };
    const onRowSelectFakturPembelian = (event) => {
        const selectedKode = event.data.FAKTUR;
        const selectedFakturPembelian = fakturPembelianTabel.find((fakturPembelian) => fakturPembelian.FAKTUR === selectedKode);
        handleFakturPembelianData(selectedFakturPembelian.FAKTUR);
        setFakturPembelianDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog FakturPembelian  */}
                <Dialog visible={fakturPembelianDialog} style={{ width: '75%' }} header="FakturPembelian" modal className="p-fluid" onHide={() => setFakturPembelianDialog(false)}>
                    <DataTable
                        // ref={dt}
                        size="small"
                        value={fakturPembelianTabel}
                        lazy
                        dataKey="FAKTUR"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loading}
                        onRowSelect={onRowSelectFakturPembelian}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageRedatart RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        filters={lazyState.filters}
                        header={headerFakturPembelian}
                        emptyMessage="Data Kosong"
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="FAKTUR" header="FAKTUR PEMBELIAN"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="FAKTURPO" header="FAKTUR PO"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="SUPPLIER" header="SUPPLIER"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TOTAL" header="TOTAL"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TGL"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="JTHTMP" header="JATUH TEMPO"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TERIMABRG" header="TERIMA BARANG"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="POBRG" header="PO BARANG"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="BRGRETUR" header="BARANG RETUR"></Column>
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}

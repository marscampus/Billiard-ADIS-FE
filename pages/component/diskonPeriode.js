import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import { formatRibuan } from '../../component/GeneralFunction/GeneralFunction';
import postData from '../../lib/Axios';

export default function DiskonPeriode({ diskonPeriodeDialog, setDiskonPeriodeDialog, btnDiskonPeriode, handleDiskonPeriodeData }) {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetDiskonPeriode = '/api/diskon_periode/get_cetak';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingDiskonPeriode, setLoadingDiskonPeriode] = useState(false);
    const [diskonPeriodeTabel, setDiskonPeriodeTabel] = useState(null);
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

    useEffect(() => {
        if (diskonPeriodeDialog && btnDiskonPeriode) {
            toggleDiskonPeriode();
        }
    }, [diskonPeriodeDialog, btnDiskonPeriode, lazyState]);

    // -----------------------------------------------------------------------------------------------------------------< DiskonPeriode >
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
    const headerDiskonPeriode = (
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
    const toggleDiskonPeriode = async (event) => {
        setLoadingDiskonPeriode(true);
        // setDiskonPeriodeDialog(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetDiskonPeriode
            };
            // const vaTable = await axios.post(apiDirPath, lazyState, { headers: header });
            const vaTable = await postData(apiEndPointGetDiskonPeriode, lazyState);
            const json = vaTable.data;
            console.log('em', json);
            setDiskonPeriodeTabel(json.data);
            setTotalRecords(json.total);
        } catch (error) {
            const e = error?.response?.data || error;
            console.error(e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingDiskonPeriode(false);
        }
    };
    const onRowSelectDiskonPeriode = (event) => {
        const selectedKode = event.data.KODE;
        const selectedDiskonPeriode = diskonPeriodeTabel.find((diskonPeriode) => diskonPeriode.KODE === selectedKode);
        handleDiskonPeriodeData(selectedDiskonPeriode.KODE, selectedDiskonPeriode.KETERANGAN);
        setDiskonPeriodeDialog(false);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* Dialog DiskonPeriode  */}
                <Dialog visible={diskonPeriodeDialog} header="Diskon Periode" modal className="p-fluid" onHide={() => setDiskonPeriodeDialog(false)}>
                    <DataTable
                        size="small"
                        value={diskonPeriodeTabel}
                        lazy
                        dataKey="KODE"
                        paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        loading={loadingDiskonPeriode}
                        header={headerDiskonPeriode}
                        onRowSelect={onRowSelectDiskonPeriode}
                        selectionMode="single" // Memungkinkan pemilihan satu baris
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODEDISKON" header="KODEDISKON"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL_MULAI" header="TGL_MULAI"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL_AKHIR" header="TGL_AKHIR"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="HJ_AWAL" bodyStyle={{ textAlign: 'right' }} body={(rowData) => formatRibuan(rowData.HJ_AWAL)} header="HJ_AWAL"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="HJ_DISKON" bodyStyle={{ textAlign: 'right' }} body={(rowData) => formatRibuan(rowData.HJ_DISKON)} header="HJ_DISKON"></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} field="DISKON" header="DISKON"></Column> */}
                        <Column headerStyle={{ textAlign: 'center' }} field="KUOTA_QTY" header="KUOTA_QTY"></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} field="STATUS" header="STATUS"></Column> */}
                        {/* <Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA"></Column> */}
                    </DataTable>
                </Dialog>
            </div>
        </div>
    );
}

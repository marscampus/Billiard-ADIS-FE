/**
     * Nama Program: GODONG POS - Kasir Retur
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 8 Jan 2024
     * Versi: 1.0.0

    Catatan:
    - Versi 1.0.0 mencakup fungsionalitas Retur Kasir
    - Read
*/
import axios from 'axios';
import getConfig from 'next/config';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { RadioButton } from 'primereact/radiobutton';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { TabView, TabPanel } from 'primereact/tabview';
import { Skeleton } from 'primereact/skeleton';
// import TabelSkaleton from '../../../../component/tabel/skaleton';
import { Paginator } from 'primereact/paginator';
import { BreadCrumb } from 'primereact/breadcrumb';
import TabelSkaleton from '../../component/tabel/skaleton';
import { Dropdown } from 'primereact/dropdown';
import { useRouter } from 'next/router';
import { Checkbox } from 'primereact/checkbox';
import { formatDateSave, getYMD, formatRibuan, showError } from '../../component/GeneralFunction/GeneralFunction';

import postData from '../../lib/Axios';
import { getSessionServerSide } from '../../utilities/servertool';
export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/kasir');
    if (sessionData?.redirect) {
        return sessionData;
    }
    // const { id } = context.params;
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};
export default function Retur({ returDialog, setReturDialog, selectedSesi, btnRetur }) {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetDataFaktur = '/api/retur/get_faktur';
    const apiEndPointGetDetailFaktur = '/api/retur/cari_faktur';
    const apiEndPointStore = '/api/retur/store';
    const router = useRouter();
    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [sesi, setSesi] = useState([]);
    // const [checkboxValue, setCheckboxValue] = useState(['Tunai']);

    const pajakRef = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [{ field: 'Loading..', header: 'Loading..' }];

    const op = useRef(null);
    const onPage = (event) => {
        setlazyState(event);
    };
    useEffect(() => {
        if (returDialog) {
            toggleDataFaktur();
        }
    }, [btnRetur]);

    useEffect(() => {
        if (returDialog) {
            loadLazyData();
        }
    }, [lazyState]);

    // useEffect(() => {
    //     loadLazyData();
    //     toggleDataFaktur();
    // }, [btnRetur, lazyState]); // Menggunakan btnRetur sebagai dependensi useEffect

    const loadLazyData = async () => {
        let requestBody = {
            KODESESI: selectedSesi?.SESIJUAL || null
        };
        // return;
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGetDataFaktur, requestBody);
            const json = vaTable.data;
            console.log('hshssa', json);
            setDataFaktur(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------------------------------------------< Pencarian Faktur >

    const [inputValue, setInputValue] = useState('');
    const [timer, setTimer] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);

    const dropdownValues = [{ name: 'FAKTUR', label: 'FAKTUR' }];

    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            // return console.log('_lazyState[]', _lazyState['filters']);

            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            // if (defaultOption != null && defaultOption.name != null) {
            // _lazyState["filters"][defaultOption.name] = e;
            _lazyState['filters']['FAKTUR'] = e;
            // }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" /> */}
                <InputText placeholder="FAKTUR" readOnly style={{ width: '70px' }} />
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );

    // -------------------------------------------------------------------------------------------------------< API DataFaktur >
    const [selectedDataFaktur, setSelectedDataFaktur] = useState(null);
    const [dataFaktur, setDataFaktur] = useState([]);
    const [detailFaktur, setDetailFaktur] = useState([]);
    const [totPenjualan, setTotPenjualan] = useState([]);
    const [retur, setRetur] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailFakturDialog, setDetailFakturDialog] = useState(false);

    const toggleDataFaktur = async () => {
        if (selectedSesi) {
            setLoading(true);

            let requestBody = {
                KODESESI: selectedSesi.SESIJUAL
            };
            setSesi(selectedSesi.SESIJUAL);
            // return console.log(requestBody);
            try {
                const header = {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'X-ENDPOINT': apiEndPointGetDataFaktur
                };
                // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
                const vaTable = await postData(apiEndPointGetDataFaktur, requestBody);
                const json = vaTable.data;
                // return;\
                setDataFaktur(json.penjualan);
            } catch (error) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            } finally {
                setLoading(false);
            }
        }
    };

    const onRowSelectDataFaktur = async (event) => {
        const selectedKode = event.data.FAKTUR;
        const selectedDataFaktur = dataFaktur.find((dataFaktur) => dataFaktur.FAKTUR === selectedKode);

        if (selectedDataFaktur) {
            setDetailFakturDialog(true);
            setLoadingDetail(true);
            let requestBody = {
                FAKTUR: selectedDataFaktur.FAKTUR
            };
            try {
                const vaTable = await postData(apiEndPointGetDetailFaktur, requestBody);
                const json = vaTable.data;
                console.log('json.penjualan', json.penjualan);
                // return;
                setDetailFaktur(json.penjualan);
                setTotPenjualan(json.totPenjualan);
            } catch (error) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            } finally {
                setLoadingDetail(false);
            }
        }
        return;
    };

    const onHideDialog = () => {
        setReturDialog(false);
    };

    const saveRetur = async (event) => {
        let requestBody = {
            Faktur: totPenjualan.FAKTUR,
            KodeSesiRetur: selectedSesi.SESIJUAL
        };
        // return console.log(requestBody);
        try {
            const vaTable = await postData(apiEndPointStore, requestBody);
            const json = vaTable.data;
            // return;
            setClosingDialog(false);
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Retur Berhasil', life: 5000 });
            setDetailFakturDialog(false);
            setReturDialog(false);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    const detailFooter = (
        <>
            <Button label="Retur" className="p-button-primary p-button-lg w-full" onClick={() => setClosingDialog(true)} />
        </>
    );

    const [closingDialog, setClosingDialog] = useState(false);
    const closingDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={() => setClosingDialog(false)} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={saveRetur} />
        </>
    );
    return (
        <div className="grid crud-demo">
            <Toast ref={toast} />
            <div className="col-12">
                <Dialog visible={returDialog} style={{ width: '80%' }} header="RETUR" modal className="p-fluid" onHide={onHideDialog}>
                    <hr />
                    <DataTable
                        size="small"
                        value={dataFaktur}
                        lazy
                        dataKey="KODE"
                        // paginator
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        onRowSelect={onRowSelectDataFaktur}
                        selectionMode="single"
                        header={header}
                        loading={loading}
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="FAKTUR" header="FAKTUR" bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TGL" bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="DISCOUNT" header="DISCOUNT" body={(rowData) => formatRibuan(rowData.DISCOUNT)} bodyStyle={{ textAlign: 'right' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="PAJAK" header="PAJAK" body={(rowData) => formatRibuan(rowData.PAJAK)} bodyStyle={{ textAlign: 'right' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TOTAL" header="TOTAL" body={(rowData) => formatRibuan(rowData.TOTAL)} bodyStyle={{ textAlign: 'right' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="CARABAYAR" header="CARA BAYAR"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TUNAI" header="TUNAI" body={(rowData) => formatRibuan(rowData.TUNAI)} bodyStyle={{ textAlign: 'right' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="EPAYMENT" header="EPAYMENT" body={(rowData) => formatRibuan(rowData.EPAYMENT)} bodyStyle={{ textAlign: 'right' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="BAYARKARTU" header="DEBIT" body={(rowData) => formatRibuan(rowData.BAYARKARTU)} bodyStyle={{ textAlign: 'right' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="USERNAME" header="USERNAME"></Column>
                    </DataTable>
                </Dialog>
                {/* ---------------------------------------------------------------------------------------------------------------------< Detail Faktur > */}
                <Dialog visible={detailFakturDialog} style={{ width: '70%' }} header="DETAIL RETUR" modal footer={detailFooter} className="p-fluid" onHide={() => setDetailFakturDialog(false)}>
                    <hr />
                    {loadingDetail && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                    {!loadingDetail && (
                        <>
                            <div className="grid formgrid">
                                {/* ------------------------------------------------------------------------< Kiri > */}
                                <div className="field col-12 mb-2 lg:col-6">
                                    <div className="grid formgrid">
                                        <div className="field col-12 mb-2 lg:col-4">FAKTUR</div>
                                        <div className="field col-12 mb-2 lg:col-2">
                                            {' '}
                                            <span className="ml-2">:</span>{' '}
                                        </div>
                                        <div className="field col-12 mb-2 lg:col-6">{totPenjualan.FAKTUR}</div>
                                    </div>
                                    <div className="grid formgrid">
                                        <div className="field col-12 mb-2 lg:col-4">TANGGAL</div>
                                        <div className="field col-12 mb-2 lg:col-2">
                                            {' '}
                                            <span className="ml-2">:</span>{' '}
                                        </div>
                                        <div className="field col-12 mb-2 lg:col-6">{totPenjualan.TGL}</div>
                                    </div>
                                    <div className="grid formgrid">
                                        <div className="field col-12 mb-2 lg:col-4">USERNAME</div>
                                        <div className="field col-12 mb-2 lg:col-2">
                                            {' '}
                                            <span className="ml-2">:</span>{' '}
                                        </div>
                                        <div className="field col-12 mb-2 lg:col-6">{totPenjualan.USERNAME}</div>
                                    </div>
                                </div>
                                {/* ---------------------------------------------------------------------------< Kanan > */}
                                <div className="field col-12 mb-2 lg:col-6">
                                    <div className="grid formgrid">
                                        <div className="field col-12 mb-2 lg:col-4">CARA BAYAR</div>
                                        <div className="field col-12 mb-2 lg:col-2">
                                            {' '}
                                            <span className="ml-2">:</span>{' '}
                                        </div>
                                        <div className="field col-12 mb-2 lg:col-6">{totPenjualan.CARABAYAR}</div>
                                    </div>
                                    <div className="grid formgrid">
                                        <div className="field col-12 mb-2 lg:col-4">TOTAL</div>
                                        <div className="field col-12 mb-2 lg:col-2">
                                            {' '}
                                            <span className="ml-2">:</span>{' '}
                                        </div>
                                        <div className="field col-12 mb-2 lg:col-6">{formatRibuan(totPenjualan.TOTAL || 0)}</div>
                                    </div>
                                </div>
                            </div>
                            <DataTable
                                size="small"
                                value={detailFaktur}
                                lazy
                                dataKey="KODE"
                                // paginator
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                scrollable
                                scrollHeight="400px"
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="QTY" header="QTY"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="HARGA" header="HARGA" body={(rowData) => formatRibuan(rowData.HARGA)} bodyStyle={{ textAlign: 'right' }}></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="DISCOUNT" header="DISCOUNT" body={(rowData) => formatRibuan(rowData.DISCOUNT)} bodyStyle={{ textAlign: 'right' }}></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="JUMLAH" header="JUMLAH" body={(rowData) => formatRibuan(rowData.JUMLAH)} bodyStyle={{ textAlign: 'right' }}></Column>
                            </DataTable>
                        </>
                    )}
                </Dialog>
                {/* -----------------------------------------------------------------------------------------< DIALOG VALIDASI CLOSING > */}
                <Dialog visible={closingDialog} header="Confirm" modal footer={closingDialogFooter} onHide={() => setClosingDialog(false)}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>Yakin ingin Retur ?</span>
                    </div>
                </Dialog>
            </div>
        </div>
    );
}

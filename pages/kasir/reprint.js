/**
	 * Nama Program: GODONG POS - Kasir Reprint
	 * Pengembang: Salsabila Emma
	 * Tanggal Pengembangan: 8 Jan 2024
	 * Versi: 1.0.0

	Catatan:
	- Versi 1.0.0 mencakup fungsionalitas Reprint Kasir
	- Read
*/
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
// import TabelSkaleton from '../../../../component/tabel/skaleton';
import { useRouter } from 'next/router';
import { formatRibuan, showError } from '../../component/GeneralFunction/GeneralFunction';
import TabelSkaleton from '../../component/tabel/skaleton';

import postData from '../../lib/Axios';
import { getSessionServerSide } from '../../utilities/servertool';
import PrintReceipt from './printReceipt';
import { useReactToPrint } from 'react-to-print';
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
export default function Reprint({ reprintDialog, setReprintDialog, selectedSesi, btnReprint }) {
    const apiEndPointGetDataFaktur = '/api/reprint/get_faktur'; // Karna sama fungsinya nampilin FAKTUR di SESI yang aktif, pake punya RETUR aja
    const apiEndPointGetDetailFaktur = '/api/reprint/cari_faktur';
    const apiEndPointGetMember = '/api/reprint/have_member';
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
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
    const onPage = (event) => {
        setlazyState(event);
    };

    const apiEndPointGetAllConfig = '/api/info_kasir/get_alldbconfig';
    const [config, setConfig] = useState(0);
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const vaTable = await postData(apiEndPointGetAllConfig);
                const json = vaTable.data;
                setConfig(json.data); // Mengubah persentase ke desimal
            } catch (error) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            }
        };
        toggleDataFaktur();
        fetchConfig();
    }, [btnReprint]);

    // -------------------------------------------------------------------------------------------------< Pencarian Faktur >
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };

            _lazyState['filters'] = { ...lazyState.filters };
            _lazyState['filters']['FAKTUR'] = e;
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
    const [dataFaktur, setDataFaktur] = useState([]);
    const [detailFaktur, setDetailFaktur] = useState([]);
    const [totPenjualan, setTotPenjualan] = useState([]);
    const strukRef = useRef();
    const [dataStruk, setDataStruk] = useState();
    const [isPrinting, setIsPrinting] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailFakturDialog, setDetailFakturDialog] = useState(false);

    const toggleDataFaktur = async () => {
        if (selectedSesi) {
            setLoading(true);
            let requestBody = {
                KODESESI: selectedSesi.SESIJUAL
            };
            try {
                const vaTable = await postData(apiEndPointGetDataFaktur, requestBody);
                const json = vaTable.data;
                // return;
                setDataFaktur(json.data);
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
                Faktur: selectedDataFaktur.FAKTUR
            };
            try {
                // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
                const vaTable = await postData(apiEndPointGetDetailFaktur, requestBody);
                const json = vaTable.data.data;
                setTotPenjualan(json);
                setDetailFaktur(json.items);
                setDataStruk(json);
            } catch (error) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            } finally {
                setLoadingDetail(false);
            }
        }
        return;

        // setDataFakturDialog(false);
    };
    const onHideDialog = () => {
        setReprintDialog(false);
    };

    const handlePrint = useReactToPrint({
        contentRef: strukRef,
        documentTitle: 'Kasir',
        onAfterPrint: () => setIsPrinting(false)
    });

    useEffect(() => {
        if (isPrinting) {
            handlePrint();
        }
    }, [isPrinting]);

    const saveReprint = () => {
        setIsPrinting(true);
    };

    const detailFooter = (
        <>
            <Button label="Reprint" className="p-button-primary p-button-lg w-full" onClick={() => setClosingDialog(true)} />
        </>
    );

    const [closingDialog, setClosingDialog] = useState(false);
    const closingDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={() => setClosingDialog(false)} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={saveReprint} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <Toast ref={toast} />
            <div className="col-12">
                <Dialog visible={reprintDialog} style={{ width: '80%' }} header="REPRINT" modal className="p-fluid" onHide={onHideDialog}>
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
                <Dialog visible={detailFakturDialog} style={{ width: '70%' }} header="REPRINT" modal footer={detailFooter} className="p-fluid" onHide={() => setDetailFakturDialog(false)}>
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
                                        <div className="field col-12 mb-2 lg:col-6">{totPenjualan.TANGGAL}</div>
                                    </div>
                                    <div className="grid formgrid">
                                        <div className="field col-12 mb-2 lg:col-4">USERNAME</div>
                                        <div className="field col-12 mb-2 lg:col-2">
                                            {' '}
                                            <span className="ml-2">:</span>{' '}
                                        </div>
                                        <div className="field col-12 mb-2 lg:col-6">{totPenjualan.KASIR}</div>
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
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="QTY" header="QTY"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="HJ" header="HARGA" body={(rowData) => formatRibuan(rowData.HJ)} bodyStyle={{ textAlign: 'right' }}></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="DISCOUNT" header="DISCOUNT" body={(rowData) => formatRibuan(rowData.DISCOUNT)} bodyStyle={{ textAlign: 'right' }}></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="SUBTOTAL" header="JUMLAH" body={(rowData) => formatRibuan(rowData.SUBTOTAL)} bodyStyle={{ textAlign: 'right' }}></Column>
                            </DataTable>
                        </>
                    )}
                </Dialog>
                {/* -----------------------------------------------------------------------------------------< DIALOG VALIDASI CLOSING > */}
                <Dialog visible={closingDialog} header="Confirm" modal footer={closingDialogFooter} onHide={() => setClosingDialog(false)}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>Reprint Struk ?</span>
                    </div>
                </Dialog>
                <div style={{ display: 'none' }}>
                    <PrintReceipt ref={strukRef} dataStruk={dataStruk} />
                </div>
            </div>
        </div>
    );
}

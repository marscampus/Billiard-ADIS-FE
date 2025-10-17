/**
     * Nama Program: GODONG POS - Kasir DaftarTunda
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 8 Jan 2024
     * Versi: 1.0.0

    Catatan:
    - Versi 1.0.0 mencakup fungsionalitas DaftarTunda Kasir
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
import { formatRibuan, showError, showSuccess } from '../../component/GeneralFunction/GeneralFunction';
import TabelSkaleton from '../../component/tabel/skaleton';

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
export default function DaftarTunda({ fakturTunda, setFakturTunda, dataShift, daftarTundaDialog, setDaftarTundaDialog, selectedSesi, btnDaftarTunda, addItem, setAddItem, calculateUpdatedGrandTotalDisc }) {
    const apiDirPath = '/api/api_crud_kode/';
    const apiEndPointGetDataFaktur = '/api/kasir_tmp/get_faktur';
    const apiEndPointGetDetailFaktur = '/api/kasir_tmp/detail_faktur';
    const apiEndPointDeleteTmp = '/api/kasir_tmp/delete_faktur';
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
        if (daftarTundaDialog) {
            toggleDataFaktur();
        }
    }, [btnDaftarTunda]);

    useEffect(() => {
        if (daftarTundaDialog) {
            loadLazyData();
        }
    }, [lazyState]);

    const loadLazyData = async () => {
        let requestBody = {
            KODESESI: selectedSesi?.SESIJUAL || null,
            filters: {
                FAKTUR: lazyState.filters.FAKTUR
            }
        };
        console.log('requestBody', requestBody);
        // return;
        setLoading(true);
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointGetDataFaktur
            };
            // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const vaTable = await postData(apiEndPointGetDataFaktur, requestBody);
            const json = vaTable.data.data;
            setDataFaktur(json);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    // -------------------------------------------------------------------------------------------------------< API DataFaktur >
    const [selectedDataFaktur, setSelectedDataFaktur] = useState(null);
    const [dataFaktur, setDataFaktur] = useState([]);
    const [detailFaktur, setDetailFaktur] = useState([]);
    const [totPenjualan, setTotPenjualan] = useState([]);
    const [daftarTunda, setDaftarTunda] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailFakturDialog, setDetailFakturDialog] = useState(false);

    const toggleDataFaktur = async () => {
        if (selectedSesi) {
            let requestBody = {
                KODESESI: selectedSesi.SESIJUAL
            };
            setSesi(selectedSesi.SESIJUAL);
            // return console.log(requestBody);
            setLoading(true);
            try {
                const header = {
                    'Content-Type': 'application/json;charset=UTF-8',
                    'X-ENDPOINT': apiEndPointGetDataFaktur
                };
                // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
                const vaTable = await postData(apiEndPointGetDataFaktur, requestBody);
                const json = vaTable.data;
                setDataFaktur(json.data);
            } catch (error) {
                const e = error?.response?.data || error;
                showError(toast, e?.message || 'Terjadi Kesalahan');
            } finally {
                setLoading(false);
            }
        }
    };
    // const [ fakturTunda, setFakturTunda ] = useState('');
    const onRowSelectDataFaktur = async (event) => {
        const selectedKode = event.data.FAKTUR;
        const selectedDataFaktur = dataFaktur.find((dataFaktur) => dataFaktur.FAKTUR === selectedKode);
        // console.log('selectedKode',selectedKode)
        // console.log('selectedDataFaktur',selectedDataFaktur)
        if (selectedDataFaktur) {
            setDetailFakturDialog(true);
            setLoadingDetail(true);
            let requestBody = {
                FAKTUR: selectedDataFaktur.FAKTUR
            };
            try {
                const vaTable = await postData(apiEndPointGetDetailFaktur, requestBody);
                const json = vaTable.data.data;
                // return;
                setDetailFaktur(json.detail);
                setTotPenjualan(json.header);
                setFakturTunda(selectedDataFaktur.FAKTUR);
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

    const onHideDialog = () => {
        setlazyState((prevState) => ({
            ...prevState,
            filters: {}
        }));
        setDaftarTundaDialog(false);
    };

    const tampilkanDaftarTunda = async (event) => {
        let _data = [...detailFaktur];
        const funcCalculateArray = [];
        // Iterasi melalui array dan panggil calculateUpdatedGrandTotalDisc untuk setiap elemen
        for (let i = 0; i < _data.length; i++) {
            const data = _data[i];
            const ketAsal = 'dataTunda';
            const funcCalculate = await calculateUpdatedGrandTotalDisc(data, null, null, null, ketAsal);
            funcCalculateArray.push(funcCalculate);
        }

        // Set addItem setelah semua perhitungan selesai
        setAddItem(() => {
            const updatedAddItem = _data.map((data, index) => {
                const funcCalc = funcCalculateArray[index];
                return {
                    KODE: data.KODE,
                    KODE_TOKO: data.KODE_TOKO,
                    NAMA: data.NAMA,
                    QTY: funcCalc.updatedQTY,
                    SATUAN: data.SATUAN,
                    HJ: data.HJ,
                    SUBTOTAL: funcCalc.subTotal,
                    DISCOUNT: data.DISCOUNT,
                    HARGAPPN: data.PAJAK,
                    SISASTOCKBARANG: data.SISASTOCKBARANG,
                    DISC: funcCalc.disc,
                    HARGADISCQTY: funcCalc.hargaDisc,
                    GRANDTOTAL: funcCalc.updatedGrandTotalDisc
                };
            });
            return updatedAddItem;
        });

        setDaftarTundaDialog(false);
        setDetailFakturDialog(false);
        setClosingDialog(false);
    };

    const detailFooter = (
        <>
            {/* <Button label="Tampilkan" className="p-button-primary p-button-lg w-full" onClick={() => setClosingDialog(true)}/> */}
            <Button
                label={
                    loadingDetail ? (
                        <>
                            <i className="pi pi-spin pi-spinner" style={{ marginRight: '0.5rem' }} /> Loading...
                        </>
                    ) : (
                        'Tampilkan'
                    )
                }
                className="p-button-primary p-button-lg w-full"
                onClick={() => setClosingDialog(true)}
                disabled={loadingDetail}
            ></Button>
        </>
    );

    const [closingDialog, setClosingDialog] = useState(false);
    const closingDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={() => setClosingDialog(false)} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={tampilkanDaftarTunda} />
        </>
    );

    // ------------------------------------------------------------------------< Hapus TMP >
    const deleteTmp = async () => {
        if (!fakturTunda) {
            console.log('deleteTmp Tidak dijalankan');
            return; // Keluar dari fungsi jika fakturTunda tidak memiliki nilai
        }
        let requestBody = {
            FAKTUR: fakturTunda
        };
        // return console.log('masuk deleteTmp');
        try {
            const header = {
                'Content-Type': 'application/json;charset=UTF-8',
                'X-ENDPOINT': apiEndPointDeleteTmp
            };
            // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const vaTable = await postData(apiEndPointDeleteTmp, requestBody);
            const json = vaTable.data;
            showSuccess(toast, 'Berhasil Hapus tmp');
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingDetail(false);
        }
    };
    module.exports = { deleteTmp };

    const totalJumlah = addItem.reduce((accumulator, item) => accumulator + parseFloat(item.JUMLAH), 0);
    return (
        <div className="grid crud-demo">
            <Toast ref={toast} />
            <div className="col-12">
                <Dialog visible={daftarTundaDialog} style={{ width: '70%' }} header="DAFTAR TUNDA" modal className="p-fluid" onHide={onHideDialog}>
                    <hr />
                    {/* {loading && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                    {!loading && ( */}
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
                        <Column headerStyle={{ textAlign: 'center' }} field="CATATAN" header="CATATAN"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TGL" bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="DISCOUNT" header="DISCOUNT" body={(rowData) => formatRibuan(rowData.DISCOUNT)} bodyStyle={{ textAlign: 'right' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="PAJAK" header="PAJAK" body={(rowData) => formatRibuan(rowData.PAJAK)} bodyStyle={{ textAlign: 'right' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TOTAL" header="TOTAL" body={(rowData) => formatRibuan(rowData.TOTAL)} bodyStyle={{ textAlign: 'right' }}></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} field="TUNAI" header="TUNAI" body={(rowData) => formatRibuan(rowData.TUNAI)} bodyStyle={{ textAlign: 'right' }}></Column>
                            <Column headerStyle={{ textAlign: "center" }} field="EPAYMENT" header="EPAYMENT" body={(rowData) => formatRibuan(rowData.EPAYMENT)} bodyStyle={{ textAlign: 'right' }}></Column>
                            <Column headerStyle={{ textAlign: "center" }} field="BAYARKARTU" header="DEBET" body={(rowData) => formatRibuan(rowData.BAYARKARTU)} bodyStyle={{ textAlign: 'right' }}></Column> */}
                        <Column headerStyle={{ textAlign: 'center' }} field="USERNAME" header="USERNAME"></Column>
                    </DataTable>
                    {/* )} */}
                </Dialog>
                {/* ---------------------------------------------------------------------------------------------------------------------< Detail Faktur > */}
                <Dialog visible={detailFakturDialog} style={{ width: '70%' }} header="DETAIL FAKTUR TUNDA" modal footer={detailFooter} className="p-fluid" onHide={() => setDetailFakturDialog(false)}>
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
                                        <div className="field col-12 mb-2 lg:col-4">CATATAN</div>
                                        <div className="field col-12 mb-2 lg:col-2">
                                            {' '}
                                            <span className="ml-2">:</span>{' '}
                                        </div>
                                        <div className="field col-12 mb-2 lg:col-6">{totPenjualan.CATATAN}</div>
                                    </div>
                                </div>
                                {/* ---------------------------------------------------------------------------< Kanan > */}
                                <div className="field col-12 mb-2 lg:col-6">
                                    <div className="grid formgrid">
                                        <div className="field col-12 mb-2 lg:col-4">USERNAME</div>
                                        <div className="field col-12 mb-2 lg:col-2">
                                            {' '}
                                            <span className="ml-2">:</span>{' '}
                                        </div>
                                        <div className="field col-12 mb-2 lg:col-6">{totPenjualan.USERNAME}</div>
                                    </div>
                                    <div className="grid formgrid">
                                        <div className="field col-12 mb-2 lg:col-4">TOTAL</div>
                                        <div className="field col-12 mb-2 lg:col-2">
                                            {}
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
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE_TOKO" header="BARCODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="QTY" header="QTY"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="HJ" header="HARGA" body={(rowData) => formatRibuan(rowData.HJ)} bodyStyle={{ textAlign: 'right' }}></Column>
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
                        <span>Yakin ingin Menampilkan ?</span>
                    </div>
                </Dialog>
            </div>
        </div>
    );
}

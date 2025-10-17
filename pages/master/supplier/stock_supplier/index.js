import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';

import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import Produk from '../../../component/produk';
import Supplier from '../../../component/supplier';
import { showError } from '../../../../component/GeneralFunction/GeneralFunction';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function supplier() {
    // API READ
    const apiEndPointGetSupplier = '/api/supplier/get';
    // API STORE
    const apiEndPointStore = '/api/stock_supplier/store';
    // API UPDATE
    const apiEndPointUpdate = '/api/stock_supplier/update';
    // API DELETE
    const apiEndPointDelete = '/api/stock_supplier/delete';

    const apiEndPointGetBarcode = '/api/stock_supplier/get_barcode';

    const apiEndPointGetDataBySupplier = '/api/stock_supplier/getdata_bysupplier';

    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [deleteSupplierDialog, setDeleteSupplierDialog] = useState(false);
    const [supplier, setSupplier] = useState([]);
    const [supplierTabel, setSupplierTabel] = useState(null);
    const [stockSupplierTabel, setStockSupplierTabel] = useState([]);
    const [stockSupplier, setStockSupplier] = useState(null);

    //  ------------------------------------------------------------------------------------------------------- Preparation
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
        loadLazyData();
    }, [lazyState]);

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const [loadingSupplier, setLoadingSupplier] = useState(false);
    const loadLazyData = async () => {};

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        setSupplier([]);

        setSupplierDialog(true);
        setIsUpdateMode(false);
    };

    const textEditor = (options) => {
        return <InputText type="number" step="any" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        // --- Kondisi edit field TERIMA, melakukan perhitungan TERIMA * HARGA
        switch (field) {
            case 'REORDER':
                const existingIndex2 = stockSupplierTabel.findIndex((item) => item.KODE === rowData.KODE);
                if (existingIndex2 !== -1) {
                    const updatedAddData = [...stockSupplierTabel];
                    updatedAddData[existingIndex2] = {
                        ...updatedAddData[existingIndex2],
                        REORDER: newValue
                    };
                    setStockSupplierTabel(updatedAddData);
                }
                break;
            default:
                event.preventDefault();
                break;
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< Supplier >
    const [supplierDialog, setSupplierDialog] = useState(false);
    const [supplierKode, setSupplierKode] = useState('');
    const [supplierNama, setSupplierNama] = useState('');
    const [supplierAlamat, setSupplierAlamat] = useState('');
    const btnSupplier = () => {
        setSupplierDialog(true);
    };
    const handleSupplierData = (supplierKode, supplierNama, supplierAlamat) => {
        setSupplierKode(supplierKode);
        setSupplierNama(supplierNama);
        setSupplierAlamat(supplierAlamat);

        setStockSupplier((prevStockSupplier) => ({
            ...prevStockSupplier,
            SUPPLIER: supplierKode,
            NAMA: supplierNama
        }));
        console.log('supplierKode', stockSupplier);
        console.log('supplierNama', stockSupplier);
        onRowSelectSupplier(supplierKode);
    };

    const onRowSelectSupplier = async (supplierKode) => {
        let requestBody = {
            SUPPLIER: supplierKode
        };
        try {
            const vaTable = await postData(apiEndPointGetDataBySupplier, requestBody);
            const json = vaTable.data;
            setStockSupplierTabel(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [dataProduk, setDataProduk] = useState('');
    const btnProduk = () => {
        setProdukDialog(true);
    };
    const [timer, setTimer] = useState(null);
    const handleBarcodeKeyDown = async (event) => {
        clearTimeout(timer);
        const newTimer = setTimeout(async () => {
            if (event.key === 'Enter') {
                const barcodeInput = document.getElementById('KODE_TOKO');
                const enteredBarcode = barcodeInput.value;
                // console.log('enteredBarcode',enteredBarcode);
                // return;
                if (enteredBarcode.trim() === '') {
                    return;
                }

                // Periksa apakah barcode yang dimasukkan mencakup kuantitas
                const barcodeDanQty = enteredBarcode.split('*');
                let enteredQty = 1;
                let enteredBarcodeValue = enteredBarcode;

                if (barcodeDanQty.length === 2) {
                    enteredQty = parseFloat(barcodeDanQty[0]);
                    enteredBarcodeValue = barcodeDanQty[1];
                }

                const params = { data: { KODE_TOKO: enteredBarcodeValue }, skipSelectBarcode: true, REORDER: enteredQty };
                console.log('params');
                console.log(params);
                await handleProdukData(params);

                barcodeInput.value = '';
            }
        }, 100);
        setTimer(newTimer);
    };
    const handleProdukData = async (params) => {
        // By Enter
        // return console.log('selectedKode',selectedKode)
        try {
            let selectedKode;
            console.log('params', params.KODE_TOKO);
            if (params?.skipSelectBarcode) {
                selectedKode = params.data.KODE_TOKO;
            } else {
                selectedKode = params.KODE_TOKO;
            }
            const vaTable = await postData(apiEndPointGetBarcode, { KODE_TOKO: `%${selectedKode}%` });
            const json = vaTable.data;
            console.log('json A', json.data);
            // setStockSupplierTabel(json);
            const qtyReorder = params.REORDER;
            tambahData(json.data, qtyReorder);
        } catch (error) {
            console.error(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    const tambahData = async (json, qtyReorder) => {
        if (!supplierKode) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Supplier Masih Kosong!', life: 3000 });
            return;
        }

        const enteredQty = qtyReorder || 1;
        // const valBarcode = json[0].BARCODE;

        let valBarcode;
        if (json && json.length > 0 && json[0].BARCODE) {
            valBarcode = json[0].BARCODE;
        } else {
            valBarcode = '';
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Barang Tidak Ditemukan', life: 3000 });
            return;
        }
        const existingIndex = stockSupplierTabel.findIndex((item) => item.KODE_TOKO === valBarcode);
        // return;
        if (existingIndex !== -1) {
            // -----------------------------------------< Sudah Ada >
            setStockSupplierTabel((prevStockSupplierTabel) => {
                const updatedData = [...prevStockSupplierTabel];
                const addedData = updatedData[existingIndex];
                const updatedJumlah = parseInt(addedData.REORDER) + enteredQty;
                console.log('updatedJumlah', updatedJumlah);
                updatedData[existingIndex] = {
                    ...addedData,
                    REORDER: updatedJumlah,
                    KODE_TOKO: addedData.KODE_TOKO,
                    SISASTOCK: addedData.SISASTOCK
                };
                return updatedData;
            });
        } else {
            // -----------------------------------------< Belum Ada >
            const addedData = json[0];
            // return console.log('sss',json);
            const jsonWithDefaultQty = json.map((item) => ({ ...item, REORDER: enteredQty, KODE_TOKO: addedData.BARCODE }));
            setStockSupplierTabel((prevStockSupplierTabel) => [...prevStockSupplierTabel, { ...addedData, REORDER: enteredQty, KODE_TOKO: addedData.BARCODE, SISASTOCK: addedData.SISASTOCK }, ...jsonWithDefaultQty.slice(1)]);
        }
        // saveData();
    };
    const createDataObject = (_stockSupplier, _stockSupplierTabel) => {
        console.log('yahaha', _stockSupplierTabel);
        const data = {
            SUPPLIER: _stockSupplier.SUPPLIER || supplierKode,
            tabelStockSupplier: _stockSupplierTabel.map((item) => {
                // convertUndefinedToNull(item);
                return {
                    KODE: item.KODE,
                    REORDER: item.REORDER,
                    MINSTOCK: 0
                };
            })
        };
        // convertUndefinedToNull(data);
        return data;
    };
    const saveData = async (e) => {
        e.preventDefault();
        let _stockSupplier = { ...stockSupplier };
        let _stockSupplierTabel = [...stockSupplierTabel];
        let _data = createDataObject(_stockSupplier, _stockSupplierTabel);
        console.log('_data', _data);
        // return;
        try {
            const vaTable = await postData(apiEndPointStore, _data);
            let data = vaTable.data;
            console.log('data', data);
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
            window.location.reload();
        } catch (error) {
            console.log(error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSupplierDialog(false);
    };
    const hideDeleteSupplierDialog = () => {
        setDeleteSupplierDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _supplier = { ...supplier };
        _supplier[`${name}`] = val;

        setSupplier(_supplier);
    };
    const editSupplier = (supplier) => {
        setSupplier({ ...supplier });
        setSupplierDialog(true);
        setIsUpdateMode(true);
    };

    const confirmDeleteSupplier = (supplier) => {
        setSupplier(supplier);
        setDeleteSupplierDialog(true);
    };
    const deleteEntryFromTable = (kodeToDelete) => {
        const updatedData = stockSupplierTabel.filter((item) => item.KODE !== kodeToDelete);
        setStockSupplierTabel(updatedData);
    };
    const deleteStockSupplier = async () => {
        let requestBody = {
            SUPPLIER: stockSupplier.SUPPLIER || supplierKode,
            KODE: supplier.KODE
        };
        console.log(requestBody);
        // return;
        try {
            const vaTable = await postData(apiEndPointDelete, requestBody);
            let data = vaTable.data;

            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Dihapus', life: 3000 });
            setDeleteSupplierDialog(false);
            deleteEntryFromTable(supplier.KODE);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // ---------------------------------------------------------------------------------------------------------------- Button

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteSupplier(rowData)} />
            </>
        );
    };

    const deleteSupplierDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteSupplierDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteStockSupplier} />
        </>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Menu Stock Supplier</h4>
                    <hr />
                    <Toast ref={toast} />
                    {/* <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar> */}

                    <div className="formgrid grid">
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="supplier">Supplier</label>
                            <div className="p-inputgroup">
                                <InputText readOnly id="supplier_kode" value={supplierKode} />
                                <Button icon="pi pi-search" className="p-button" onClick={btnSupplier} />
                                <InputText readOnly id="ket-Supplier" value={supplierNama} />
                            </div>
                        </div>
                        {/* <div className="field col-6 mb-2 lg:col-6"> */}
                        {/* <div className="formgrid grid"> */}
                        <div className="field col-4 mb-2 lg:col-4">
                            <label htmlFor="kode">Barcode</label>
                            <div className="p-inputgroup">
                                {/* <InputText id="kode" value={stockSupplier.KODE} onChange={(e) => onInputChange(e, "KODE")} />value={stockSupplier.KODE_TOKO} */}
                                <InputText id="KODE_TOKO" onKeyDown={handleBarcodeKeyDown} onChange={(e) => onInputChange(e, 'KODE_TOKO')} />
                                <Button disabled={isUpdateMode} icon="pi pi-search" className="p-button" onClick={btnProduk} />
                            </div>
                        </div>
                        <div className="field col-2 mb-2 lg:col-2 mt-4">
                            <div className="p-inputgroup">
                                <Button label="Simpan" className="p-button-md mr-2 mt-1" onClick={saveData} />
                            </div>
                        </div>
                        {/* <div className="field col-4 mb-2 lg:col-4">
                                    <label htmlFor="kode">QTY Reorder</label>
                                    <div className="p-inputgroup">
                                        <InputText id="kode" value={stockSupplier.KODE} onChange={(e) => onInputChange(e, "KODE")} />
                                    </div>
                                </div>
                            </div>
                        </div> */}
                    </div>
                    <div className="formgrid grid">
                        <div className="field col-12 mb-2 lg:col-12">
                            <DataTable
                                value={stockSupplierTabel}
                                size="small"
                                lazy
                                dataKey="KODE"
                                rows={10}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                // paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown" paginator
                                // currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                // header={headerSearch}
                                filters={lazyState.filters}
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE_TOKO" header="BARCODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                                {/* <Column headerStyle={{ textAlign: "center" }} field="REORDER" header="REORDER"></Column> */}
                                <Column headerStyle={{ textAlign: 'center' }} field="REORDER" header="REORDER" editor={(options) => textEditor(options)} onCellEditComplete={onCellEditComplete} bodyStyle={{ textAlign: 'center' }}></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="SISASTOCK" header="SISA STOK" bodyStyle={{ textAlign: 'center' }}></Column>
                                <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate} bodyStyle={{ textAlign: 'center' }}></Column>
                            </DataTable>
                        </div>
                    </div>

                    {/* <Toolbar className="mb-4" left={previewSupplier}></Toolbar> */}
                    <Dialog visible={deleteSupplierDialog} header="Confirm" modal footer={deleteSupplierDialogFooter} onHide={hideDeleteSupplierDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {supplier && (
                                <span>
                                    Yakin ingin menghapus data
                                    {/* <strong>{stockSupplier.KODE}</strong> ? */}
                                </span>
                            )}
                        </div>
                    </Dialog>
                    <Supplier supplierDialog={supplierDialog} setSupplierDialog={setSupplierDialog} btnSupplier={btnSupplier} handleSupplierData={handleSupplierData} />
                    <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProdukData={handleProdukData} />
                </div>
            </div>
        </div>
    );
}

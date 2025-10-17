/*
 * Copyright (C) Godong
 *http://www.marstech.co.id
 *Email. info@marstech.co.id
 *Telp. 0811-3636-09
 *Office        : Jl. Margatama Asri IV, Kanigoro, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63118
 *Branch Office : Perum Griya Gadang Sejahtera Kav. 14 Gadang - Sukun - Kota Malang - Jawa Timur
 *
 *Godong
 *Adalah merek dagang dari PT. Marstech Global
 *
 *License Agreement
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu aset perusahaan yang bernilai.
 *Di Indonesia secara khusus,
 *software telah dianggap seperti benda-benda berwujud lainnya yang memiliki kekuatan hukum.
 *Oleh karena itu pemilik software berhak untuk memberi ijin atau tidak memberi ijin orang lain untuk menggunakan softwarenya.
 *Dalam hal ini ada aturan hukum yang berlaku di Indonesia yang secara khusus melindungi para programmer dari pembajakan software yang mereka buat,
 *yaitu diatur dalam hukum hak kekayaan intelektual (HAKI).
 *
 *********************************************************************************************************
 *Pasal 72 ayat 3 UU Hak Cipta berbunyi,
 *' Barangsiapa dengan sengaja dan tanpa hak memperbanyak penggunaan untuk kepentingan komersial '
 *' suatu program komputer dipidana dengan pidana penjara paling lama 5 (lima) tahun dan/atau '
 *' denda paling banyak Rp. 500.000.000,00 (lima ratus juta rupiah) '
 *********************************************************************************************************
 *
 *Proprietary Software
 *Adalah software berpemilik, sehingga seseorang harus meminta izin serta dilarang untuk mengedarkan,
 *menggunakan atau memodifikasi software tersebut.
 *
 *Commercial software
 *Adalah software yang dibuat dan dikembangkan oleh perusahaan dengan konsep bisnis,
 *dibutuhkan proses pembelian atau sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Wed Apr 24 2024 - 03:09:20
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */
import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import postData from '../../../lib/Axios';
import { Dialog } from 'primereact/dialog';
import Gudang from '../../component/gudang';
import Produk from '../../component/produk';
import { Toolbar } from 'primereact/toolbar';
import { formatDateSave } from '../../../component/GeneralFunction/GeneralFunction';
import { InputNumber } from 'primereact/inputnumber';

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/transaksistock/packing-stock');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};

export default function AddPackingStock() {
    // API API API WKWKKW
    const apiEndPointGetFaktur = '/api/get_faktur';
    const apiEndPointGetBarcode = '/api/produk/get-barcode';
    const apiEndPointSatuan = '/api/satuan_stock/get';
    const apiEndPointStore = '/api/packing-stock/store';
    const apiEndPointGetDataEdit = '/api/packing-stock/data-edit';
    const apiEndPointUpdate = '/api/packing-stock/update';

    const router = useRouter();
    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingKodeHasil, setLoadingKodeHasil] = useState(false);
    const [loadingGudang, setLoadingGudang] = useState(false);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [faktur, setFaktur] = useState(null);
    const [tgl, setTgl] = useState(new Date());
    const [packingStock, setPackingStock] = useState([]);
    const [addPackingStock, setAddPackingStock] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalRecordsKodeHasil, setTotalRecordsKodeHasil] = useState(0);
    const [barcodeTabel, setBarcodeTabel] = useState([]);
    const [barcodeDialog, setBarcodeDialog] = useState(false);
    const [kodeHasilTabel, setKodeHasilTabel] = useState([]);
    const [ketKodeHasil, setKetKodeHasil] = useState('');
    const [kodeHasilDialog, setKodeHasilDialog] = useState(false);
    const [activeFormField, setActiveFormField] = useState(null);
    const [gudangDialog, setGudangDialog] = useState(false);
    const [kodeGudang, setKodeGudang] = useState('');
    const [ketGudang, setKetGudang] = useState('');
    const [timer, setTimer] = useState(null);
    const [satuanOptions, setSatuanOptions] = useState([]);
    const [selectedLabel, setSelectedLabel] = useState(null);
    const [dokterDialog, setDokterDialog] = useState(false);
    const [kodeDokter, setKodeDokter] = useState('');
    const [namaDokter, setNamaDokter] = useState('');
    const [ambilResepDialog, setAmbilResepDialog] = useState(false);
    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const [lazyStateKodeHasil, setLazyStateKodeHasil] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const onPage = (event) => {
        setLazyState(event);
    };

    useEffect(() => {
        const { status } = router.query;
        const Faktur = localStorage.getItem('Faktur');
        if (status === 'update') {
            setFaktur(Faktur);
            getDataEdit();
            setReadOnlyEdit(true);
            setIsUpdateMode(true);
        } else {
            loadLazyData();
            setIsUpdateMode(false);
        }
        const satuan = async () => {
            try {
                const vaData = await postData(apiEndPointSatuan);
                const json = vaData.data;
                setSatuanOptions(json);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        // satuan();
    }, []);

    // const transformedData = satuanOptions.map(item => ({
    //     value: item.KODE,
    //     label: item.KETERANGAN
    // }));

    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                Kode: 'PK',
                Len: 6
            };
            const vaData = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaData.data;
            setFaktur(json);
            setPackingStock((prevPackingStock) => ({
                ...prevPackingStock,
                FAKTUR: json
            }));
        } catch (error) {
            console.log('Error while loading data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // Get Data Edit
    const getDataEdit = async () => {
        setLoading(true);
        const Faktur = localStorage.getItem('Faktur');
        try {
            let requestBody = {
                Faktur: Faktur
            };
            const vaData = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaData.data;
            setPackingStock(json);
            setAddPackingStock(json.tabelPackingStock);
        } catch (error) {
            console.log('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Save
    const createDataObject = (_packingStock, _addPackingStock) => {
        let data = {
            Faktur: isUpdateMode ? _packingStock.Faktur : faktur,
            Tgl: isUpdateMode ? _packingStock.Tgl : formatDateSave(_packingStock.Tgl || new Date()),
            Kode: _packingStock.Kode,
            Keterangan: _packingStock.Keterangan || '',
            Gudang: _packingStock.Gudang,
            Qty: _packingStock.Qty,
            tabelPackingStock: _addPackingStock
                .map((item) => {
                    const Qty = item.QTY !== null ? item.QTY : 0;
                    if (Qty > 0) {
                        return {
                            Faktur: isUpdateMode ? _packingStock.Faktur : faktur,
                            Tgl: isUpdateMode ? _packingStock.Tgl : formatDateSave(_packingStock.Tgl || new Date()),
                            Kode: item.KODE,
                            Gudang: _packingStock.Gudang,
                            Qty: item.QTY,
                            Satuan: item.SATUAN
                        };
                    } else {
                        return null;
                    }
                })
                .filter((item) => item !== null)
        };
        return data;
    };

    const savePackingStock = async (e) => {
        e.preventDefault();
        let _packingStock = { ...packingStock };
        let _addPackingStock = [...addPackingStock];
        let _data = createDataObject(_packingStock, _addPackingStock);
        console.log(_data);

        if (_data.Faktur == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.Tgl == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tanggal Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.Kode == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kode Hasil Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.Gudang == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.Qty == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Qty Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.tabelPackingStock.length <= 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong!', life: 3000 });
            return;
        }

        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaData = await postData(endPoint, _data);
            const json = vaData.data;
            if (json.status === 'success') {
                router.push('/transaksistock/packing-stock');
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Menyimpan Data', life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
        }
    };

    // Yang Handle Inputan
    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _packingStock = { ...packingStock };
        _packingStock[`${name}`] = val;
        setPackingStock(_packingStock);
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...packingStock };
        _data[`${name}`] = val;
        setPackingStock(_data);
    };

    // Yang Handle Kode Hasil
    const toggleKodeHasil = () => {
        setKodeHasilDialog(true);
    };

    const handleKodeHasil = (data) => {
        setPackingStock((prevPackingStock) => ({
            ...prevPackingStock,
            Kode: data.KODE_TOKO,
            KetKode: data.NAMA
        }));
    };

    // Yang Handle Barcode
    const toggleProduk = () => {
        setBarcodeDialog(true);
    };

    const handleProdukData = (produkFaktur) => {
        onRowSelectBarcode({ data: produkFaktur });
    };

    // Yang Handle Barcode Enter
    const handleBarcodeKeyDown = async (event) => {
        clearTimeout(timer);
        const newTimer = setTimeout(async () => {
            if (event.key === 'Enter') {
                const barcodeInput = document.getElementById('barcode');
                const enteredBarcode = barcodeInput.value;

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

                const params = { data: { KODE_TOKO: enteredBarcodeValue }, skipSelectBarcode: true, qty: enteredQty };
                await onRowSelectBarcode(params);

                barcodeInput.value = '';
            }
        }, 100);
        setTimer(newTimer);
    };

    // Yang Handle Barcode Pilih dari Tabel
    const onRowSelectBarcode = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        const enteredQty = event.qty || 1;
        let selectedBarcode;

        if (event?.skipSelectBarcode) {
            // by Enter
            selectedBarcode = { KODE_TOKO: selectedKode };
        } else {
            // Select diTabel
            selectedBarcode = barcodeTabel.find((barcode) => barcode.KODE_TOKO === selectedKode);
            // selectedBarcode = { KODE_TOKO: selectedBarcode.KODE_TOKO };  //asli
            selectedBarcode = { KODE_TOKO: selectedBarcode?.KODE_TOKO || event.data?.KODE_TOKO };
        }
        // return;
        if (!selectedBarcode) {
            setBarcodeDialog(false);
            return;
        }
        // --- API
        try {
            const vaTable = await postData(apiEndPointGetBarcode, { Barcode: `%${selectedKode}%` });
            const json = vaTable.data;
            if (json.status === '99') {
                // Menampilkan pesan error dengan menggunakan Toast
                toast.current.show({
                    severity: 'error',
                    detail: json.message,  // Menampilkan pesan yang diterima
                    summary: 'Request Failed',  // Menambahkan detail kesalahan secara umum
                    life: 3000  // Durasi tampilan pesan toast (dalam milidetik)
                });
            }
            const valBarcode = json[0].BARCODE;
            const existingIndex = addPackingStock.findIndex((item) => item.BARCODE === valBarcode);
            const qtyToAdd = json.QTY || enteredQty || 1;
            //  --- Cek ada data yang sama di Tabel addPackingStock
            if (existingIndex !== -1) {
                // -------------------------------------------------------------- sudah ada di addPackingStock
                setAddPackingStock((prevAddPackingStock) => {
                    const updatedAddPackingStock = [...prevAddPackingStock];
                    const addedData = updatedAddPackingStock[existingIndex];
                    const updatedQTY = addedData.QTY + qtyToAdd;
                    updatedAddPackingStock[existingIndex] = {
                        ...addedData,
                        QTY: updatedQTY
                    };
                    return updatedAddPackingStock;
                });
            } else {
                // -------------------------------------------------------------- BELUM ada di addPackingStock
                const addedData = json[0];
                const jsonWithDefaultQty = json.map((item) => ({ ...item, QTY: qtyToAdd }));
                setAddPackingStock((prevAddPackingStock) => [...prevAddPackingStock, { ...addedData, QTY: qtyToAdd }, ...jsonWithDefaultQty.slice(1)]);
            }
            const newDataRow = document.getElementById('new-data-row'); // Ganti dengan ID atau ref dari elemen yang menampilkan data baru dimasukkan
            if (newDataRow) {
                newDataRow.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Menggulirkan elemen baru ke tengah layar jika perlu
            }
            setBarcodeDialog(false);
        } catch (error) {
            console.log('Error fetching barcode data:', error);
            // Handle the error accordingly, e.g., show an error message
            setBarcodeDialog(false);
        }
    };

    // Yang Handle Gudang
    const toggleGudang = () => {
        setGudangDialog(true);
    };

    const handleGudangData = (gudangKode, gudangKet) => {
        setPackingStock((prevPackingStock) => ({
            ...prevPackingStock,
            Gudang: gudangKode,
            KetGudang: gudangKet
        }));
    };

    const onQtyUpdate = (updatedAddPacking) => {
        setAddPackingStock(updatedAddPacking);
    };

    const deleteSelectedRow = (rowData) => {
        const updatedAddPackingStock = addPackingStock.filter((row) => row !== rowData);
        setAddPackingStock(updatedAddPackingStock);
    };

    // Edit in Cell
    const cellEditor = (options) => {
        return textEditor(options);
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        switch (field) {
            case 'QTY':
                // Replace comma with dot
                newValue = newValue.replace(',', '.');
                const editedQty = parseFloat(newValue);
                if (!isNaN(editedQty)) {
                    // Check if editedQty is a valid number
                    if (editedQty === 0 || editedQty === null) {
                        deleteSelectedRow(rowData);
                    } else {
                        const updatedAddPackingStock = addPackingStock.map((item) => {
                            if (item.KODE === rowData.KODE) {
                                return { ...item, QTY: editedQty }; // Use editedQty directly
                            } else {
                                return item;
                            }
                        });

                        setAddPackingStock(updatedAddPackingStock);

                        // Call a function in index.js to handle the updated addPackingStock
                        if (onQtyUpdate) {
                            onQtyUpdate(updatedAddPackingStock);
                        }
                    }
                } else {
                    // Handle the case when newValue is not a valid number
                    console.log('Invalid input. Please enter a valid number for Qty.');
                }
                break;
        }
    };

    const actionBodyTabel = (rowData) => {
        return <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />;
    };

    const textEditor = (options) => {
        return <InputText value={options.value} keyfilter={/^[0-9,.]*$/} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const rightFooterTemplate = (rowData) => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={savePackingStock} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/transaksistock/packing-stock');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>{isUpdateMode ? 'Edit' : 'Add'} Packing Stock</h4>
                <hr />
                <Toast ref={toast}> </Toast>
                <div>
                    <div className="formgrid grid">
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="faktur">Faktur</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={faktur}></InputText>
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="kodeHasil">Kode Hasil</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly={readOnlyEdit} value={packingStock.Kode} />
                                        <Button icon="pi pi-search" className="p-button" onClick={toggleKodeHasil} disabled={readOnlyEdit} />
                                        <InputText readOnly={readOnlyEdit} value={packingStock.KetKode} />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="qty">Qty</label>
                                    <div className="p-inputgroup">
                                        {/* <InputText value={packingStock.Qty} keyfilter={/^\d*(,\d{0,2})?$/} onChange={(e) => onInputChange(e, 'Qty')}></InputText> */}
                                        <InputNumber value={packingStock.Qty} inputStyle={{ textAlign: 'right' }} onChange={(e) => onInputNumberChange(e, 'Qty')}></InputNumber>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="tgl">Tanggal</label>
                                    <div className="p-inputgroup">
                                        <Calendar
                                            disabled={readOnlyEdit}
                                            value={packingStock.Tgl && packingStock.Tgl ? new Date(packingStock.Tgl) : new Date()}
                                            onChange={(e) => onInputChange(e, 'Tgl')}
                                            id="tgl"
                                            showIcon
                                            dateFormat="dd-mm-yy"
                                        ></Calendar>
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="gudang">Gudang</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={packingStock.Gudang} />
                                        <Button icon="pi pi-search" className="p-button" onClick={toggleGudang} disabled={readOnlyEdit} />
                                        <InputText readOnly value={packingStock.KetGudang} />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="supplier">Barcode</label>
                                    <div className="p-inputgroup">
                                        <InputText id="barcode" onKeyDown={handleBarcodeKeyDown} />
                                        <Button icon="pi pi-search" className="p-button" onClick={toggleProduk} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr></hr>
                <DataTable
                    loading={loading}
                    value={addPackingStock}
                    size="small"
                    lazy
                    dataKey="KODE"
                    rows={10}
                    editMode="cell"
                    className="datatable-responsive editable-cells-"
                    first={lazyState.first}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    scrollable
                    scrollHeight="200px"
                >
                    <Column field="KODE" header="KODE"></Column>
                    <Column field="BARCODE" header="BARCODE"></Column>
                    <Column field="NAMA" header="NAMA"></Column>
                    <Column
                        field="SATUAN"
                        header="SATUAN"
                    />
                    <Column
                        field="QTY"
                        header="QTY"
                        editor={(options) => cellEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        body={(rowData) => {
                            const value = rowData.QTY ? parseFloat(rowData.QTY).toLocaleString() : '0';
                            return value;
                        }}
                        bodyStyle={{ textAlign: 'center' }}
                    ></Column>
                    <Column header="ACTION" body={actionBodyTabel} bodyStyle={{ textAlign: 'center' }}></Column>
                </DataTable>

                <br></br>
                <Toolbar className="mb-4" right={rightFooterTemplate}></Toolbar>
            </div>
            <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={toggleGudang} handleGudangData={handleGudangData} />
            <Produk produkDialog={barcodeDialog} setProdukDialog={setBarcodeDialog} btnProduk={toggleProduk} handleProdukData={handleProdukData}></Produk>
            <Produk produkDialog={kodeHasilDialog} setProdukDialog={setKodeHasilDialog} btnProduk={toggleKodeHasil} handleProdukData={handleKodeHasil}></Produk>
        </div>
    );
}

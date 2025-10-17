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
 *dibutuhkan proses kirimStock atau sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Thu May 02 2024 - 09:25:11
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */
import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { useRouter } from 'next/router';
import Gudang from '../../component/gudang';
import Produk from '../../component/produk';
import postData from '../../../lib/Axios';
import { formatDatePdf, formatDateSave, formatDateTable, getDBConfig, getEmail, getGudang, getKeterangan, getUserName, setLastFaktur } from '../../../component/GeneralFunction/GeneralFunction';
import { Dialog } from 'primereact/dialog';
import PDFViewer from '../../../component/PDFViewer';
import { Dropdown } from 'primereact/dropdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import AdjustPrintMarginPDF from '../../component/adjustPrintMarginPDF';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/transaksistock/mutasi-gudang');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};

export default function MutasiGudangKirim() {
    const apiEndPointGetFaktur = '/api/get_faktur';
    const apiEndPointGetBarcode = '/api/produk/get-barcode';
    const apiEndPointStore = '/api/kirim-stock/store';
    const apiEndPointGetDataEditKirim = '/api/kirim-stock/get-data-edit';
    const apiEndPointUpdate = '/api/kirim-stock/update';
    const apiEndPointGetDataFaktur = '/api/mutasi-stock/get-data';

    const toast = useRef(null);
    const router = useRouter();
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [readOnlyEdit, setReadOnlyEdit] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingBarcode, setLoadingBarcode] = useState(false);
    const [kirimStock, setKirimStock] = useState([]);
    const [dataPDF, setDataPDF] = useState([]);
    const [addKirimStock, setAddKirimStock] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [faktur, setFaktur] = useState(null);
    const [gudangDialog, setGudangDialog] = useState(false);
    const [kodeDariGudang, setKodeDariGudang] = useState('');
    const [ketDariGudang, setKetDariGudang] = useState('');
    const [kodeKeGudang, setKodeKeGudang] = useState('');
    const [ketKeGudang, setKetKeGudang] = useState('');
    const [produkDialog, setProdukDialog] = useState(false);
    const [barcodeTabel, setBarcodeTabel] = useState([]);
    const [timer, setTimer] = useState(null);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [tglFaktur, setTglFaktur] = useState(new Date());
    const [totalItems, setTotalItems] = useState(0);
    const [totalQty, setTotalQty] = useState(0);
    const [totalHj, setTotalHJ] = useState(0);
    const [dariGudang, setDariGudang] = useState(null);
    const [keGudang, setKeGudang] = useState(null);
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    // PDF OLD
    const [today, setToday] = useState(new Date());
    const [namaToko, setNamaToko] = useState(null);
    const [alamatToko, setAlamatToko] = useState(null);
    const [teleponToko, setTeleponToko] = useState(null);
    const [kotaToko, setKotaToko] = useState(null);
    const [marginTop, setMarginTop] = useState(10); // JSPDF
    const [marginLeft, setMarginLeft] = useState(10); // JSPDF
    const [marginRight, setMarginRight] = useState(10); // JSPDF
    const [marginBottom, setMarginBottom] = useState(10); // JSPDF
    const [tableWidth, setTableWidth] = useState(800); // JSPDF
    const paperSizes = [
        { name: 'A4', value: 'A4' },
        { name: 'Letter', value: 'Letter' },
        { name: 'Legal', value: 'Legal' }
    ]; // JSPDF
    const orientationOptions = [
        { label: 'Potret', value: 'portrait' },
        { label: 'Lanskap', value: 'landscape' }
    ]; // JSPDF
    const handlePaperSizeChange = (event) => {
        setSelectedPaperSize(event.target.value);
    }; // JSPDF
    const handleOrientationChange = (event) => {
        setOrientation(event.target.value);
    }; // JSPDF
    // JSPDF
    // PDF OLD
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const hidePreview = async () => {
        try {
            setShowPreview(false);
            await setLastFaktur('BK');
            router.push('/transaksistock/mutasi-gudang');
        } catch (error) {
            return console.log(error);
        }
    };

    const hidePDF = async () => {
        setjsPdfPreviewOpen(false);
        await setLastFaktur('BK');
        router.push('/transaksistock/mutasi-gudang');
    };

    const onPage = (event) => {
        setlazyState(event);
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

        // Komponen Handle Slip Gudang
        const komponenPDF = async () => {
            try {
                const nama = await getDBConfig('msNamaToko');
                setNamaToko(nama);
                const alamat = await getDBConfig('msAlamat');
                setAlamatToko(alamat);
                const telepon = await getDBConfig('msTelepon');
                setTeleponToko(telepon);
                const kota = await getDBConfig('msKota');
                setKotaToko(kota);
            } catch (error) { }
        };

        const getDariGudang = async () => {
            try {
                let email = await getEmail();
                let gudang = await getGudang(email);
                let keterangan = await getKeterangan(gudang, 'Keterangan', 'gudang');
                setKodeDariGudang(gudang);
                setKetDariGudang(keterangan);
            } catch (error) { }
        };
        getDariGudang();
        komponenPDF();
    }, []);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                Kode: 'BK',
                Len: 6
            };
            const vaData = await postData(apiEndPointGetFaktur, requestBody);
            const json = vaData.data;
            setFaktur(json);
            setKirimStock((prevKirimStock) => ({
                ...prevKirimStock,
                Faktur: json
            }));
        } catch (error) {
            console.log('Error while loading data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Get Data Edit
    const getDataEdit = async () => {
        setLoading(true);
        const Faktur = localStorage.getItem('Faktur');
        try {
            let requestBody = {
                Faktur: Faktur
            };
            const vaData = await postData(apiEndPointGetDataEditKirim, requestBody);
            const json = vaData.data;
            setKirimStock(json);
            setAddKirimStock(json.tabelKirimStock);
        } catch (error) {
            console.log('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Save
    const createDataObject = (_kirimStock, _addKirimStock) => {
        let data = {
            Faktur: isUpdateMode ? _kirimStock.Faktur : faktur,
            Tgl: isUpdateMode ? _kirimStock.Tgl : formatDateSave(_kirimStock.Tgl || new Date()),
            DariGudang: kodeDariGudang,
            KeGudang: kodeKeGudang || _kirimStock.KeGudang,
            tabelKirimStock: _addKirimStock
                .map((item) => {
                    const Qty = item.QTYKIRIM !== null ? item.QTYKIRIM : 0;
                    if (Qty > 0) {
                        return {
                            KodeToko: item.BARCODE,
                            QtyKirim: item.QTYKIRIM,
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

    const saveKirimStock = async (e) => {
        e.preventDefault();
        let _kirimStock = { ...kirimStock };
        let _addKirimStock = [...addKirimStock];
        let _data = createDataObject(_kirimStock, _addKirimStock);
        if (_data.Faktur == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Faktur Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.Tgl == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tanggal Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.KeGudang == null) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Ke Gudang Masih Kosong!', life: 3000 });
            return;
        }

        if (_data.KeGudang == _data.DariGudang) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Penerima Tidak Boleh Sama Dengan Kode Pengirim', life: 3000 });
            return;
        }

        if (_data.tabelKirimStock.length <= 0) {
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
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Menyimpan Data', life: 3000 });
                isUpdateMode ? router.push('/transaksistock/mutasi-gudang') : handleAdjust();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
            }
        } catch (error) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
        }
    };

    // Yang Handle Inputan
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _data = { ...kirimStock };
        _data[`${name}`] = val;
        setKirimStock(_data);
    };

    // Yang Handle Gudang
    const toggleGudang = () => {
        setGudangDialog(true);
    };

    const handleGudangData = (gudangKode, gudangKet) => {
        if (gudangKode == kodeDariGudang) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Penerima Tidak Boleh Sama Dengan Kode Pengirim', life: 3000 });
            return;
        }
        setKodeKeGudang(gudangKode);
        setKetKeGudang(gudangKet);
        setKirimStock((prevKirimStock) => ({
            ...prevKirimStock,
            Gudang: gudangKode
        }));
    };

    // Yang Handle Barcode
    const toggleProduk = () => {
        setProdukDialog(true);
    };

    const handleProdukData = (produkFaktur) => {
        onRowSelectBarcode({ data: produkFaktur });
    };

    // Yang Handle Barcode Enter
    const handleBarcodeKeyDown = async (event) => {
        clearTimeout(timer);
        const newTimer = setTimeout(async () => {
            // Periksa apakah tombol yang ditekan adalah Enter
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
        const selectedBarcode = { KODE_TOKO: selectedKode };
        // return;
        if (!selectedBarcode) {
            setProdukDialog(false);
            return;
        }
        try {
            // --- API
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
                return;
            }

            const valBarcode = json[0].BARCODE;
            // Cek sisa stock
            if (parseInt(json[0].SISASTOCKBARANG) <= 0) {
                toast.current.show({
                    severity: 'error',
                    detail: "Stock barang sudah habis",  // Menampilkan pesan yang diterima
                    summary: 'Request Failed',  // Menambahkan detail kesalahan secara umum
                    life: 3000  // Durasi tampilan pesan toast (dalam milidetik)
                });
                return;
            }
            // Cek sisa stock - QTY KIRIM
            if (enteredQty > parseInt(json[0].SISASTOCKBARANG)) {
                toast.current.show({
                    severity: 'error',
                    detail: "Barang yang dikirim melebihi stock yang tersedia",  // Menampilkan pesan yang diterima
                    summary: 'Request Failed',  // Menambahkan detail kesalahan secara umum
                    life: 3000  // Durasi tampilan pesan toast (dalam milidetik)
                });
                return;
            }
            const existingIndex = addKirimStock.findIndex((item) => item.BARCODE === valBarcode);
            // const qtyToAdd = json.QTY || 1;
            const qtyToAdd = json.QTY || enteredQty || 1;
            //  --- Cek ada data yang sama di Tabel addKirimStock
            if (existingIndex !== -1) {
                // Sudah ada data dengan kode dan tanggal kadaluarsa yang sama
                const existingItem = addKirimStock[existingIndex];
                // Tambahkan jumlah jika tanggal kadaluarsa sama
                const updatedQTY = existingItem.QTYKIRIM + qtyToAdd;
                setAddKirimStock((prevAddKirimStock) => {
                    const updatedAddKirimStock = [...prevAddKirimStock];
                    updatedAddKirimStock[existingIndex] = {
                        ...existingItem,
                        QTYKIRIM: updatedQTY
                    };
                    return updatedAddKirimStock;
                });
            } else {
                // Tidak ada data dengan kode dan tanggal kadaluarsa yang sama, tambahkan data baru
                const addedData = json[0];
                setAddKirimStock((prevAddKirimStock) => [...prevAddKirimStock, { ...addedData, QTYKIRIM: qtyToAdd }]);
            }
            const newDataRow = document.getElementById('new-data-row'); // Ganti dengan ID atau ref dari elemen yang menampilkan data baru dimasukkan
            if (newDataRow) {
                newDataRow.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Menggulirkan elemen baru ke tengah layar jika perlu
            }
            setProdukDialog(false);
        } catch (error) {
            console.error('Error fetching barcode data:', error);
            // Handle the error accordingly, e.g., show an error message
            setProdukDialog(false);
        }
    };

    const onRowSelectBarcode1 = async (event) => {
        const selectedKode = event.data.KODE_TOKO;
        const expired = event.data.Expired;
        const enteredQty = event.QTYKIRIM;
        let selectedBarcode;

        if (event?.skipSelectBarcode) {
            // by Enter
            selectedBarcode = { Kode_Toko: selectedKode };
        } else {
            // Select diTabel
            selectedBarcode = barcodeTabel.find((barcode) => barcode.Kode_Toko === selectedKode);
            selectedBarcode = { Kode_Toko: selectedBarcode?.KODE_TOKO || event.data?.KODE_TOKO };
        }
        // return;
        if (!selectedBarcode) {
            setProdukDialog(false);
            return;
        }
        // --- API
        try {
            let requestBody = {
                KodeToko: `%${selectedKode}%`,
                Expired: expired
            };
            const vaTable = await postData(apiEndPointGetBarcode, requestBody);
            const json = vaTable.data;

            if (json.status === 'BARANG TIDAK DITEMUKAN') {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Barang Tidak Ditemukan', life: 3000 });
                setProdukDialog(false);
                return;
            }

            const valBarcode = json[0].KodeToko;
            const qtyToAdd = json[0].QTYKIRIM || enteredQty || 1;

            // Iterasi melalui setiap entri dalam array json
            json.forEach((newData) => {
                // Cari indeks di addKirimStock yang memiliki kode dan tanggal kadaluarsa yang sama
                const existingIndex = addKirimStock.findIndex((item) => item.KodeToko === valBarcode && item.Expired === newData.Expired);

                if (existingIndex !== -1) {
                    // Sudah ada data dengan kode dan tanggal kadaluarsa yang sama
                    const existingItem = addKirimStock[existingIndex];
                    // Tambahkan jumlah jika tanggal kadaluarsa sama
                    const updatedQTY = existingItem.QTYKIRIM + qtyToAdd;
                    setAddKirimStock((prevAddKirimStock) => {
                        const updatedAddKirimStock = [...prevAddKirimStock];
                        updatedAddKirimStock[existingIndex] = {
                            ...existingItem,
                            QTYKIRIM: updatedQTY
                        };
                        return updatedAddKirimStock;
                    });
                } else {
                    // Tidak ada data dengan kode dan tanggal kadaluarsa yang sama, tambahkan data baru
                    setAddKirimStock((prevAddKirimStock) => [...prevAddKirimStock, { ...newData, QTYKIRIM: qtyToAdd }]);
                }
            });

            const newDataRow = document.getElementById('new-data-row'); // Ganti dengan ID atau ref dari elemen yang menampilkan data baru dimasukkan
            if (newDataRow) {
                newDataRow.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Menggulirkan elemen baru ke tengah layar jika perlu
            }
            setProdukDialog(false);
        } catch (error) {
            console.log('Error fetching barcode data:', error);
            // Handle the error accordingly, e.g., show an error message
            setProdukDialog(false);
        }
    };

    // Yang Handle Edit in Cell
    const cellEditor = (options) => {
        return textEditor(options);
    };

    const onQtyUpdate = (updatedAddStock) => {
        setAddKirimStock(updatedAddStock);
    };

    const deleteSelectedRow = (rowData) => {
        const updatedAddKirimStock = addKirimStock.filter((row) => row !== rowData);
        setAddKirimStock(updatedAddKirimStock);
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field } = e;
        switch (field) {
            case 'QTYKIRIM':
                if (!isNaN(newValue)) {
                    // Check if newValue is a valid number
                    const editedQty = parseFloat(newValue);
                    // Mencari indeks dari entri yang sesuai dalam addKirimStock
                    const rowIndex = addKirimStock.findIndex((item) => item.BARCODE === rowData.BARCODE);
                    // Mendapatkan sisa stock dari baris yang sesuai
                    const sisaStock = addKirimStock[rowIndex].SISASTOCKBARANG;
                    // // Cek sisa stock - QTY KIRIM
                    if (editedQty > parseInt(sisaStock)) {
                        toast.current.show({
                            severity: 'error',
                            detail: "Barang yang dikirim melebihi stock yang tersedia",  // Menampilkan pesan yang diterima
                            summary: 'Request Failed',  // Menambahkan detail kesalahan secara umum
                            life: 3000  // Durasi tampilan pesan toast (dalam milidetik)
                        });
                        return;
                    }
                    if (!isNaN(editedQty)) {
                        // Check if editedQty is a valid number
                        if (editedQty === 0 || editedQty === '') {
                            deleteSelectedRow(rowData);
                        } else {
                            const updatedAddItem = addKirimStock.map((item) => {
                                if (item.BARCODE === rowData.BARCODE) {
                                    const addedData = rowData;
                                    const initialQty = addedData.QTYKIRIM;
                                    const qtyToAdd = editedQty - initialQty;

                                    return { ...item, QTYKIRIM: editedQty };
                                } else {
                                    return item;
                                }
                            });

                            setAddKirimStock(updatedAddItem);

                            // Call a function in index.js to handle the updated addKirimStock
                            if (onQtyUpdate) {
                                onQtyUpdate(updatedAddItem);
                            }
                        }
                    } else {
                        // Handle the case when newValue is not a valid number
                        console.error('Invalid input. Please enter a valid number for QTY.');
                    }
                } else {
                    // Handle the case when newValue is not a valid number
                    console.error('Invalid input. Please enter a valid number for QTY.');
                }
                break;
            default:
                break;
        }
    };

    const onCellEditComplete1 = (e) => {
        let { rowData, newValue, field } = e;
        switch (field) {
            case 'QTYKIRIM':
                if (!isNaN(newValue)) {
                    // Check if newValue is a valid number
                    const editedQty = parseFloat(newValue);
                    // Mencari indeks dari entri yang sesuai dalam addKirimStock
                    const rowIndex = addKirimStock.findIndex((item) => item.Kode === rowData.Kode && item.Expired === rowData.Expired);
                    // Mendapatkan sisa stock dari baris yang sesuai
                    const sisaStock = addKirimStock[rowIndex].SisaStock;
                    if (!isNaN(editedQty)) {
                        // Check if editedQty is a valid number
                        if (editedQty === 0 || editedQty === '') {
                            deleteSelectedRow(rowData);
                        } else {
                            const updatedAddItem = addKirimStock.map((item) => {
                                if (item.Kode === rowData.Kode && item.Expired === rowData.Expired) {
                                    const addedData = rowData;
                                    const initialQty = addedData.QTYKIRIM;
                                    const qtyToAdd = editedQty - initialQty;

                                    return { ...item, QTYKIRIM: editedQty };
                                } else {
                                    return item;
                                }
                            });

                            setAddKirimStock(updatedAddItem);

                            // Call a function in index.js to handle the updated addKirimStock
                            if (onQtyUpdate) {
                                onQtyUpdate(updatedAddItem);
                            }
                        }
                    } else {
                        // Handle the case when newValue is not a valid number
                        console.error('Invalid input. Please enter a valid number for QTY.');
                    }
                } else {
                    // Handle the case when newValue is not a valid number
                    console.error('Invalid input. Please enter a valid number for QTY.');
                }
                break;
            default:
                break;
        }
    };

    // Yang Handle Cetak Slip
    const cetakSlip = async () => {
        try {
            let format = 'a4';
            if (selectedPaperSize === 'Letter') {
                format = 'letter';
            } else if (selectedPaperSize === 'Legal') {
                format = 'legal';
            }

            let requestBody = {
                Faktur: faktur
            };
            const vaTable = await postData(apiEndPointGetDataFaktur, requestBody);
            const jsonHeader = vaTable.data;
            const jsonDetail = vaTable.data.data;

            const marginLeftInMm = parseFloat(marginLeft);
            const marginTopInMm = parseFloat(marginTop);
            const marginRightInMm = parseFloat(marginRight);
            const marginBottomInMm = parseFloat(marginBottom);
            const tableWidthInMm = parseFloat(tableWidth);

            const doc = new jsPDF({
                orientation,
                unit: 'mm',
                format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const userName = await getUserName(await getEmail());
            const yOffsetForm = marginTop + 25;
            const lineHeightForm = 4;

            const labelXPosition = marginLeft + 14;
            const label2XPosition = pageWidth - 90; // Posisi label2 di sebelah kanan
            const valueXPosition = labelXPosition + 40; // Posisi nilai di sebelah kiri
            const value2XPosition = label2XPosition + 40; // Posisi nilai di sebelah kanan

            const judulLaporan = '';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = jsonDetail.map((item) => [item.No, item.Kode, item.Nama, parseInt(item.HJ).toLocaleString(), parseInt(item.Qty).toLocaleString(), item.Satuan, parseInt(item.TotalHJ).toLocaleString()]);
            tableData.push(['', '', 'Total Items : ' + parseInt(jsonHeader.total_data).toLocaleString(), '', parseInt(jsonHeader.total).toLocaleString(), '', parseInt(jsonHeader.total_HJ).toLocaleString()]);

            doc.setFontSize(10);
            const dataGrid = [
                {
                    label: 'Faktur',
                    value: faktur,
                    label2: 'Tanggal',
                    value2: formatDatePdf(jsonHeader.tgl)
                },
                {
                    label: 'Dari',
                    value: jsonHeader.gudang_kirim,
                    label2: 'Ke',
                    value2: jsonHeader.gudang_terima
                }
            ];
            dataGrid.forEach((item, index) => {
                const yPosition = yOffsetForm + index * lineHeightForm;
                doc.text(item.label.toString(), labelXPosition, yPosition);
                doc.text(' : ', valueXPosition, yPosition, 'center');
                doc.text(item.value.toString(), valueXPosition + 5, yPosition);
                if (item.label2) {
                    // Cetak label2 dan value2 di sebelah kanan
                    doc.text(item.label2.toString(), label2XPosition, yPosition);
                    doc.text(' : ', value2XPosition, yPosition, 'center');
                    doc.text(item.value2.toString(), value2XPosition + 5, yPosition);
                }
            });

            doc.autoTable({
                startY: 45,
                head: [['NO', 'ITEM', 'NAMA BARANG', 'HARGA', 'QTY', 'UOM', 'TOTAL']],
                body: tableData,
                theme: 'plain',
                margin: {
                    top: marginTopInMm,
                    left: marginLeftInMm,
                    right: marginRightInMm
                },
                styles: {
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontSize: 8
                },
                columnStyles: {
                    0: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    6: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawCell: (data) => {
                    if (data.row.index !== null && data.cell.raw !== null) {
                        const { doc, row, column, styles } = data;
                        doc.setFillColor(255, 255, 255);
                    }
                },
                didDrawRow: (data) => {
                    if (data.row.index !== null) {
                        const rowData = tableData[data.row.index];
                        if (rowData && rowData.Keterangan === 'ASET') {
                            // Jika Jenis === 'I', maka set gaya teks menjadi bold
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
                didDrawPage: async function (data) {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
        } catch (error) {
            return console.log(error);
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
                    <Button label="Save" className="p-button-primary p-button mr-2" onClick={saveKirimStock} />
                    <Button
                        label="Cancel"
                        className="p-button-secondary p-button"
                        onClick={() => {
                            router.push('/transaksistock/mutasi-gudang');
                        }}
                    />
                </div>
            </React.Fragment>
        );
    };

    //  Yang Handle Laporan
    const handleAdjust = async () => {
        cetakSlip();
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>{isUpdateMode ? 'Edit' : 'Add'} Kirim Stock ke Gudang Lain</h4>
                <Toast ref={toast}></Toast>
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
                                    <label htmlFor="gudang">Dari Gudang</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={kodeDariGudang} />
                                        <InputText readOnly value={ketDariGudang} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="tgl">Tanggal</label>
                                    <div className="p-inputgroup">
                                        <Calendar disabled={readOnlyEdit} value={kirimStock.Tgl && kirimStock.Tgl ? new Date(kirimStock.Tgl) : new Date()} onChange={(e) => onInputChange(e, 'Tgl')} id="tgl" showIcon dateFormat="dd-mm-yy"></Calendar>
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-12">
                                    <label htmlFor="gudang">Ke Gudang</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly value={kodeKeGudang || kirimStock.KeGudang} />
                                        <Button icon="pi pi-search" className="p-button" onClick={toggleGudang} disabled={readOnlyEdit} />
                                        <InputText readOnly value={ketKeGudang || kirimStock.KetKeGudang} />
                                    </div>
                                </div>
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
                <hr></hr>
                <DataTable
                    loading={loading}
                    value={addKirimStock}
                    size="small"
                    lazy
                    dataKey="Kode"
                    // rows={10}
                    editMode="cell"
                    className="datatable-responsive editable-cells-"
                    responsiveLayout="scroll"
                    first={lazyState.first}
                    totalRecords={totalRecords}
                    onPage={onPage}
                    scrollable
                    scrollHeight="200px"
                >
                    <Column field="BARCODE" header="BARCODE"></Column>
                    <Column field="NAMA" header="NAMA"></Column>
                    <Column field="SATUAN" header="SATUAN"></Column>
                    <Column
                        field="SISASTOCKBARANG"
                        body={(rowData) => {
                            const value = rowData.SISASTOCKBARANG ? parseInt(rowData.SISASTOCKBARANG).toLocaleString() : "";
                            return value;
                        }}
                        header="SISA STOCK"
                    ></Column>
                    <Column
                        field="QTYKIRIM"
                        header="QTY KIRIM"
                        editor={(options) => cellEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        body={(rowData) => {
                            const value = rowData.QTYKIRIM ? parseInt(rowData.QTYKIRIM).toLocaleString() : "";
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
            <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={toggleProduk} handleProdukData={handleProdukData}></Produk>
            <AdjustPrintMarginPDF loadingPreview={loadingPreview} adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} />
            <Dialog visible={jsPdfPreviewOpen} onHide={hidePDF} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}

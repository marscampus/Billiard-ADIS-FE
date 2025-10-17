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
 * Created on Wed May 08 2024 - 09:26:46
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useRouter } from 'next/router';
import { DataTable } from 'primereact/datatable';
import { Column } from 'jspdf-autotable';
import { Toolbar } from 'primereact/toolbar';
import Gudang from '../../component/gudang';
import * as XLSX from 'xlsx';
import { convertToISODate, formatAndSetDate, formatDate, getEmail, getKeterangan, getUserName, showError } from '../../../component/GeneralFunction/GeneralFunction';
import postData from '../../../lib/Axios';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import jsPDF from 'jspdf';
import { Footer, Header, HeaderLaporan, addPageInfo } from '../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import PDFViewer from '../../../component/PDFViewer';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, '/transaksistock/stock-opname');
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {
            _A2F: context?.req?.cookies['_A2F']
        }
    };
};

export default function StockOpname() {
    const apiEndPointGet = '/api/stock-opname/data';
    const apiEndPointStore = '/api/stock-opname/store';
    const apiEndPointUpdate = '/api/stock-opname/update';
    const apiEndPointProsesAdjustment = '/api/stock-opname/proses-adjustment';
    const apiEndPointBatalAdjustment = '/api/stock-opname/batal-adjustment';
    const apiEndPointPostingAdjustment = '/api/stock-opname/posting-adjustment';

    const router = useRouter();
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const [stockOpname, setStockOpname] = useState([]);
    const [stockOpnameTabel, setStockOpnameTabel] = useState([]);
    const [stockOpnameTabelFilt, setStockOpnameTabelFilt] = useState([]);
    const [gudangDialog, setGudangDialog] = useState(false);
    const [gudangKode, setGudangKode] = useState('');
    const [gudangKet, setGudangKet] = useState('');
    const [file, setFile] = useState(null);
    const [tgl, setTgl] = useState(new Date());
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [totalStockAkhir, setTotalStockAkhir] = useState(0);
    const [totalStockOpname, setTotalStockOpname] = useState(0);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [grandTotalHPP, setGrandTotalHPP] = useState(0);
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const [search, setSearch] = useState('');
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const [defaultOption, setDropdownValue] = useState(null);
    const dropdownValues = [
        { name: 'so.Kode', label: 'Kode' },
        { name: 'so.Barcode', label: 'Barcode' },
        { name: 'so.Nama', label: 'Nama' }
    ];

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    // useEffect(() => {
    //     loadLazyData();
    // }, [lazyState]);

    // Yang Handle Refresh
    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                ...lazyState,
                Tgl: convertToISODate(tgl),
                Gudang: gudangKode
            };
            if (gudangKode == null || stockOpname == undefined || stockOpname == '') {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Masih Kosong!', life: 3000 });
                return;
            }
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;

            // Add index to each row
            const dataWithIndex = json?.data?.map((item, index) => ({
                ...item,
                index: first + index + 1 // Calculate the index based on the current page and row index
            }));

            setTotalRecords(json.total_data);
            setStockOpnameTabel(dataWithIndex);
            setGrandTotalHPP(json.total.totalHPP);
            setTotalStockAkhir(json.total.totalStockAkhir);
            setTotalStockOpname(json.total.totalQtyOpname);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Tanggal
    const handleStartDate = (e) => {
        setTgl(e.value);
    };

    const handleStartDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTgl);
    };

    // Yang Handle Template
    const handleTemplate = () => {
        const filePath = '/template/TemplateStockOpname.xlsx';
        const link = document.createElement('a');
        link.href = filePath;
        link.download = 'TemplateStockOpname.xlsx';
        link.click();
    };

    // Yang Handle Masukin Excel
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        setFile(file);
        if (file) {
            setLoading(true);
            const formData = new FormData();
            formData.append('excel_file', file);

            const reader = new FileReader();
            reader.onload = async (e) => {
                const binaryString = e.target.result;
                const workbook = XLSX.read(binaryString, { type: 'binary' });

                // Baca Sheet SCAN
                const sheetScan = workbook.SheetNames[0];
                const worksheetScan = workbook.Sheets[sheetScan];
                const jsonDataScan = XLSX.utils.sheet_to_json(worksheetScan);

                // Menghitung Total dari STOCK_AKHIR
                let totalStockAkhir = 0;
                let totalStockOpname = 0;
                console.log(jsonDataScan);

                jsonDataScan.forEach((item) => {
                    // Konversi nilai qty menjadi tipe data numerik
                    const qtyStockAkhir = parseFloat(item.STOCK_AKHIR || 0);
                    totalStockAkhir += qtyStockAkhir;

                    // Set QTY_OPNAME ke 0 jika tidak ada
                    const qtyOpname = parseFloat(item.QTY_OPNAME || 0);
                    totalStockOpname += qtyOpname;

                    // Ensure QTY_OPNAME is set to 0 if missing
                    item.QTY_OPNAME = qtyOpname;
                });
                setTotalStockAkhir(totalStockAkhir);
                setTotalStockOpname(totalStockOpname);

                // Baca Sheet Daftar Stock Opname Inventory
                const sheetInventory = workbook.SheetNames[1];
                const worksheetInventory = workbook.Sheets[sheetInventory];
                const jsonDataInventory = XLSX.utils.sheet_to_json(worksheetInventory);

                // Menghitung Total HPP
                let totalHPP = 0;
                jsonDataInventory.forEach((item) => {
                    const hppValue = parseFloat(item.HARGA_POKOK || 0);
                    totalHPP += hppValue;
                });
                setGrandTotalHPP(totalHPP);

                // Menggabungkan Kedua Data
                const combinedData = jsonDataScan.map((itemScan, index) => {
                    const matchedItem = jsonDataInventory.find((itemInventory) => {
                        return itemScan.BARCODE === itemInventory.BARCODE;
                    });
                    return {
                        ...itemScan,
                        index: index + 1, // Add index here
                        SATUAN: matchedItem ? matchedItem.SATUAN : null,
                        HARGABELI: matchedItem ? matchedItem.HARGA_BELI : null,
                        HARGAPOKOK: matchedItem ? matchedItem.HARGA_POKOK : null,
                        HARGAJUAL: matchedItem ? matchedItem.HARGA_JUAL : null,
                        QTY_OPNAME: itemScan.QTY_OPNAME || 0 // Ensure QTY_OPNAME is set to 0 if missing
                    };
                });

                setStockOpnameTabel(combinedData);
                setLoading(false);
            };
            reader.readAsBinaryString(file);
        }
    };

    // Yang Edit in Cell
    const cellEditor = (options) => {
        return textEditor(options);
    };

    const textEditor = (options) => {
        return <InputText value={options.value} keyfilter={/^[0-9,.]*$/} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field } = e;
        switch (field) {
            case 'QTY_OPNAME':
                const editedQty = parseFloat(newValue.replace(',', '.'));
                if (!isNaN(editedQty)) {
                    // Update nilai QTY_OPNAME di stockOpnameTabel
                    const updatedAddPackingStockOpname = stockOpnameTabel.map((item) => {
                        if (item.BARCODE === rowData.BARCODE && item.KODE === rowData.KODE) {
                            // Update nilai QTY_OPNAME item yang sedang diedit
                            // updateStockOpname({ ...item, QTY_OPNAME: editedQty });
                            return { ...item, QTY_OPNAME: editedQty };
                        } else {
                            return item;
                        }
                    });

                    // Perbarui state stockOpnameTabel dengan nilai yang diperbarui
                    setStockOpnameTabel(updatedAddPackingStockOpname);

                    // Hitung total baru dari kolom QTY_OPNAME setelah perubahan
                    const updatedTotalStockOpname = updatedAddPackingStockOpname.reduce((total, item) => {
                        total += item.QTY_OPNAME ? parseFloat(item.QTY_OPNAME) : 0;
                        return total;
                    }, 0);

                    // Perbarui state atau variabel yang menyimpan total
                    setTotalStockOpname(updatedTotalStockOpname);
                } else {
                    console.log('Invalid input. Please enter a valid number for StockOpname.');
                }
                break;
            default:
                break;
        }
    };

    // Yang Handle Proses Adjustment
    const prosesAdjustment = async (dataStockOpname) => {
        try {
            const requestBody = {
                Tgl: convertToISODate(tgl),
                Gudang: gudangKode,
                data: dataStockOpname
            };
            if (gudangKode == null) {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Masih Kosong!', life: 3000 });
                return;
            }
            const response = await postData(apiEndPointProsesAdjustment, requestBody);
            const json = response.data;
            router.push('/transaksistock/stock-opname');
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Proses Adjustmen Berhasil', life: 3000 });
            // if (json.status === 'success') {
            // } else {
            //     toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
            // }
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // Yang Handle Batal Adjustment
    const batalAdjustment = async () => {
        try {
            const requestBody = {
                Tgl: convertToISODate(tgl),
                Gudang: gudangKode
            };
            const response = await postData(apiEndPointBatalAdjustment, requestBody);
            const json = response.data;
            router.push('/transaksistock/stock-opname');
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Membatalkan Adjustment', life: 3000 });
            // if (json.status === 'success') {
            // } else {
            //     toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
            // }
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // Yang Handle Posting Jurnal
    const postingAdjustment = async (dataStockOpname) => {
        try {
            const requestBody = {
                Tgl: convertToISODate(tgl),
                Gudang: gudangKode,
                data: dataStockOpname
            };
            if (gudangKode == null) {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Masih Kosong!', life: 3000 });
                return;
            }
            const response = await postData(apiEndPointPostingAdjustment, requestBody);
            const json = response.data;
            console.log(json);
            router.push('/transaksistock/stock-opname');
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Posting Adjustmen Berhasil', life: 3000 });
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    // Yang Handle Gudang
    const btnGudang = () => {
        setGudangDialog(true);
    };
    const handleGudangData = (gudangKode, gudangKet) => {
        setGudangKode(gudangKode);
        setGudangKet(gudangKet);
        setStockOpname((prevStockOpname) => ({
            ...prevStockOpname,
            GUDANG: gudangKode
        }));
    };

    // Yang Handle Upload File
    const confirmUpload = () => {
        if (gudangKode == null || gudangKode == '') {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Masih Kosong!', life: 3000 });
            return;
        }

        document.getElementById('excelFileInput').click();
    };

    //Yang Handle Save
    const saveStockOpname = async (dataStockOpname) => {
        try {
            const requestBody = {
                Tgl: convertToISODate(tgl),
                Gudang: gudangKode,
                data: dataStockOpname
            };
            if (gudangKode == null) {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Gudang Masih Kosong!', life: 3000 });
                return;
            }
            const response = await postData(apiEndPointStore, requestBody);
            const json = response.data;
            router.push('/transaksistock/stock-opname');
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Menyimpan Data', life: 3000 });
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    //Yang Handle Update
    const updateStockOpname = async (dataStockOpname) => {
        try {
            const requestBody = {
                Tgl: convertToISODate(tgl),
                Gudang: gudangKode,
                data: dataStockOpname
            };
            const response = await postData(apiEndPointUpdate, requestBody);
            const json = response.data;
            router.push('/transaksistock/stock-opname');
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Menyimpan Data', life: 3000 });
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    //  Yang Handle Laporan Nilai Persediaan
    const toLaporan = () => {
        router.push('/laporan/laporan-transaksi-stock/laporan-nilai-persediaan');
    };

    useEffect(() => {
        setStockOpnameTabelFilt(stockOpnameTabel);
    }, [stockOpnameTabel, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = stockOpnameTabel.filter((d) => (x ? x.test(d.BARCODE) || x.test(d.KODE) || x.test(d.NAMA_PRODUK) || x.test(d.SATUAN) || x.test(d.Satuan) : []));
            setSearch(searchVal);
        }

        setStockOpnameTabelFilt(filtered);
    };

    // Yang Handle Search
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const footernya = () => {
        return (
            <React.Fragment>
                <div className="formgrid grid">
                    <div className="field col-12 mb-2 lg:col-12">
                        <div className="formgrid grid">
                            <div className="field col-6 lg:col-6">
                                <Button label="Posting Jurnal Stock Opname" icon="pi pi-file-o" outlined className="p-button-secondary p-button-md w-full" onClick={(e) => postingAdjustment(stockOpnameTabel)} />
                            </div>
                            <div className="field col-6 lg:col-6">
                                <Button label="Laporan Nilai Persediaan" icon="pi pi-file-o" outlined className="p-button-secondary p-button-md w-full" onClick={(e) => toLaporan()} />
                            </div>
                        </div>
                    </div>
                    <div className="field col-12 mb-2 lg:col-12">
                        <div className="formgrid grid">
                            <div className="field col-4 lg:col-4">
                                <Button label="Proses Adjustment" icon="pi pi-print" outlined className="p-button-secondary p-button-md w-full" onClick={(e) => prosesAdjustment(stockOpnameTabel)} />
                            </div>
                            <div className="field col-4 lg:col-4">
                                <Button label="Batal Adjustment" icon="pi pi-print" outlined className="p-button-secondary p-button-md w-full" onClick={(e) => batalAdjustment()} />
                            </div>
                            <div className="field col-4 lg:col-4">
                                <Button label="Preview" icon="pi pi-print" outlined className="p-button-secondary p-button-md w-full" onClick={btnAdjust} />
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Refresh" icon="pi pi-refresh" className="p-button-sm mr-2 mt-3" onClick={loadLazyData} />
                <Button label="Download Template" icon="pi pi-download" className="p-button-sm mr-2 mt-3" onClick={handleTemplate} />
                <React.Fragment>
                    <div>
                        <input type="file" id="excelFileInput" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
                        <label htmlFor="excelFileInput">
                            <Button label="Import Excel" icon="pi pi-file-import" className="p-button-sm mr-2 mt-3" onClick={confirmUpload} />
                        </label>
                    </div>
                </React.Fragment>
            </React.Fragment>
        );
    };

    // Yang Handle Preview
    const btnAdjust = () => {
        // return console.log(stockOpnameTabel);
        if (stockOpnameTabelFilt.length == 0 || !stockOpnameTabelFilt) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    // Yang Handle PDF
    const exportPDF = async (dataAdjust) => {
        try {
            const stockOpnamePDF = stockOpnameTabelFilt ? JSON.parse(JSON.stringify(stockOpnameTabelFilt)) : [];

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!stockOpnamePDF || stockOpnamePDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Stock Opname';
            const periodeLaporan = 'Tanggal ' + formatDate(tgl);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = stockOpnamePDF.map((item) => [
                item.BARCODE,
                item.KODE,
                item.NAMA_PRODUK,
                item.SATUAN,
                parseInt(item.HARGABELI).toLocaleString(),
                parseInt(item.HARGAJUAL).toLocaleString(),
                parseInt(item.HARGAPOKOK).toLocaleString(),
                parseInt(item.STOCK_AKHIR).toLocaleString(),
                parseInt(item.QTY_OPNAME).toLocaleString()
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['BARCODE', 'KODE', 'NAMA PRODUK', 'SATUAN', 'HARGA BELI', 'HARGA POKOK', 'HARGA JUAL', 'STOCK AKHIR', 'STOCK OPNAME']],
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
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawPage: (data) => {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
            setLoadingPreview(false);
        } catch (error) {
            console.log(error);
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(stockOpnameTabelFilt, 'laporan-stock-opname.xlsx');
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>Stock Opname</h4>
                <hr />
                <Toast ref={toast}></Toast>
                {/* <Panel header="Filter" toggleable> */}
                <div className="formgrid grid">
                    <div className="field col-6 mb-2 lg:col-6">
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="faktur">Tanggal</label>
                                <div className="p-inputgroup">
                                    <Calendar
                                        name="startDate"
                                        // disabled
                                        value={tgl}
                                        onInput={handleStartDateChange}
                                        onChange={handleStartDate}
                                        dateFormat="dd-mm-yy"
                                        showIcon
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="field col-6 mb-2 lg:col-6">
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="gudang">Gudang</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="gudang_kode" value={gudangKode} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnGudang} />
                                    <InputText readOnly id="ket-Gudang" value={gudangKet} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* </Panel> */}
                <Toolbar className="mb-2" right={rightToolbarTemplate}></Toolbar>
                <DataTable
                    value={stockOpnameTabelFilt}
                    filters={lazyState.filters}
                    header={headerSearch}
                    first={first} // Menggunakan nilai halaman pertama dari state
                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                    paginator
                    paginatorTemplate={`FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown`}
                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                    totalRecords={totalRecords} // Total number of records
                    size="small"
                    loading={loading}
                    emptyMessage="Data Kosong"
                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                    scrollable
                    // scrollHeight="200px"
                    frozenFooter
                >
                    <Column headerStyle={{ textAlign: 'center' }} field="index" header="NO" body={(rowData) => rowData.index}></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="NAMA_PRODUK" header="NAMA PRODUK"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="SATUAN" header="SATUAN" footer={'TOTAL'}></Column>
                    <Column
                        field="HARGABELI"
                        body={(rowData) => {
                            const value = rowData.HARGABELI ? parseInt(rowData.HARGABELI).toLocaleString() : 0;
                            return value;
                        }}
                        header="HARGA BELI"
                        headerStyle={{ textAlign: 'center' }}
                    ></Column>
                    <Column
                        field="HARGAPOKOK"
                        body={(rowData) => {
                            const value = rowData.HARGAPOKOK ? parseInt(rowData.HARGAPOKOK).toLocaleString() : 0;
                            return value;
                        }}
                        footer={parseInt(grandTotalHPP).toLocaleString()}
                        header="HPP"
                        headerStyle={{ textAlign: 'center' }}
                    ></Column>
                    <Column
                        field="HARGAJUAL"
                        body={(rowData) => {
                            const value = rowData.HARGAJUAL ? parseInt(rowData.HARGAJUAL).toLocaleString() : 0;
                            return value;
                        }}
                        header="HARGA JUAL"
                        headerStyle={{ textAlign: 'center' }}
                    ></Column>
                    <Column
                        field="STOCK_AKHIR"
                        body={(rowData) => {
                            const value = rowData.STOCK_AKHIR ? parseInt(rowData.STOCK_AKHIR).toLocaleString() : 0;
                            return value;
                        }}
                        footer={parseInt(totalStockAkhir).toLocaleString()}
                        header="STOCK AKHIR"
                        headerStyle={{ textAlign: 'center' }}
                    ></Column>
                    <Column
                        field="QTY_OPNAME"
                        header="STOCK OPNAME"
                        editor={(options) => cellEditor(options)}
                        onCellEditComplete={onCellEditComplete}
                        body={(rowData) => {
                            const value = rowData.QTY_OPNAME ? parseFloat(rowData.QTY_OPNAME).toLocaleString() : '0';
                            return value;
                        }}
                        footer={parseInt(totalStockOpname).toLocaleString()}
                        headerStyle={{ textAlign: 'center' }}
                    ></Column>
                </DataTable>
                <Toolbar className="mb-2" center={footernya}></Toolbar>
            </div>
            <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}

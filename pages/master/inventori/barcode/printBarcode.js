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
import { Paginator } from 'primereact/paginator';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { formatDateSave, getYMD, formatRibuan, formatDateTable } from '../../../../component/GeneralFunction/GeneralFunction';
import postData from '../../../../lib/Axios';
import Produk from '../../../component/produk';
import AdjustPrintMargin from '../../../component/adjustPrintMargin';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import AutoTable from 'jspdf-autotable';

export default function PrintBarcode({ printBarcodeDialog, hideBarcodePrintDialog, deletePrintBarcodeDialog, setDeletePrintBarcodeDialog, printBarcode, setPrintBarcode }) {
    const apiEndPointGetBarcode = '/api/kasir/get_barcode';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingPrintBarcode, setLoadingPrintBarcode] = useState(false);
    const [printBarcodeTabel, setPrintBarcodeTabel] = useState([]);
    const [defaultOption, setDropdownValue] = useState(null);
    // const [printBarcodeTabel, setPrintBarcodeTabel] = useState([]);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const toast = useRef(null);
    const op = useRef(null);
    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        // loadLazyData();
    }, [lazyState]);

    // useEffect(() => {
    //     generateBarcode(printBarcodeTabel);
    // }, [printBarcodeTabel]);

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || e.value;
        let _data = { ...printBarcode };
        _data[`${name}`] = val;
        setPrintBarcode(_data);
    };
    // -----------------------------------------------------------------------------------------------------------------< PrintBarcode >
    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'KETERANGAN', label: 'KETERANGAN' }
    ];
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
    // ---------------------------------------------------------------------------------------------< Search Barcode by inputan (enter) >
    const [timer, setTimer] = useState(null);
    const handleBarcodeKeyDown = async (event) => {
        clearTimeout(timer);
        const newTimer = setTimeout(async () => {
            if (event.key === 'Enter') {
                const barcodeInput = '69'; //document.getElementById("KODE_TOKO");
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

                const params = { data: { KODE_TOKO: enteredBarcodeValue }, skipSelectBarcode: true, JUMLAH: enteredQty };
                console.log(params.JUMLAH);
                await handleProduk(params);

                // barcodeInput.value = "";
            }
        }, 100);
        setTimer(newTimer);
    };
    // -----------------------------------------------------------------------------------------------------------------< Adjust Print Margin >
    const [adjustDialog, setAdjustDialog] = useState(false);
    const btnAdjust = () => {
        console.log(printBarcodeTabel);
        if (printBarcodeTabel.length == 0 || !printBarcodeTabel) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        // return;
        cetakBarcode(dataAdjust);
        // setDataAdjust(data);
    };
    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [dataProduk, setDataProduk] = useState('');
    const btnProduk = () => {
        setProdukDialog(true);
    };

    const handleProduk = async (params) => {
        console.log('params', params);
        // By Enter
        let selectedKode;
        if (params?.skipSelectBarcode) {
            selectedKode = params.data.KODE_TOKO;
        } else {
            selectedKode = params.KODE_TOKO;
        }
        try {
            const vaTable = await postData(apiEndPointGetBarcode, { KODE_TOKO: `%${selectedKode}%` });
            const json = vaTable.data;
            console.log('json A', json);

            if (json.status === 'BARANG TIDAK DITEMUKAN') {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Barang Tidak Ditemukan', life: 3000 });
                return;
            }
            setDataProduk(json);
            setPrintBarcode((prevPrintBarcode) => ({
                ...prevPrintBarcode,
                KODE_TOKO: json[0].BARCODE,
                KODE: json[0].KODE,
                NAMA: json[0].NAMA,
                HJ: json[0].HJ,
                JUMLAH: params.JUMLAH || 1
            }));
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kesalahan proses', life: 3000 });
        }
    };
    const tambahData = async (e) => {
        if (!printBarcode.KODE_TOKO) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Barcode Masih Kosong', life: 3000 });
            return;
        }
        e.preventDefault();
        setNull();
        const enteredQty = printBarcode.JUMLAH || 1;
        const valBarcode = dataProduk[0].BARCODE;
        console.log('dataProduk ya', dataProduk);

        const existingIndex = printBarcodeTabel.findIndex((item) => item.KODE_TOKO === valBarcode);
        console.log('enteredQty', existingIndex);
        if (existingIndex !== -1) {
            // -----------------------------------------< Sudah Ada >
            setPrintBarcodeTabel((prevPrintBarcodeTabel) => {
                const updatedData = [...prevPrintBarcodeTabel];
                const addedData = updatedData[existingIndex];
                const updatedJumlah = parseInt(addedData.JUMLAH) + enteredQty;
                console.log('updatedJumlah', updatedJumlah);
                updatedData[existingIndex] = {
                    ...addedData,
                    JUMLAH: updatedJumlah
                };
                return updatedData;
            });
        } else {
            // -----------------------------------------< Belum Ada >
            const addedData = dataProduk[0];
            console.log('addedData', addedData);
            const jsonWithDefaultQty = dataProduk.map((item) => ({ ...item, JUMLAH: enteredQty, KODE_TOKO: addedData.BARCODE }));
            setPrintBarcodeTabel((prevPrintBarcodeTabel) => [...prevPrintBarcodeTabel, { ...addedData, JUMLAH: enteredQty, KODE_TOKO: addedData.BARCODE }, ...jsonWithDefaultQty.slice(1)]);
        }
    };

    const generateBarcode = () => {
        printBarcodeTabel.forEach((item) => {
            const { KODE_TOKO } = item;
            const text = `${KODE_TOKO}`;

            // Membuat elemen canvas untuk menyimpan barcode
            const canvas = document.createElement('canvas');
            JsBarcode(canvas, text, {
                format: 'CODE128', // Format barcode yang digunakan
                displayValue: false // Menyembunyikan teks di sekitar barcode
            });

            // Mengubah elemen canvas menjadi data URL
            const imgData = canvas.toDataURL('image/png');

            // Membuat elemen img baru dan menetapkan src-nya ke imgData
            const img = document.createElement('img');
            img.src = imgData;

            // Menambahkan elemen img ke dalam DOM, misalnya ke dalam sebuah div dengan id "barcodeContainer"
            document.getElementById('barcodeContainer').appendChild(img);
        });
    };

    const cetakBarcodePadding = (dataAdjust) => {
        const pdf = new jsPDF('p', 'mm', [dataAdjust.paperWidth, Infinity]);
        const kolomWidth = 50; // lebar kolom
        const kolomHeight = 25; // tinggi kolom
        const imgHeight = 14; // tinggi barcode
        const jarakCell = dataAdjust.betweenCells; // Mengatur jarak antar kolom dan baris
        let x = dataAdjust.marginLeft; // Mengatur posisi awal cetakan
        let y = dataAdjust.marginTop; // Mengatur posisi awal cetakan
        const marginBottom = dataAdjust.marginBottom; // Mengatur margin bottom
        const marginRight = dataAdjust.marginRight; // Mengatur margin right
        const printableWidth = dataAdjust.paperWidth - (marginRight + dataAdjust.marginLeft); // Mengurangi margin bottom dan margin right dari ukuran kertas untuk mendapatkan posisi awal cetakan
        const printableHeight = dataAdjust.paperHeight - (marginBottom + dataAdjust.marginTop);
        let kolomIndex = 0; // Variabel untuk melacak kolom dan baris
        let barisIndex = 0; // Variabel untuk melacak kolom dan baris
        const maxKolom = Math.floor((dataAdjust.paperWidth - marginRight - dataAdjust.marginLeft) / (kolomWidth + jarakCell)); // Hitung jumlah maksimum kolom yang muat dalam lebar kertas

        printBarcodeTabel.forEach((item, index) => {
            for (let i = 0; i < item.JUMLAH; i++) {
                const { KODE_TOKO } = item;
                const text = `${KODE_TOKO}`;
                const canvas = document.createElement('canvas');
                JsBarcode(canvas, text, {
                    format: 'CODE128',
                    displayValue: false
                });
                const imgData = canvas.toDataURL('image/png');

                const paddingTop = 12 || 0; // Tambahkan default value
                const paddingLeftRight = 12 || 0; // Tambahkan default value

                pdf.setFontSize(10);

                const adjustedX = x + kolomIndex * (kolomWidth + jarakCell) + paddingLeftRight;
                const adjustedY = y + barisIndex * (kolomHeight + jarakCell) + paddingTop;

                pdf.text(`${item.NAMA}`, adjustedX, adjustedY);

                const adjustedImgHeight = imgHeight - paddingTop; // Kurangi tinggi gambar dengan paddingTop
                pdf.addImage(imgData, 'PNG', adjustedX, adjustedY + paddingTop, kolomWidth - 2 * paddingLeftRight, adjustedImgHeight);

                const adjustedFontSize = 10 - paddingTop / 2; // Kurangi ukuran font dengan setengah nilai paddingTop
                pdf.setFontSize(adjustedFontSize);

                pdf.text(`${item.KODE_TOKO}`, adjustedX + kolomWidth / 2, adjustedY + imgHeight + 2 + paddingTop, { align: 'center' });

                const adjustedPriceFontSize = 10 - paddingTop / 4; // Kurangi ukuran font harga dengan seperempat nilai paddingTop
                pdf.setFontSize(adjustedPriceFontSize);

                pdf.text(`Rp. ${item.HJ.toLocaleString()}`, adjustedX, adjustedY + imgHeight + 7 + paddingTop, { align: 'left' });

                kolomIndex++;
                if (kolomIndex >= maxKolom) {
                    kolomIndex = 0;
                    barisIndex++;
                }
            }
        });

        const pdfDataUrl = pdf.output('datauristring');
        const printWindow = window.open(pdfDataUrl);
        printWindow.print();
    };

    const cetakBarcodeot = (dataAdjust) => {
        // Membuat instance dari jsPDF
        const pdf = new jsPDF('p', 'mm', [dataAdjust.paperWidth, Infinity]);

        // Mengatur lebar dan tinggi setiap kolom
        const kolomWidth = 50; // lebar kolom
        const kolomHeight = 25; // tinggi kolom
        const imgHeight = 14; // tinggi barcode

        // Mengatur jarak antar kolom dan baris
        const jarakCell = dataAdjust.betweenCells;

        // Mengatur posisi awal cetakan
        let x = dataAdjust.marginLeft;
        let y = dataAdjust.marginTop;
        // Mengatur margin bottom dan margin right
        const marginBottom = dataAdjust.marginBottom;
        const marginRight = dataAdjust.marginRight;

        // Mengurangi margin bottom dan margin right dari ukuran kertas untuk mendapatkan posisi awal cetakan
        const printableWidth = dataAdjust.paperWidth - (marginRight + dataAdjust.marginLeft);
        const printableHeight = dataAdjust.paperHeight - (marginBottom + dataAdjust.marginTop);

        // Variabel untuk melacak kolom dan baris
        let kolomIndex = 0;
        let barisIndex = 0;

        // Hitung jumlah maksimum kolom yang muat dalam lebar kertas
        // const maxKolom = Math.floor((dataAdjust.paperWidth - 2 * x) / (kolomWidth + jarakCell));    // paperWidth
        // const maxKolom = Math.floor(printableWidth / (kolomWidth + jarakCell));     //margin2
        const maxKolom = Math.floor((dataAdjust.paperWidth - marginRight - dataAdjust.marginLeft) / (kolomWidth + jarakCell)); // margin + paperWidth

        // Loop untuk setiap data
        printBarcodeTabel.forEach((item, index) => {
            // Menentukan berapa kali data akan dicetak berdasarkan nilai JUMLAH
            for (let i = 0; i < item.JUMLAH; i++) {
                const { KODE_TOKO } = item;
                const text = `${KODE_TOKO}`;

                // Menambahkan padding sebanyak 15
                const padding = 15;
                const paddedX = x + padding;
                const paddedY = y + padding;

                // Membuat elemen canvas untuk menyimpan barcode
                const canvas = document.createElement('canvas');
                JsBarcode(canvas, text, {
                    format: 'CODE128', // Format barcode yang digunakan
                    displayValue: false // Menyembunyikan teks di sekitar barcode
                });
                // Mengubah elemen canvas menjadi data URL
                const imgData = canvas.toDataURL('image/png');

                // Menambahkan data ke PDF
                // pdf.setFontSize(8);
                // pdf.text(`${item.NAMA}`, x + (kolomIndex * (kolomWidth + jarakCell)), y + (barisIndex * (kolomHeight + jarakCell)));
                // pdf.addImage(imgData, 'PNG', x + (kolomIndex * (kolomWidth + jarakCell)), y + (barisIndex * (kolomHeight + jarakCell)), kolomWidth, imgHeight);
                // pdf.setFontSize(8);
                // pdf.text(`${item.KODE_TOKO}`, x + (kolomIndex * (kolomWidth + jarakCell)) + kolomWidth / 2, y + imgHeight + 2 + (barisIndex * (kolomHeight + jarakCell)), { align: "center" });
                // pdf.setFontSize(8);
                // pdf.text(`Rp. ${item.HJ.toLocaleString()}`, x + (kolomIndex * (kolomWidth + jarakCell)), y + imgHeight + 7 + (barisIndex * (kolomHeight + jarakCell)), { align: "left" });

                pdf.setFontSize(10);
                pdf.text(`${item.NAMA}`, paddedX + kolomIndex * (kolomWidth + jarakCell), paddedY + barisIndex * (kolomHeight + jarakCell));
                pdf.addImage(imgData, 'PNG', paddedX + kolomIndex * (kolomWidth + jarakCell), paddedY + barisIndex * (kolomHeight + jarakCell), kolomWidth, imgHeight);
                pdf.setFontSize(8);
                pdf.text(`${item.KODE_TOKO}`, paddedX + kolomIndex * (kolomWidth + jarakCell) + kolomWidth / 2, paddedY + imgHeight + 2 + barisIndex * (kolomHeight + jarakCell), { align: 'center' });
                pdf.setFontSize(10);
                pdf.text(`Rp. ${item.HJ.toLocaleString()}`, paddedX + kolomIndex * (kolomWidth + jarakCell), paddedY + imgHeight + 7 + barisIndex * (kolomHeight + jarakCell), { align: 'left' });

                // Pindah ke kolom berikutnya atau baris berikutnya jika sudah mencapai batas kolom
                kolomIndex++;
                if (kolomIndex >= maxKolom) {
                    kolomIndex = 0;
                    barisIndex++;
                }
            }
        });
        // Mendapatkan data URL dokumen PDF
        const pdfDataUrl = pdf.output('datauristring');
        // Membuka jendela baru untuk menampilkan pratinjau dokumen PDF
        const printWindow = window.open(pdfDataUrl);
        // Mencetak dokumen PDF
        printWindow.print();
    };
    const cetakBarcode = (dataAdjust) => {
        // Membuat instance dari jsPDF
        const pdf = new jsPDF('p', 'mm', [dataAdjust.paperWidth, Infinity]);

        // Mengatur lebar dan tinggi setiap kolom
        const kolomWidth = 50; // lebar kolom
        const kolomHeight = 25; // tinggi kolom
        const imgHeight = dataAdjust.imgHeight; // tinggi barcode

        // Mengatur jarak antar kolom dan baris
        const jarakCell = dataAdjust.betweenCells;

        // Mengatur posisi awal cetakan
        let x = dataAdjust.marginLeft;
        let y = dataAdjust.marginTop;

        // Mengatur margin bottom dan margin right
        const marginBottom = dataAdjust.marginBottom;
        const marginRight = dataAdjust.marginRight;

        // Mengurangi margin bottom dan margin right dari ukuran kertas untuk mendapatkan posisi awal cetakan
        const printableWidth = dataAdjust.paperWidth - (marginRight + dataAdjust.marginLeft);
        const printableHeight = dataAdjust.paperHeight - (marginBottom + dataAdjust.marginTop);

        // Variabel untuk melacak kolom dan baris
        let kolomIndex = 0;
        let barisIndex = 0;

        // Hitung jumlah maksimum kolom yang muat dalam lebar kertas
        const maxKolom = Math.floor((dataAdjust.paperWidth - marginRight - dataAdjust.marginLeft) / (kolomWidth + jarakCell));

        // Loop untuk setiap data
        printBarcodeTabel.forEach((item, index) => {
            // Menentukan berapa kali data akan dicetak berdasarkan nilai JUMLAH
            for (let i = 0; i < item.JUMLAH; i++) {
                const { KODE_TOKO } = item;
                const text = `${KODE_TOKO}`;

                // Menambahkan padding sebanyak 15
                const paddingTop = dataAdjust.paddingTop;
                const paddingLeft = dataAdjust.paddingLeft;
                const paddedX = x + paddingLeft;
                const paddedY = y + paddingTop;

                // Membuat elemen canvas untuk menyimpan barcode
                const canvas = document.createElement('canvas');
                JsBarcode(canvas, text, {
                    format: 'CODE128', // Format barcode yang digunakan
                    displayValue: false // Menyembunyikan teks di sekitar barcode
                });
                // Mengubah elemen canvas menjadi data URL
                const imgData = canvas.toDataURL('image/png');

                // Menambahkan data ke PDF
                pdf.setFontSize(dataAdjust.fontNama);
                const nama = item.NAMA.length > 15 ? item.NAMA.substring(0, 15) + '...' : item.NAMA;
                pdf.text(nama, paddedX + kolomIndex * (kolomWidth + jarakCell), paddedY + barisIndex * (kolomHeight + jarakCell));
                pdf.addImage(imgData, 'PNG', paddedX + kolomIndex * (kolomWidth + jarakCell), paddedY + barisIndex * (kolomHeight + jarakCell), kolomWidth, imgHeight);
                pdf.setFontSize(dataAdjust.fontKode);
                pdf.text(`${item.KODE_TOKO}`, paddedX + kolomIndex * (kolomWidth + jarakCell) + kolomWidth / 2, paddedY + imgHeight + 3 + barisIndex * (kolomHeight + jarakCell), { align: 'center' });
                pdf.setFontSize(dataAdjust.fontNama);
                pdf.text(`Rp. ${item.HJ.toLocaleString()}`, paddedX + kolomIndex * (kolomWidth + jarakCell), paddedY + imgHeight + 8 + barisIndex * (kolomHeight + jarakCell), { align: 'left' });

                // Pindah ke kolom berikutnya atau baris berikutnya jika sudah mencapai batas kolom
                kolomIndex++;
                if (kolomIndex >= maxKolom) {
                    kolomIndex = 0;
                    barisIndex++;
                }
            }
        });

        // Mendapatkan data URL dokumen PDF
        const pdfDataUrl = pdf.output('datauristring');
        // Membuka jendela baru untuk menampilkan pratinjau dokumen PDF
        const printWindow = window.open(pdfDataUrl);
        // Mencetak dokumen PDF
        printWindow.print();
    };

    const headerPrintBarcode = (
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
    const barcodePrintDialogFooter = (
        <>
            <Button label="Batal" icon="pi pi-times" className="p-button-text" onClick={hideBarcodePrintDialog} />
            <Button label="Cetak" icon="pi pi-check" className="p-button-text" onClick={btnAdjust} />
            {/* onClick={savePrintBarcode} cetakBarcode */}
        </>
    );

    const textEditor = (options) => {
        return <InputText type="number" step="any" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        // --- Kondisi edit field TERIMA, melakukan perhitungan TERIMA * HARGA
        switch (field) {
            case 'JUMLAH':
                const existingIndex2 = printBarcodeTabel.findIndex((item) => item.KODE === rowData.KODE);
                if (existingIndex2 !== -1) {
                    const updatedAddData = [...printBarcodeTabel];
                    updatedAddData[existingIndex2] = {
                        ...updatedAddData[existingIndex2],
                        JUMLAH: newValue
                    };
                    setPrintBarcodeTabel(updatedAddData);
                }
                break;
            default:
                event.preventDefault();
                break;
        }
    };

    const setNull = () => {
        console.log('masuk setNull', printBarcode);
        setPrintBarcode({
            KODE_TOKO: '',
            KODE: '',
            NAMA: '',
            HJ: '',
            JUMLAH: ''
        });
    };

    const deleteSelectedRow = (rowData) => {
        const updatedData = printBarcodeTabel.filter((row) => row !== rowData);
        setPrintBarcodeTabel(updatedData);
    };
    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };
    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <Toast ref={toast} />
                {/* Dialog Print Barcode */}
                <Dialog visible={printBarcodeDialog} style={{ width: '75%' }} header="Print Barcode" modal className="p-fluid" footer={barcodePrintDialogFooter} onHide={hideBarcodePrintDialog}>
                    <div className="formgrid grid">
                        <div id="barcodeContainer"></div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="barcode">Barcode</label>
                            <div className="p-inputgroup">
                                {/* value={printBarcode.KODE_TOKO} onChange={(e) => onInputChange(e, "KODE_TOKO")}  */}
                                <InputText id="KODE_TOKO" onKeyDown={handleBarcodeKeyDown} value={printBarcode?.KODE_TOKO} onChange={(e) => onInputChange(e, 'KODE_TOKO')} />
                                <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="nama">Nama Produk</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={printBarcode?.NAMA} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-3">
                            <label htmlFor="nama">Kode</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={printBarcode?.KODE} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-3">
                            <label htmlFor="jumlah">Harga</label>
                            <div className="p-inputgroup">
                                <InputNumber value={printBarcode?.HJ} readOnly inputStyle={{ textAlign: 'right' }} />
                            </div>
                        </div>
                        <div className="field col-12 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-8 mb-2 lg:col-8">
                                    <label htmlFor="jumlah">Jumlah</label>
                                    <div className="p-inputgroup">
                                        <InputNumber value={printBarcode?.JUMLAH} onChange={(e) => onInputChange(e, 'JUMLAH')} autoFocus />
                                    </div>
                                </div>
                                <div className="field col-4 mb-2 lg:col-4">
                                    <label className="mt-3"></label>
                                    <div className="p-inputgroup">
                                        <Button label="Tambahkan" className="p-button-md mr-2 w-full" onClick={tambahData} />
                                        {/* <Button label="Hapus" className="p-button-sm mr-2 mt-1" onClick={deletePrintBarcode} /> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <DataTable
                        value={printBarcodeTabel}
                        size="small"
                        lazy
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        scrollable // Mengaktifkan scrolling
                        scrollHeight="250px"
                        // onRowSelect={onRowSelectPriceTagList}
                        // selectionMode="single" // Memungkinkan pemilihan satu baris
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE_TOKO" header="BARCODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA PRODUK"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="HJ" bodyStyle={{ textAlign: 'right' }} body={(rowData) => formatRibuan(rowData.HJ)} header="HARGA"></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} field="JUMLAH" bodyStyle={{ textAlign: "center" }} header="JUMLAH"></Column> */}
                        <Column headerStyle={{ textAlign: 'center' }} field="JUMLAH" header="JUMLAH" editor={(options) => textEditor(options)} onCellEditComplete={onCellEditComplete} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTabel} bodyStyle={{ textAlign: 'center' }}></Column>
                    </DataTable>
                </Dialog>
                {/* Dialog Delete Barcode Dialog */}
                <Dialog visible={deletePrintBarcodeDialog} header="Confirm" modal footer={barcodePrintDialogFooter} onHide={() => setDeletePrintBarcodeDialog(false)}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>
                            are you sure you want to delete <strong>{printBarcode?.KODE}</strong>
                        </span>
                    </div>
                </Dialog>
                <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProduk={handleProduk} />
                <AdjustPrintMargin adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} />
            </div>
        </div>
    );
}

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
 * Created on Fri May 24 2024 - 02:02:16
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { getSessionServerSide } from '../../../../utilities/servertool';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { convertToISODate, formatAndSetDate, formatDate, formatDatePdf, formatDateTable, getDBConfig, getEmail, getUserName } from '../../../../component/GeneralFunction/GeneralFunction';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'jspdf-autotable';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import AdjustPrintMargin from '../../../component/adjustPrintMargin';
import PDFViewer from '../../../../component/PDFViewer';
import { Dialog } from 'primereact/dialog';
import { RadioButton } from 'primereact/radiobutton';
import postData from '../../../../lib/Axios';
import { Footer, Header, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import jsPDF from 'jspdf';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function LaporanMutasiGudang() {
    const apiEndPointGet = '/api/laporan/stock/mutasi-gudang';
    const apiEndPointGetDataFaktur = '/api/laporan/stock/mutasi-gudang/get-data';
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [tglAwal, setTglAwal] = useState(new Date());
    const [tglAkhir, setTglAkhir] = useState(new Date());
    const [totalRecords, setTotalRecords] = useState(0);
    const [mutasiGudang, setMutasiGudang] = useState([]);
    const [mutasiGudangTabel, setMutasiGudangTabel] = useState([]);
    const [mutasiGudangTabelFilt, setMutasiGudangTabelFilt] = useState([]);
    const [dataFakturTabel, setDataFakturTabel] = useState([]);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [checked, setChecked] = useState(false);
    const [faktur, setFaktur] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [tglFaktur, setTglFaktur] = useState(new Date());
    const [totalItems, setTotalItems] = useState(0);
    const [totalQty, setTotalQty] = useState(0);
    const [totalHj, setTotalHJ] = useState(0);
    const [dariGudang, setDariGudang] = useState(null);
    const [keGudang, setKeGudang] = useState(null);
    const [search, setSearch] = useState('');
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
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
    const [defaultOption, setDropdownValue] = useState(null);
    const dropdownValues = [
        { name: 'mk.Faktur', label: 'Faktur Kirim' },
        { name: 'md.Faktur', label: 'Faktur Terima' }
    ];

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    function handleShowPreview() {
        setShowPreview(true);
    }

    useEffect(() => {
        setMutasiGudangTabelFilt(mutasiGudangTabel);
    }, [mutasiGudangTabel, lazyState]);

    useEffect(() => {
        setMutasiGudang({ FilterData: 'A' });
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
        loadLazyData();
        komponenPDF();
    }, [lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                ...lazyState,
                TglAwal: convertToISODate(tglAwal),
                TglAkhir: convertToISODate(tglAkhir),
                Status: mutasiGudang.FilterData
            };
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setMutasiGudangTabel(json.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Inputan
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _mutasi = { ...mutasiGudang };
        _mutasi[`${name}`] = val;
        setMutasiGudang((prevState) => ({
            ...prevState,
            [name]: val
        }));

        if (name === 'FilterData') {
            setChecked(true);
        }
        setMutasiGudang(_mutasi);
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (mutasiGudangTabel.length == 0 || !mutasiGudangTabel) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        try {
            const mutasiGudangPDF = mutasiGudangTabel ? JSON.parse(JSON.stringify(mutasiGudangTabel)) : [];
            let format = 'a4';
            if (selectedPaperSize === 'Letter') {
                format = 'letter';
            } else if (selectedPaperSize === 'Legal') {
                format = 'legal';
            }

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation,
                unit: 'mm',
                format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!mutasiGudangPDF || mutasiGudangPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Mutasi Gudang';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(tglAwal) + 's.d ' + formatDate(tglAkhir);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = mutasiGudangPDF.map((item) => [
                item.No,
                item.FakturKirim,
                item.FakturTerima,
                formatDatePdf(item.TglKirim),
                formatDatePdf(item.TglTerima),
                item.Status,
                item.GudangKirim,
                item.GudangTerima,
                parseInt(item.QtyKirim).toLocaleString(),
                parseInt(item.QtyTerima).toLocaleString(),
                item.UserKirim,
                item.UserTerima,
                item.DateTime
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['NO.', 'FAKTUR KIRIM', 'FAKTUR TERIMA', 'TGL KIRIM', 'TGL TERIMA', 'STATUS', 'GUDANG KIRIM', 'GUDANG TERIMA', 'QTY KIRIM', 'QTY TERIMA', 'USER KIRIM', 'USER TERIMA', 'DATETIME']],
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
                    8: { halign: 'right' },
                    9: { halign: 'right' }
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
        } catch (error) {
            console.log(error);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(mutasiGudangTabel, 'laporan-mutasi-antar-gudang.xlsx');
    };

    // Yang Handle Slip Gudang
    const slipGudang = async () => {
        let format = 'a4';
        if (selectedPaperSize === 'Letter') {
            format = 'letter';
        } else if (selectedPaperSize === 'Legal') {
            format = 'legal';
        }

        const marginLeftInMm = parseFloat(marginLeft);
        const marginTopInMm = parseFloat(marginTop);
        const marginRightInMm = parseFloat(marginRight);

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

        // Fungsi untuk menambahkan judul dan informasi tanggal pada setiap halaman
        // doc.setFont("helvetica", "bold");
        // doc.setFontSize(11);
        // doc.text(headerTitle, 14, 15 + marginTopInMm - 10);

        // doc.setFont("helvetica", "normal");
        // doc.setFontSize(9);
        // doc.text(address, 14, 20);
        // doc.text(phoneNumber, 14, 25);

        const dataFakturTabelPDF = JSON.parse(JSON.stringify(dataFakturTabel));
        await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });
        // Tambahkan baris "Total" ke tableData
        const tableData = dataFakturTabelPDF.map((item) => [item.No, item.Kode, item.Nama, parseInt(item.HJ).toLocaleString(), parseInt(item.Qty).toLocaleString(), item.Satuan, parseInt(item.TotalHJ).toLocaleString()]);

        tableData.push(['', '', 'Total Items : ' + parseInt(totalItems).toLocaleString(), '', parseInt(totalQty).toLocaleString(), '', parseInt(totalHj).toLocaleString()]);

        // --------------------------------------------------------------------------------------------
        // tabel  buat data
        doc.setFontSize(10);
        const dataGrid = [
            {
                label: 'Faktur',
                value: faktur,
                label2: 'Tanggal',
                value2: formatDatePdf(tglFaktur)
            },
            {
                label: 'Dari',
                value: dariGudang,
                label2: 'Ke',
                value2: keGudang
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
        // --------------------------------------------------------------------------------------------

        // Gunakan autoTable untuk membuat tabel dengan judul dan isi yang telah dibentuk
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
                const totalPages = doc.internal.getNumberOfPages();
                const currentDate = new Date().toLocaleString(); // Menambahkan datetime
                const pageInfo = 'Page ' + doc.internal.getCurrentPageInfo().pageNumber + ' of ' + totalPages;
                const userInfo = userName + ' | ' + currentDate; // Menambahkan informasi pengguna
                const pageTextWidth = Math.max(doc.getTextWidth(pageInfo), doc.getTextWidth(userInfo));
                const pageTextX = pageWidth - pageTextWidth - 10; // Posisi di pojok kanan
                const pageTextY = pageHeight - 10;

                doc.setFontSize(8);
                doc.text(pageInfo, pageTextX + 57, pageTextY); // Menambahkan informasi halaman
                doc.text(userInfo, pageTextX + 12, pageTextY + 5); // Menambahkan informasi pengguna
            }
        });

        // Form Pengesahan
        var tableDataPengesahan = [
            ['', 'Menyetujui,', '    ', '                                  ', '    ', `${kotaToko}, ${formatDatePdf(today)}`],
            ['', '    ', '    ', '                                  ', '    ', `${namaToko}`],
            ['', '    ', '    ', '                                  ', '    ', 'Pembuat'],
            ['', '..............', '    ', '                                  ', '    ', '    ']
        ]; // lembar pengesahan
        var totalColumns = tableDataPengesahan[0].length; // Jumlah total kolom dalam tabel                             // lembar pengesahan
        var options = {
            // lembar pengesahan
            startY: doc.autoTable.previous.finalY + 10, // lembar pengesahan
            theme: 'plain', // lembar pengesahan
            margin: {
                top: marginTopInMm,
                left: marginLeftInMm,
                right: marginRightInMm
            }, // lembar pengesahan
            styles: {
                width: '100%',
                cellWidth: 'auto',
                valign: 'middle',
                halign: 'center',
                columnWidth: 'auto' // lembar pengesahan
            } // lembar pengesahan
        }; // lembar pengesahan
        doc.autoTable({
            // lembar pengesahan
            body: tableDataPengesahan, // lembar pengesahan
            ...options // lembar pengesahan
        });

        const pdfDataUrl = doc.output('datauristring');
        setPdfUrl(pdfDataUrl);
        setjsPdfPreviewOpen(true);
        setShowPreview(false);
    };

    // Yang Handle Inputan Tanggal
    const handleStartDate = (e) => {
        setTglAwal(e.value);
    };
    const handleStartDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTglAwal);
    };
    const handleEndDate = (e) => {
        setTglAkhir(e.value);
    };
    const handleEndDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setTglAkhir);
    };

    //  Yang Handle Search
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center w-full">
                <div className="p-inputgroup">{/* Kalender atau elemen lain bisa ditambahkan di sini */}</div>
                <span className="block mt-2 md:mt-0 p-input-icon-left flex-grow-1" style={{ maxWidth: '400px' }}>
                    <i className="pi pi-search" />
                    <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                </span>
            </div>
        </div>
    );

    // Yang Handle Header Get Data Faktur
    const rightToolbar = () => {
        return (
            <React.Fragment>
                <Button label="Reprint" icon="pi pi-print" className="p-button-danger " onClick={handleShowPreview} />
            </React.Fragment>
        );
    };

    const leftToolbar = () => {
        return (
            <div className="field col-3 mb-0 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ marginBottom: '0', marginRight: '8px' }}>Faktur</label>
                <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                <label style={{ marginBottom: '0', marginRight: '8px' }}>{faktur}</label>
            </div>
        );
    };

    const headerDataFaktur = <Toolbar left={leftToolbar} right={rightToolbar}></Toolbar>;

    //  Yang Handle Dialog Faktur
    const onRowDoubleClick = (rowData) => {
        setDariGudang(rowData.GudangKirim);
        setKeGudang(rowData.GudangTerima);
    };

    const getDataFaktur = async (faktur) => {
        try {
            let requestBody = {
                Faktur: faktur
            };
            const vaTable = await postData(apiEndPointGetDataFaktur, requestBody);
            const json = vaTable.data;
            setTotalItems(json.total_data);
            setDataFakturTabel(json.data);
            setTglFaktur(json.tgl);
            setTotalQty(json.total);
            setTotalHJ(json.total_HJ);
            setFaktur(faktur);
            setDialogVisible(true);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Refresh" icon="pi pi-refresh" className="p-button-danger mr-2 ml-2" onClick={loadLazyData} />
                <React.Fragment>
                    <div>
                        <Button label="Preview" icon="pi pi-file" className="p-button-success mr-2" onClick={btnAdjust} />
                    </div>
                </React.Fragment>
            </React.Fragment>
        );
    };

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = mutasiGudangTabel.filter((d) =>
                x
                    ? x.test(d.FakturKirim) ||
                    x.test(d.FakturTerima) ||
                    x.test(d.TglKirim) ||
                    x.test(d.TglTerima) ||
                    x.test(d.Status) ||
                    x.test(d.GudangKirim) ||
                    x.test(d.GudangTerima) ||
                    x.test(d.QtyKirim) ||
                    x.test(d.QtyTerima) ||
                    x.test(d.UserKirim) ||
                    x.test(d.UserTerima) ||
                    x.test(d.DateTime)
                    : []
            );
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = mutasiGudangTabel;
            } else {
                filtered = mutasiGudangTabel.filter((d) => (x ? x.test(d.FakturKirim) : []));
            }
        }

        setMutasiGudangTabelFilt(filtered);
    };

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.name != null) {
            _lazyState['filters'][defaultOption.name] = value;
        }
        onPage(_lazyState);
    };

    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>Laporan Mutasi Gudang</h4>
                <hr />
                <Toast ref={toast}></Toast>
                <div className="formgrid grid">
                    <div className="field col-6 mb-2 lg:col-6">
                        <label htmlFor="faktur">Periode</label>
                        <div className="p-inputgroup">
                            <Calendar showIcon name="startDate" value={tglAwal} onInput={handleStartDateChange} onChange={handleStartDate} dateFormat="dd-mm-yy" />
                            <Calendar showIcon name="endDate" value={tglAkhir} onInput={handleEndDateChange} onChange={handleEndDate} dateFormat="dd-mm-yy" />
                        </div>
                    </div>
                    <div className="field col-4 mb-2 lg:col-4">
                        <label>Status</label>
                        <div className="p-inputgroup">
                            <div className="col-4">
                                <RadioButton name="FilterData" value="A" checked={mutasiGudang.FilterData === 'A'} onChange={(e) => onInputChange(e, 'FilterData')} />
                                <label htmlFor="ingredient1" className="ml-2">
                                    Semua
                                </label>
                            </div>
                            <div className="col-4">
                                <RadioButton name="FilterData" value="B" checked={mutasiGudang.FilterData === 'B'} onChange={(e) => onInputChange(e, 'FilterData')} />
                                <label htmlFor="ingredient2" className="ml-2">
                                    Sudah Terima
                                </label>
                            </div>
                            <div className="col-4">
                                <RadioButton name="FilterData" value="C" checked={mutasiGudang.FilterData === 'C'} onChange={(e) => onInputChange(e, 'FilterData')} />
                                <label htmlFor="ingredient3" className="ml-2">
                                    Belum Terima
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="field col-2 mb-2 lg:col-2">
                        <label></label>
                        <div className="p-inputgroup mt-2">
                            <Button label="Refresh" className="p-button-primary p-button-md w-full mr-1" onClick={loadLazyData} />
                        </div>
                    </div>
                </div>
                <DataTable
                    value={mutasiGudangTabelFilt}
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
                    onRowDoubleClick={(e) => onRowDoubleClick(e.data)}
                >
                    <Column field="No" header="NO"></Column>
                    <Column field="FakturKirim" body={(rowData) => <span onClick={() => getDataFaktur(rowData.FakturKirim)}>{rowData.FakturKirim}</span>} header="FAKTUR KIRIM"></Column>
                    <Column field="FakturTerima" body={(rowData) => <span onClick={() => getDataFaktur(rowData.FakturTerima)}>{rowData.FakturTerima}</span>} header="FAKTUR TERIMA"></Column>
                    <Column body={(rowData) => formatDateTable(rowData.TglKirim)} header="TGL KIRIM"></Column>
                    <Column body={(rowData) => formatDateTable(rowData.TglTerima)} header="TGL TERIMA"></Column>
                    <Column field="Status" header="STATUS"></Column>
                    <Column field="GudangKirim" header="GUDANG KIRIM"></Column>
                    <Column field="GudangTerima" header="GUDANG TERIMA"></Column>
                    <Column
                        body={(rowData) => {
                            const value = rowData.QtyKirim ? parseInt(rowData.QtyKirim).toLocaleString() : 0;
                            return value;
                        }}
                        header="QTY KIRIM"
                    ></Column>
                    <Column
                        body={(rowData) => {
                            const value = rowData.QtyTerima ? parseInt(rowData.QtyTerima).toLocaleString() : 0;
                            return value;
                        }}
                        header="QTY TERIMA"
                    ></Column>
                    <Column field="UserKirim" header="USER KIRIM"></Column>
                    <Column field="UserTerima" header="USER TERIMA"></Column>
                    <Column field="DateTime" header="DATETIME"></Column>
                </DataTable>
                <Toolbar className="mb-4" left={preview}></Toolbar>
            </div>
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
            <Dialog header="Detail Mutasi Gudang" visible={dialogVisible} style={{ width: '50vw' }} onHide={() => setDialogVisible(false)}>
                <DataTable value={dataFakturTabel} lazy size="small" header={headerDataFaktur}>
                    <Column field="No" header="NO"></Column>
                    <Column field="Kode" header="KODE"></Column>
                    <Column field="Nama" header="NAMA" footer={'Total : ' + totalItems + ' item'}></Column>
                    <Column
                        body={(rowData) => {
                            const value = rowData.Qty ? parseInt(rowData.Qty).toLocaleString() : 0;
                            return value;
                        }}
                        footer={totalQty}
                        header="QTY"
                    ></Column>
                    <Column field="Satuan" header="SATUAN"></Column>
                </DataTable>
            </Dialog>
            <Dialog
                visible={showPreview}
                onHide={() => setShowPreview(false)}
                header="Report Type" // Ini adalah judul dialog
                style={{ width: '90%' }}
            >
                <div className="card">
                    <div class="grid">
                        <div class="col-12 md:col-9 lg:col-9">
                            <div className="card">
                                <div class="grid">
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Atas</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginTop" value={marginTop} onChange={(e) => setMarginTop(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Bawah</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginBottom" value={marginBottom} onChange={(e) => setMarginBottom(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Lebar Tabel</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="tableWidth" value={tableWidth} onChange={(e) => setTableWidth(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="grid">
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Kanan</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginRight" value={marginRight} onChange={(e) => setMarginRight(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">
                                        <label htmlFor="rekening">Margin Kiri</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <InputText id="marginLeft" value={marginLeft} onChange={(e) => setMarginLeft(e.target.value)} type="number" min="0" step="0.1" />
                                            <span className="p-inputgroup-addon">mm</span>
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-4 lg:col-4">&nbsp;</div>
                                </div>
                            </div>
                        </div>
                        <div class="col-12 md:col-3 lg:col-3">
                            <div className="card">
                                <div class="grid">
                                    <div class="col-12 md:col-12 lg:col-12">
                                        <label htmlFor="rekening">Ukuran Kertas</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <Dropdown id="paperSize" value={selectedPaperSize} options={paperSizes} onChange={handlePaperSizeChange} optionLabel="name" />
                                        </div>
                                    </div>
                                    <div class="col-12 md:col-12 lg:col-12">
                                        <label htmlFor="rekening">Orientasi</label>
                                        <div className="p-inputgroup" style={{ 'margin-top': '5px' }}>
                                            <Dropdown id="orientation" value={orientation} options={orientationOptions} onChange={handleOrientationChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card" style={{ backgroundColor: '#fAfAfA' }}>
                    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                        <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}></div>
                        <div className="flex flex-row md:justify-between md:align-items-center">
                            <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
                                <Button label="Export PDF" icon="pi pi-file" className="p-button-danger mr-2" onClick={slipGudang} />
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}

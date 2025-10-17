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
 * Created on Wed May 22 2024 - 07:31:43
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import jsPDF from 'jspdf';
import { Column } from 'jspdf-autotable';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Footer, FooterSlip, HeaderLaporan, HeaderSlip, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import { convertToISODate, formatAndSetDate, formatColumnValue, formatDate, formatDatePdf, formatDateTable, getEmail, getUserName } from '../../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/PDFViewer';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import AdjustPrintMarginSlip from '../../../component/adjustPrintMarginSlip';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function LaporanPerubahanHarga() {
    const apiEndPointGet = '/api/laporan/stock/perubahan-harga';
    const apiEndPointGetDataFaktur = '/api/laporan/stock/data-faktur';

    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [tglAwal, setTglAwal] = useState(new Date());
    const [tglAkhir, setTglAkhir] = useState(new Date());
    const [totalRecords, setTotalRecords] = useState(0);
    const [perubahanHargaStock, setPerubahanHargaStock] = useState(null);
    const [perubahanHargaStockFilt, setPerubahanHargaStockFilt] = useState(null);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [adjustDialogSlip, setAdjustDialogSlip] = useState(false);
    const [dataFakturTabel, setDataFakturTabel] = useState([]);
    const [dataFaktur, setDataFaktur] = useState([]);
    const [tglFaktur, setTglFaktur] = useState(new Date());
    const [faktur, setFaktur] = useState(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [search, setSearch] = useState('');
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
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
        { name: 'p.Kode', label: 'KODE' },
        { name: 's.Kode_Toko', label: 'BARCODE' },
        { name: 's.Nama', label: 'NAMA' }
    ];

    // const onPage = (event) => {
    //     setlazyState(event);
    //     setFirst(event.first); // Mengatur halaman saat halaman berubah
    //     setRows(event.rows); // Mengatur jumlah baris per halaman
    // };

    function handleShowPreview() {
        setShowPreview(true);
    }

    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const onPage = (event) => {
        // Set lazyState from event
        setlazyState(event);

        // Ensure filters remain as strings if they are objects
        if (event.filters) {
            Object.keys(event.filters).forEach((key) => {
                const filterValue = event.filters[key];
                if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                    const stringValue = Object.values(filterValue).join('');
                    event.filters[key] = stringValue;
                }
            });
        }
        // Set first and rows for pagination
        setFirst(event.first);
        setRows(event.rows);

        // Load data with updated lazyState
        loadLazyData();
    };
    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setPerubahanHargaStockFilt(perubahanHargaStock);
    }, [perubahanHargaStock, lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                ...lazyState,
                TglAwal: convertToISODate(tglAwal),
                TglAkhir: convertToISODate(tglAkhir)
            };
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setPerubahanHargaStock(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
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
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>
                    <Calendar showIcon name="startDate" value={tglAwal} onInput={handleStartDateChange} onChange={handleStartDate} dateFormat="dd-mm-yy" />
                    <label style={{ margin: '5px' }}>s.d</label>
                    <Calendar showIcon name="startDate" value={tglAkhir} onInput={handleEndDateChange} onChange={handleEndDate} dateFormat="dd-mm-yy" />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} style={{ marginLeft: '0.5rem' }} />
                </div>
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih kolom" /> */}
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText placeholder="Search" value={search} onChange={(e) => filterPlugins('search', e.target.value)} className="w-full" />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = perubahanHargaStock.filter((d) =>
                x
                    ? x.test(d.Kode) ||
                      x.test(d.DateTime) ||
                      x.test(d.Barcode) ||
                      x.test(d.Nama) ||
                      x.test(d.FakturPembelian) ||
                      x.test(d.FakturPO) ||
                      x.test(d.FakturAsli) ||
                      x.test(d.Supplier) ||
                      x.test(d.HBLama) ||
                      x.test(d.HJLama) ||
                      x.test(d.HBBaru) ||
                      x.test(d.HJBaru) ||
                      x.test(d.HPP)
                    : []
            );
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = perubahanHargaStock;
            } else {
                filtered = perubahanHargaStock.filter((d) => (x ? x.test(d.Kode) : []));
            }
        }

        setPerubahanHargaStockFilt(filtered);
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

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (perubahanHargaStock.length == 0 || !perubahanHargaStock) {
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
            const perubahanHargaStockPDF = perubahanHargaStock ? JSON.parse(JSON.stringify(perubahanHargaStock)) : [];
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

            if (!perubahanHargaStockPDF || perubahanHargaStockPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Perubahan Harga';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(tglAwal) + 's.d ' + formatDate(tglAkhir);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = perubahanHargaStockPDF.map((item) => [
                item.No,
                formatDatePdf(item.DateTime),
                item.Kode,
                item.Barcode,
                item.Nama,
                item.FakturPembelian,
                item.FakturPO,
                item.FakturAsli,
                item.Supplier,
                parseInt(item.HBLama).toLocaleString(),
                parseInt(item.HJLama).toLocaleString(),
                parseInt(item.HBBaru).toLocaleString(),
                parseInt(item.HJBaru).toLocaleString(),
                parseInt(item.HPP).toLocaleString()
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['NO.', 'KODE', 'BARCODE', 'NAMA PRODUK', 'FAKTUR PEMBELIAN', 'FAKTUR PO', 'FAKTUR ASLI', 'SUPPLIER', 'HB LAMA', 'HJ LAMA', 'HB BARU', 'HJ BARU', 'HPP']],
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
                    10: { halign: 'right' },
                    11: { halign: 'right' },
                    12: { halign: 'right' },
                    13: { halign: 'right' },
                    14: { halign: 'right' }
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
        exportToXLSX(perubahanHargaStock, 'laporan-perubahan-harga.xlsx');
    };

    //  Yang Handle Cetak Slip
    const getDataFaktur = async (faktur) => {
        try {
            let requestBody = {
                Faktur: faktur
            };
            const vaTable = await postData(apiEndPointGetDataFaktur, requestBody);
            const json = vaTable.data;
            setDataFaktur(json.data);
            setDataFakturTabel(json.data.detail);
            setFaktur(faktur);
            setDialogVisible(true);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        }
    };

    const btnAdjustFaktur = () => {
        setAdjustDialogSlip(true);
    };

    const handleAdjustFaktur = async (dataAdjust) => {
        slipFaktur(dataAdjust);
    };

    const slipFaktur = async (dataAdjust) => {
        try {
            let format = 'a4';
            if (selectedPaperSize === 'Letter') {
                format = 'letter';
            } else if (selectedPaperSize === 'Legal') {
                format = 'legal';
            }

            const dataFakturTabelPDF = JSON.parse(JSON.stringify(dataFakturTabel));

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

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const userName = await getUserName(await getEmail());

            if (!dataFakturTabelPDF || dataFakturTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const judulLaporan = dataFaktur.Title;
            const periodeLaporan = '';
            const supplier = '[' + dataFaktur.Supplier + ']';
            const namaSupplier = dataFaktur.NamaSupplier;
            const addressSupplier = dataFaktur.Alamat;
            let faktur;
            let rowTgl;
            const tableData = dataFakturTabelPDF.map((item) => [item.No, item.Kode, item.Nama, formatColumnValue(item.Harga), formatColumnValue(item.Qty), formatColumnValue(item.DiscBarang), formatColumnValue(item.Total)]);

            if (judulLaporan === 'PURCHASE ORDER') {
                faktur = dataFaktur.FakturPO;
                rowTgl = 'PO Date : ' + formatDateTable(dataFaktur.Tgl) + '     |     Delivery Date : ' + formatDateTable(dataFaktur.TglDO) + '     |     Payment Date : ' + formatDateTable(dataFaktur.JthTmp);
            } else if (judulLaporan === 'BUKTI TERIMA BARANG') {
                faktur = 'PO - ' + dataFaktur.FakturPO + '  |  ' + 'Pembelian - ' + dataFaktur.FakturPB;
                rowTgl = 'Date : ' + formatDate(dataFaktur.Tgl) + '     |     Jatuh Tempo : ' + formatDate(dataFaktur.JthTmp) + '     |     Gudang :  ' + dataFaktur.Gudang;
            }
            await HeaderSlip({ doc, marginTopInMm, judulLaporan, faktur, supplier, namaSupplier, addressSupplier, rowTgl });

            const startY = 50 + marginTopInMm - 10;
            doc.autoTable({
                startY: startY,
                head: [['No', 'BARCODE', 'NAMA BARANG', 'HARGA', 'QTY', 'DISCOUNT', 'JUMLAH']],
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
                    4: { halign: 'center' },
                    5: { halign: 'right' },
                    6: { halign: 'right' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawPage: async function (data) {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            var tableTotal = [
                ['DISCOUNT : ', `${formatColumnValue(dataFaktur.DiscFaktur || 0)}`, '    ', '          ', '                                  ', 'SUBTOTAL : ', ` ${formatColumnValue(dataFaktur.SubTotal || 0)}`],
                ['FAKTUR ASLI : ', `${formatColumnValue(dataFaktur.FakturAsli)}`, '    ', '          ', '                                  ', 'PPN : ', ` ${formatColumnValue(dataFaktur.PPN || 0)}`],
                ['              ', '                                        ', '    ', '          ', '                                  ', 'TOTAL : ', `${formatColumnValue(dataFaktur.TotalFaktur || 0)}`]
            ];

            var options = {
                startY: doc.autoTable.previous.finalY,
                theme: 'plain',
                margin: {
                    top: marginTopInMm,
                    left: marginLeftInMm,
                    right: marginRightInMm
                },
                styles: {
                    width: '100%',
                    cellWidth: 'auto',
                    valign: 'middle',
                    halign: 'right',
                    columnWidth: 'auto',
                    fontSize: 9
                },
                columnStyles: {
                    0: { cellWidth: 'auto', halign: 'left' },
                    1: { cellWidth: 'auto', halign: 'left' },
                    2: { cellWidth: '200px' }
                }
            };
            doc.autoTable({
                body: tableTotal,
                ...options
            });

            // // Get the final Y position of the table
            const finalY = doc.autoTable.previous.finalY;
            await FooterSlip({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });

            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setAdjustDialogSlip(false);
        } catch (error) {
            console.log('catch', error);
        }
    };

    const rightToolbar = () => {
        return (
            <React.Fragment>
                <Button label="Reprint" icon="pi pi-print" className="p-button-danger " onClick={btnAdjustFaktur} />
            </React.Fragment>
        );
    };

    const leftToolbar = () => {
        const labelStyle = { fontWeight: 'bold', width: '100px', textAlign: 'left' };
        const valueStyle = { flex: '1' };

        return (
            <div className="field col-12 mb-0 lg:col-12" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px' }}>
                <div style={{ flex: '1', paddingRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={labelStyle}>Faktur:</label>
                        <span style={valueStyle}>{faktur}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={labelStyle}>Tanggal:</label>
                        <span style={valueStyle}>{dataFaktur.Tgl}</span>
                    </div>
                </div>
                <div style={{ flex: '1', paddingLeft: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={labelStyle}>Jatuh Tempo:</label>
                        <span style={valueStyle}>{dataFaktur.JthTmp}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={labelStyle}>Gudang:</label>
                        <span style={valueStyle}>{dataFaktur.Gudang}</span>
                    </div>
                </div>
            </div>
        );
    };

    const headerDataFaktur = <Toolbar left={leftToolbar} right={rightToolbar}></Toolbar>;

    return (
        <div className="full-page">
            <div className="card">
                <h4>Laporan Perubahan Harga</h4>
                <hr />
                <Toast ref={toast}></Toast>
                <DataTable
                    value={perubahanHargaStockFilt}
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
                >
                    <Column field="No" header="NO"></Column>
                    <Column field="DateTime" header="DATETIME"></Column>
                    <Column field="Kode" header="KODE"></Column>
                    <Column field="Barcode" header="BARCODE"></Column>
                    <Column field="Nama" header="NAMA PRODUK"></Column>
                    <Column field="FakturPembelian" body={(rowData) => <span onClick={() => getDataFaktur(rowData.FakturPembelian)}>{rowData.FakturPembelian}</span>} header="FAKTUR PEMBELIAN"></Column>
                    <Column field="FakturPO" body={(rowData) => <span onClick={() => getDataFaktur(rowData.FakturPO)}>{rowData.FakturPO}</span>} header="FAKTUR PO"></Column>
                    <Column field="FakturAsli" header="FAKTUR ASLI"></Column>
                    <Column field="Supplier" header="SUPPLIER"></Column>
                    <Column
                        body={(rowData) => {
                            const value = rowData.HBLama ? parseInt(rowData.HBLama).toLocaleString() : 0;
                            return value;
                        }}
                        header="HB LAMA"
                    ></Column>
                    <Column
                        body={(rowData) => {
                            const value = rowData.HJLama ? parseInt(rowData.HJLama).toLocaleString() : 0;
                            return value;
                        }}
                        header="HJ LAMA"
                    ></Column>
                    <Column
                        body={(rowData) => {
                            const value = rowData.HBBaru ? parseInt(rowData.HBBaru).toLocaleString() : 0;
                            return value;
                        }}
                        header="HB BARU"
                    ></Column>
                    <Column
                        body={(rowData) => {
                            const value = rowData.HJBaru ? parseInt(rowData.HJBaru).toLocaleString() : 0;
                            return value;
                        }}
                        header="HJ BARU"
                    ></Column>
                    <Column
                        body={(rowData) => {
                            const value = rowData.HPP ? parseInt(rowData.HPP).toLocaleString() : 0;
                            return value;
                        }}
                        header="HPP"
                    ></Column>
                </DataTable>
                <Toolbar className="mb-4" left={preview}></Toolbar>
            </div>
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <AdjustPrintMarginSlip adjustDialog={adjustDialogSlip} setAdjustDialog={setAdjustDialogSlip} btnAdjust={btnAdjustFaktur} handleAdjust={handleAdjustFaktur}></AdjustPrintMarginSlip>
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
                                <Button label="Export PDF" icon="pi pi-file" className="p-button-danger mr-2" onClick={slipFaktur} />
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
            <Dialog header="Detail Data Faktur" visible={dialogVisible} style={{ width: '50vw' }} onHide={() => setDialogVisible(false)}>
                <DataTable value={dataFakturTabel} lazy size="small" header={headerDataFaktur}>
                    <Column field="No" header="NO"></Column>
                    <Column field="Kode" header="BARCODE"></Column>
                    <Column field="Nama" header="NAMA"></Column>
                    <Column
                        field="Harga"
                        body={(rowData) => {
                            const value = rowData.Harga ? parseInt(rowData.Harga).toLocaleString() : 0;
                            return value;
                        }}
                        header="HARGA"
                    ></Column>
                    <Column
                        field="Qty"
                        body={(rowData) => {
                            const value = rowData.Qty ? parseInt(rowData.Qty).toLocaleString() : 0;
                            return value;
                        }}
                        header="QTY"
                    ></Column>
                    <Column
                        field="DiscBarang"
                        body={(rowData) => {
                            const value = rowData.DiscBarang ? parseInt(rowData.DiscBarang).toLocaleString() : 0;
                            return value;
                        }}
                        header="DISC"
                    ></Column>
                    <Column
                        field="Total"
                        body={(rowData) => {
                            const value = rowData.Total ? parseInt(rowData.Total).toLocaleString() : 0;
                            return value;
                        }}
                        header="TOTAL"
                    ></Column>
                </DataTable>
            </Dialog>
        </div>
    );
}

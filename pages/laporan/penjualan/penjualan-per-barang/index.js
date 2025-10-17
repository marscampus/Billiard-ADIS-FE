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
 * Created on Mon Jul 22 2024 - 03:26:08
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */
import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { convertToISODate, formatAndSetDate, formatDate, formatDatePdf, formatDateTable, getEmail, getUserName, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import postData from '../../../../lib/Axios';
import { startOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import { addPageInfo, Footer, HeaderLaporan } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import { Dialog } from 'primereact/dialog';
import PDFViewer from '../../../../component/PDFViewer';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function LaporanPenjualanPerBarang() {
    const apiEndPointGet = '/api/laporan/penjualan/per-barang';
    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [tglAwal, setTglAwal] = useState(startOfMonth(new Date()));
    const [tglAkhir, setTglAkhir] = useState(new Date());
    const [totalRecords, setTotalRecords] = useState(0);
    const [penjualanPerBarangTabel, setPenjualanPerBarangTabel] = useState(null);
    const [penjualanPerBarangTabelFilt, setPenjualanPerBarangTabelFilt] = useState(null);
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [adjustDialog, setAdjustDialog] = useState(false);
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

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setPenjualanPerBarangTabelFilt(penjualanPerBarangTabel);
    }, [penjualanPerBarangTabel, lazyState]);

    //  Yang Handle OnPage
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

            // Tambahkan nomor urut ke data
            const dataWithNo = json?.data.map((item, index) => ({
                No: index + 1, // Menambahkan properti No
                ...item
            }));

            setTotalRecords(json.total_data);
            setPenjualanPerBarangTabel(dataWithNo);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
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
            filtered = penjualanPerBarangTabel.filter((d) => (x ? x.test(d.Tgl) || x.test(d.Kode) || x.test(d.Kode_Toko) || x.test(d.Nama) || x.test(d.QtyTerjual) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = penjualanPerBarangTabel;
            } else {
                filtered = penjualanPerBarangTabel.filter((d) => (x ? x.test(d.Kode) : []));
            }
        }

        setPenjualanPerBarangTabelFilt(filtered);
    };

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.name != null) {
            _lazyState['filters'][defaultOption.name] = value;
        }
        onPage(_lazyState);
    };

    //  Yang Handle Preview
    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };

    const btnAdjust = () => {
        if (penjualanPerBarangTabel.length == 0 || !penjualanPerBarangTabel) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    //  Yang Handle PDF
    const exportPDF = async (dataAdjust) => {
        try {
            const penjualanPerBarangPDF = penjualanPerBarangTabel ? JSON.parse(JSON.stringify(penjualanPerBarangTabel)) : [];
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

            if (!penjualanPerBarangPDF || penjualanPerBarangPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Penjualan Per Barang';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(tglAwal) + 's.d ' + formatDate(tglAkhir);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = penjualanPerBarangPDF.map((item) => [item.No, formatDatePdf(item.Tgl), item.Kode, item.Kode_Toko, item.Nama, parseInt(item.QtyTerjual).toLocaleString()]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['NO.', 'TANGGAL', 'KODE', 'BARCODE', 'NAMA PRODUK', 'QTY TERJUAL']],
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
                    1: { halign: 'center' },
                    5: { halign: 'right' }
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
        exportToXLSX(penjualanPerBarangTabel, 'laporan-penjualan-perbarang.xlsx');
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>Laporan Penjualan Per Barang</h4>
                <hr></hr>
                <Toast ref={toast}></Toast>
                <DataTable
                    value={penjualanPerBarangTabelFilt}
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
                    <Column field="Tgl" body={(rowData) => (rowData.Tgl ? `${formatDateTable(rowData.Tgl)}` : '')} header="TANGGAL"></Column>
                    <Column field="Kode" header="KODE"></Column>
                    <Column field="Kode_Toko" header="BARCODE"></Column>
                    <Column field="Nama" header="NAMA"></Column>
                    <Column
                        field="QtyTerjual"
                        body={(rowData) => {
                            const value = rowData.QtyTerjual ? parseInt(rowData.QtyTerjual).toLocaleString() : 0;
                            return value;
                        }}
                        header="QTY TERJUAL"
                    ></Column>
                </DataTable>
                <Toolbar className="mb-4" left={preview}></Toolbar>
            </div>
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}

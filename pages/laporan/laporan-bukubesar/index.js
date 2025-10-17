/* eslint-disable */
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
 * Created on Tue Mar 26 2024 - 01:18:48
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar';
import { TabPanel, TabView } from 'primereact/tabview';
import jsPDF from 'jspdf';
import { startOfMonth } from 'date-fns';
import { Panel } from 'primereact/panel';
import autoTable from 'jspdf-autotable';
import { Dialog } from 'primereact/dialog';
import { useSession } from 'next-auth/react';
import { BlockUI } from 'primereact/blockui';
import { getSessionServerSide } from '../../../utilities/servertool';
import { convertToISODate, formatAndSetDate, formatColumnValue, formatDate, getEmail, getUserName, showError } from '../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../component/PDFViewer';
import MultipleRekeningCOA from '../../component/MultipleRekeningCOA';
import postData from '../../../lib/Axios';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function jurnalPage() {
    const apiEndPointGetTotal = '/api/buku-besar/get-total';
    const apiEndPointGetDetail = '/api/buku-besar/get-detail';

    const toast = useRef(null);
    const dt = useRef(null);

    const [loadingPreview, setLoadingPreview] = useState(false);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [jurnal, setJurnal] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRecordsTotal, setTotalRecordsTotal] = useState(0);
    const [bukuBesarTotalTabel, setBukuBesarTotalTabel] = useState(null);
    const [bukuBesarTotalTabelFilt, setBukuBesarTotalTabelFilt] = useState(null);
    const [bukuBesarDetailTabel, setBukuBesarDetailTabel] = useState(null);
    const [bukuBesarDetailTabelFilt, setBukuBesarDetailTabelFilt] = useState(null);
    const [activeIndexTabel, setActiveIndexTabel] = useState(0);
    const [tglAwal, setTglAwal] = useState(startOfMonth(new Date()));
    const [tglAkhir, setTglAkhir] = useState(new Date());
    const [search, setSearch] = useState('');
    const [rekeningDialog, setRekeningDialog] = useState(false);
    const [activeFormField, setActiveFormField] = useState(null);
    // PDF
    const fileName = `laporan-buku-besar-total-${new Date().toISOString().slice(0, 10)}`;
    const [adjustDialogTotal, setAdjustDialogTotal] = useState(false);
    const [adjustDialogDetail, setAdjustDialogDetail] = useState(false);
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    useEffect(() => {
        setBukuBesarTotalTabelFilt(bukuBesarTotalTabel);
        setBukuBesarDetailTabelFilt(bukuBesarDetailTabel);
    }, [bukuBesarTotalTabel, bukuBesarDetailTabel]);

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

    const onInputChange = (e, fieldName) => {
        const value = e.target.value;
        setJurnal((prevState) => ({
            ...prevState,
            [fieldName]: value
        }));

        if (fieldName === 'JenisGabungan' && value.name === 'C') {
            setShowInputText(false);
        } else {
            if (jenisGabunganOptions.length >= 2) {
                setShowInputText(true);
            }
        }
    };

    // Toolbar diatas data tabel --------------------------------------------------//
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button label="Refresh" icon="pi pi-refresh" className="p-button-primary mr-2 ml-2" onClick={loadLazyData} />
            </React.Fragment>
        );
    };

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const requestBody = {
                TglAwal: convertToISODate(tglAwal),
                TglAkhir: convertToISODate(tglAkhir),
                RekeningAwal: jurnal.RekeningAwal,
                RekeningAkhir: jurnal.RekeningAkhir
            };
            // Total
            const vaTableTotal = await postData(apiEndPointGetTotal, requestBody);
            const json = vaTableTotal.data;
            const fakturTracker = {};
            const updatedJson = json.data.map((item) => {
                const faktur = item.Faktur;
                if (fakturTracker[faktur]) {
                    item.Faktur = '';
                } else {
                    fakturTracker[faktur] = true;
                }
                return item;
            });
            setBukuBesarTotalTabel(updatedJson);
            // Detail
            const vaTableDetail = await postData(apiEndPointGetDetail, requestBody);
            const jsonDetail = vaTableDetail.data;
            const updatedJsonDetail = jsonDetail.data.map((item) => {
                return item;
            });
            setTotalRecordsTotal(updatedJson.length);
            setBukuBesarDetailTabel(updatedJsonDetail);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    //  Yang Handle Preview Total
    const btnAdjustTotal = () => {
        if (bukuBesarTotalTabelFilt?.length == 0 || !bukuBesarTotalTabelFilt) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialogTotal(true);
    };

    const handleAdjustTotal = async (dataAdjust) => {
        exportTotalPDF(dataAdjust);
    };

    const exportTotalPDF = async (dataAdjust) => {
        try {
            setLoadingPreview(true);
            const totalPDF = bukuBesarTotalTabelFilt ? JSON.parse(JSON.stringify(bukuBesarTotalTabelFilt)) : [];
            const tableData = totalPDF.map((item) => [item.No, item.Tgl, item.Keterangan, formatColumnValue(item.Debet), formatColumnValue(item.Kredit), formatColumnValue(item.Akhir)]);

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });
            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';

            const userName = await getUserName(await getEmail());

            if (!totalPDF || totalPDF.length === 0) {
                // If the table is empty, add a message to the PDF
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });

                // You can also add any other relevant information or styling for an empty table
            }

            const judulLaporan = 'Laporan Buku Besar Total';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(tglAwal) + ' s.d ' + formatDate(tglAkhir);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['NO', 'TGL', 'KETERANGAN', 'DEBET', 'KREDIT', 'SALDO AKHIR']],
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
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' }
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

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel Total
    const exportExcelTotal = () => {
        exportToXLSX(bukuBesarTotalTabelFilt, 'laporan-buku-besar-total.xlsx');
    };

    //  Yang Handle Preview Total
    const btnAdjustDetail = () => {
        if (bukuBesarDetailTabelFilt?.length == 0 || !bukuBesarDetailTabelFilt) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialogDetail(true);
    };

    const handleAdjustDetail = async (dataAdjust) => {
        exportDetailPDF(dataAdjust);
    };

    const exportDetailPDF = async (dataAdjust) => {
        try {
            setLoadingPreview(true);

            const totalPDF = bukuBesarDetailTabelFilt ? JSON.parse(JSON.stringify(bukuBesarDetailTabelFilt)) : [];

            const tableData = totalPDF.map((item) => [item.No, item.Tgl, item.Keterangan, formatColumnValue(item.Debet), formatColumnValue(item.Kredit), formatColumnValue(item.Akhir)]);

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });
            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';

            const userName = await getUserName(await getEmail());

            if (!totalPDF || totalPDF.length === 0) {
                // If the table is empty, add a message to the PDF
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });

                // You can also add any other relevant information or styling for an empty table
            }

            const judulLaporan = 'Laporan Buku Besar Detail';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(tglAwal) + ' s.d ' + formatDate(tglAkhir);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['NO', 'TGL', 'KETERANGAN', 'DEBET', 'KREDIT', 'SALDO AKHIR']],
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
                    1: { halign: 'center' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' }
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
            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
        } catch (error) {
            let e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel Detail
    const exportExcelDetail = () => {
        exportToXLSX(bukuBesarDetailTabelFilt, 'laporan-buku-besar-detail.xlsx');
    };

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

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
                {/* You can add other elements here if needed */}
            </div>
            <h5 className="m-0"></h5>
            <div className="flex flex-row md:justify-between md:align-items-center">
                {/* Search input */}
                <div className="flex flex-row md:justify-content-between md:align-items-center">
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText placeholder="Search" value={search} onChange={(e) => filterPluginsTotal('search', e.target.value)} className="w-full" />
                    </span>
                </div>
                <div className="flex flex-row" style={{ justifyContent: 'flex-start', marginLeft: '1rem' }}>
                    <div>
                        <Button label="Preview" icon="pi pi-file" className="p-button-success mr-2" onClick={btnAdjustTotal} />
                    </div>
                </div>
            </div>
        </div>
    );

    const filterPluginsTotal = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = bukuBesarTotalTabel.filter((d) => (x ? x.test(d.Tgl) || x.test(d.Keterangan) || x.test(d.Debet) || x.test(d.Kredit) || x.test(d.Akhir) : []));
            setSearch(searchVal);
        }
        setBukuBesarTotalTabelFilt(filtered);
    };

    const headerDetail = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
                {/* You can add other elements here if needed */}
            </div>
            <h5 className="m-0"></h5>
            <div className="flex flex-row md:justify-between md:align-items-center">
                {/* Search input */}
                <div className="flex flex-row md:justify-content-between md:align-items-center">
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText placeholder="Search" value={search} onChange={(e) => filterPluginsDetail('search', e.target.value)} className="w-full" />
                    </span>
                </div>
                <div className="flex flex-row" style={{ justifyContent: 'flex-start', marginLeft: '1rem' }}>
                    <div>
                        <Button label="Preview" icon="pi pi-file" className="p-button-success mr-2" onClick={btnAdjustDetail} />
                    </div>
                </div>
            </div>
        </div>
    );

    const filterPluginsDetail = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = bukuBesarDetailTabel.filter((d) => (x ? x.test(d.Faktur) || x.test(d.Tgl) || x.test(d.Keterangan) || x.test(d.Debet) || x.test(d.Kredit) || x.test(d.Akhir) : []));
            setSearch(searchVal);
        }

        setBukuBesarDetailTabelFilt(filtered);
    };

    const toggleDataTable = async (event) => {
        setActiveIndexTabel(event.index ?? 0);
        loadLazyData();
    };

    // Yang Handle Rekening//  Yang Handle Rekening
    const handleSearchButtonClick = (formField) => (event) => {
        setActiveFormField(formField);
        setRekeningDialog(true);
    };

    const onRowSelectKode = (event, formField) => {
        const selectedRow = event.data;
        //  Menentukan FormField yang Sesuai
        switch (formField) {
            // ----------------------------------Pembelian
            case 'RekeningAwal':
                setJurnal((p) => ({
                    ...p,
                    RekeningAwal: selectedRow.kode,
                    KetRekeningAwal: selectedRow.keterangan
                }));
                break;
            case 'RekeningAkhir':
                setJurnal((p) => ({
                    ...p,
                    RekeningAkhir: selectedRow.kode,
                    KetRekeningAkhir: selectedRow.keterangan
                }));
                break;
            default:
                break;
        }
        setRekeningDialog(false);
    };

    return (
        <BlockUI
            blocked={loadingPreview}
            template={
                <div className="flex align-items-center justify-content-center flex-column gap-3" style={{ height: '100%' }}>
                    <div className="pi pi-spin pi-spinner" style={{ fontSize: '6rem' }}></div>
                    <p>Loading...</p>
                </div>
            }
        >
            <div className="grid crud-demo">
                <div className="col-12">
                    <div className="card">
                        <h4>Laporan Buku Besar</h4>
                        <hr />
                        <Toast ref={toast} />
                        <Panel header="Filter" toggleable>
                            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                                {/* Form Kiri */}
                                <div className="formgrid grid" style={{ width: '100%' }}>
                                    {/* Rekening */}
                                    <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label>Rekening</label>
                                    </div>
                                    <div className="field col-10 mb-2 lg:col-10">
                                        <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                            <label style={{ marginBottom: '0' }}>:</label>
                                            <div className="field col-10 mb-2 lg:col-10">
                                                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                                    <div className="col-5 mb-2 col-5">
                                                        <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                                            <InputText style={{ width: '20%', borderRadius: '5px' }} id="satuan3" value={jurnal.RekeningAwal} onChange={(e) => onInputChange(e, 'RekeningAwal')} />
                                                            <Button
                                                                icon="pi pi-search"
                                                                className="p-button"
                                                                style={{
                                                                    'margin-left': '5px',
                                                                    'margin-right': '5px',
                                                                    borderRadius: '5px'
                                                                }}
                                                                onClick={handleSearchButtonClick('RekeningAwal')}
                                                            />
                                                            <InputText style={{ width: '60%', borderRadius: '5px' }} disabled id="ket-Satuan" value={jurnal.KetRekeningAwal} />
                                                        </div>
                                                    </div>
                                                    <label style={{ margin: '5px' }}>s.d</label>
                                                    <div className="col-5 mb-2 col-5">
                                                        <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                                            <InputText style={{ width: '20%', borderRadius: '5px' }} id="satuan3" value={jurnal.RekeningAkhir} onChange={(e) => onInputChange(e, 'RekeningAkhir')} />
                                                            <Button
                                                                icon="pi pi-search"
                                                                className="p-button"
                                                                style={{
                                                                    'margin-left': '5px',
                                                                    'margin-right': '5px',
                                                                    borderRadius: '5px'
                                                                }}
                                                                onClick={handleSearchButtonClick('RekeningAkhir')}
                                                            />
                                                            <InputText style={{ width: '60%', borderRadius: '5px' }} disabled id="ket-Satuan" value={jurnal.KetRekeningAkhir} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Antara Tanggal */}
                                    <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                        <label style={{ marginBottom: '0' }}>Antara Tanggal</label>
                                    </div>
                                    <div className="field col-10 mb-2 lg:col-10">
                                        <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                            <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                                <Calendar name="startDate" value={tglAwal} onInput={handleStartDateChange} onChange={handleStartDate} placeholder="Start Date" dateFormat="dd-mm-yy" showIcon />
                                            </div>
                                            <label style={{ margin: '2px' }}>s.d.</label>
                                            <div className="field col-2 mb-2 lg:col-2" style={{ display: 'flex', alignItems: 'center' }}>
                                                <Calendar name="endDate" value={tglAkhir} onInput={handleEndDateChange} onChange={handleEndDate} placeholder="End Date" dateFormat="dd-mm-yy" showIcon />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Panel>
                        <Toolbar className="mb-4" right={leftToolbarTemplate}></Toolbar>

                        <TabView activeIndex={activeIndexTabel} onTabChange={toggleDataTable}>
                            <TabPanel header="Total">
                                <DataTable
                                    ref={dt}
                                    value={bukuBesarTotalTabelFilt}
                                    first={first} // Menggunakan nilai halaman pertama dari state
                                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                                    paginator
                                    className="datatable-responsive"
                                    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                    totalRecords={totalRecordsTotal} // Total number of records
                                    size="small"
                                    loading={loading}
                                    header={header}
                                    emptyMessage="Data Kosong"
                                    resizableColumns
                                    stripedRows
                                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)} // Mengatur jumlah baris per halaman berdasarkan pilihan pengguna
                                >
                                    {/* <Column field="ID" header="ID"></Column> */}
                                    <Column
                                        field="No"
                                        header="NO."
                                        style={{
                                            Width: '80px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '80px'
                                        }}
                                    ></Column>
                                    <Column field="Tgl" header="TGL"></Column>
                                    <Column
                                        field="Keterangan"
                                        header="KETERANGAN"
                                        body={(rowData) => (rowData.Tgl === '' ? <b>{rowData.Keterangan}</b> : rowData.Keterangan)}
                                        style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '200px'
                                        }}
                                    ></Column>
                                    <Column
                                        field="Debet"
                                        body={(rowData) => {
                                            const value = rowData.Debet ? parseInt(rowData.Debet).toLocaleString() : '';
                                            return value;
                                        }}
                                        align={'right'}
                                        header="DEBET"
                                    ></Column>
                                    <Column
                                        field="Kredit"
                                        body={(rowData) => {
                                            const value = rowData.Kredit ? parseInt(rowData.Kredit).toLocaleString() : '';
                                            return value;
                                        }}
                                        align={'right'}
                                        header="KREDIT"
                                    ></Column>
                                    <Column
                                        field="Akhir"
                                        body={(rowData) => {
                                            const value = rowData.Akhir ? parseInt(rowData.Akhir).toLocaleString() : '';
                                            return value;
                                        }}
                                        align={'right'}
                                        header="SALDO AKHIR"
                                    ></Column>
                                </DataTable>
                            </TabPanel>

                            <TabPanel header="Detail">
                                <DataTable
                                    ref={dt}
                                    value={bukuBesarDetailTabelFilt}
                                    first={first} // Menggunakan nilai halaman pertama dari state
                                    rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                                    onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                                    paginator
                                    className="datatable-responsive"
                                    paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                                    currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                                    // first={lazyState.first} // Assuming first is a state variable to manage the current page
                                    totalRecords={totalRecordsTotal} // Total number of records
                                    // onPage={onPage} // onPage function to handle page change
                                    size="small"
                                    loading={loading}
                                    header={headerDetail}
                                    emptyMessage="Data Kosong"
                                    resizableColumns
                                    stripedRows
                                    onRowsPerPageChange={(e) => setRowsPerPage(e.value)} // Mengatur jumlah baris per halaman berdasarkan pilihan pengguna
                                >
                                    <Column
                                        field="No"
                                        header="NO."
                                        body={(rowData) => (rowData.Tgl === '' ? <b>{rowData.No}</b> : rowData.No)}
                                        style={{
                                            Width: '80px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '80px'
                                        }}
                                    ></Column>
                                    <Column
                                        field="Faktur"
                                        header="NO. BUKTI"
                                        body={(rowData) => (rowData.Tgl === '' ? <b>{rowData.Faktur}</b> : rowData.Faktur)}
                                        style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '200px'
                                        }}
                                    ></Column>
                                    <Column
                                        field="Tgl"
                                        header="TGL"
                                        style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '100px'
                                        }}
                                    ></Column>
                                    <Column
                                        field="Keterangan"
                                        header="KETERANGAN"
                                        body={(rowData) => (rowData.Tgl === '' ? <b>{rowData.Keterangan}</b> : rowData.Keterangan)}
                                        style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            maxWidth: '200px'
                                        }}
                                    ></Column>
                                    <Column
                                        field="Debet"
                                        body={(rowData) => {
                                            const value = rowData.Debet ? parseInt(rowData.Debet).toLocaleString() : '';
                                            return value;
                                        }}
                                        style={{ textAlign: 'right' }}
                                        header="DEBET"
                                    ></Column>
                                    <Column
                                        field="Kredit"
                                        body={(rowData) => {
                                            const value = rowData.Kredit ? parseInt(rowData.Kredit).toLocaleString() : '';
                                            return value;
                                        }}
                                        style={{ textAlign: 'right' }}
                                        header="KREDIT"
                                    ></Column>
                                    <Column
                                        field="Akhir"
                                        body={(rowData) => {
                                            const value = rowData.Akhir ? parseInt(rowData.Akhir).toLocaleString() : '';
                                            return value;
                                        }}
                                        style={{ textAlign: 'right' }}
                                        header="SALDO AKHIR"
                                    ></Column>
                                </DataTable>
                            </TabPanel>
                        </TabView>
                    </div>
                </div>
                <MultipleRekeningCOA formField={activeFormField} setRekeningDialog={setRekeningDialog} onRowSelect={onRowSelectKode} rekeningDialog={rekeningDialog} />
                <AdjustPrintMarginLaporan adjustDialog={adjustDialogTotal} setAdjustDialog={setAdjustDialogTotal} btnAdjust={btnAdjustTotal} handleAdjust={handleAdjustTotal} excel={exportExcelTotal}></AdjustPrintMarginLaporan>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialogDetail} setAdjustDialog={setAdjustDialogDetail} btnAdjust={btnAdjustDetail} handleAdjust={handleAdjustDetail} excel={exportExcelDetail}></AdjustPrintMarginLaporan>
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                    </div>
                </Dialog>
            </div>
        </BlockUI>
    );
}

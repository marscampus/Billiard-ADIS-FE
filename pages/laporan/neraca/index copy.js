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
 * Created on Wed Jul 24 2024 - 04:07:58
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { getSessionServerSide } from '../../../utilities/servertool';
import { startOfMonth } from 'date-fns';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Calendar } from 'primereact/calendar';
import { convertToISODate, formatAndSetDate, formatDate, formatDateTable, getEmail, getNameMonth, getUserName, subtractOneDay } from '../../../component/GeneralFunction/GeneralFunction';
import { Button } from 'primereact/button';
import { TabPanel, TabView } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
// import { Column } from 'jspdf-autotable';
import postData from '../../../lib/Axios';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import { Dialog } from 'primereact/dialog';
import PDFViewer from '../../../component/PDFViewer';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';
import jsPDF from 'jspdf';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function LaporanNeraca() {
    const apiEndPointGet = '/api/laporan/neraca/get';
    const toast = useRef(null);
    const [neracaTabel, setNeracaTabel] = useState([]);
    const [neracaTabelFilt, setNeracaTabelFilt] = useState([]);
    const [neracaAktivaTabel, setNeracaAktivaTabel] = useState([]);
    const [neracaPasivaTabel, setNeracaPasivaTabel] = useState();
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    // Mendapatkan bulan sebelumnya dan bulan ini dengan nama bulan
    const previousMonth = new Date(startDate.getFullYear(), startDate.getMonth() - 1);
    const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth());
    const previousMonthString = getNameMonth(previousMonth);
    const currentMonthString = getNameMonth(currentMonth);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const fileName = `laporan-neraca-${new Date().toISOString().slice(0, 10)}`;
    // Tabel Total
    const [totalBulanKemarinTabel, setTotalBulanKemarinTabel] = useState();
    const [totalBulanIniTabel, setTotalBulanIniTabel] = useState([]);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    const loadLazyData = async () => {
        try {
            setLoading(true);
            const requestData = {
                TglAwal: convertToISODate(startDate),
                TglAkhir: convertToISODate(endDate)
            };

            const vaTable = await postData(apiEndPointGet, requestData);
            const json = vaTable.data;

            // Pastikan properti jenis tersedia (jika tidak, fallback ke properti Jenis)
            const neracaAktivaTabel = json?.dataAktiva.map((item) => ({
                ...item,
                SaldoAwal: item.SaldoAwal || 0,
                SaldoAkhir: item.SaldoAkhir || 0,
                jenis: item.jenis || item.Jenis || '',
                Debet: item.Debet || 0,
                Kredit: item.Kredit || 0
            }));

            const neracaPasivaTabel = json?.dataPasiva.map((item) => ({
                ...item,
                SaldoAwal: item.SaldoAwal || 0,
                SaldoAkhir: item.SaldoAkhir || 0,
                jenis: item.jenis || item.Jenis || '',
                Debet: item.Debet || 0,
                Kredit: item.Kredit || 0
            }));

            // Fungsi filter: tampilkan semua data jika jenis adalah "I",
            // sedangkan untuk "D" hanya tampilkan jika salah satu nilai tidak nol
            const filterTanpaNol = (item) => {
                if (item.jenis === 'I') {
                    return true;
                } else if (item.jenis === 'D') {
                    return item.SaldoAwal !== 0 || item.SaldoAkhir !== 0;
                }
                return true;
            };

            const neracaAktivaTabelTanpaNol = neracaAktivaTabel.filter(filterTanpaNol);
            const neracaPasivaTabelTanpaNol = neracaPasivaTabel.filter(filterTanpaNol);

            setNeracaAktivaTabel(neracaAktivaTabelTanpaNol);
            setNeracaPasivaTabel(neracaPasivaTabelTanpaNol);

            if (neracaAktivaTabel !== null && neracaPasivaTabel !== null) {
                const tempNeraca = neracaAktivaTabel.concat(neracaPasivaTabel);
                const neracaGabunganTanpaNol = tempNeraca.filter(filterTanpaNol);
                setNeracaTabel(neracaGabunganTanpaNol);
                // Total
                setTotalBulanKemarinTabel(json.awal);
                setTotalBulanIniTabel(json.akhir);
            }
        } catch (error) {
            let e = error?.response?.data || error;
            showError(e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    // Handle Date
    const handleStartDate = (e) => {
        setStartDate(e.value);
    };
    const handleStartDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setStartDate);
    };
    const handleEndDate = (e) => {
        setEndDate(e.value);
    };
    const handleEndDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setEndDate);
    };

    // Yang Handle TabView
    const toggleDataTable = async (event) => {
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        loadLazyData();
        setLoadingItem(false);
    };

    // Yang Handle Bold
    const rowClass = (rowData) => {
        console.log(rowData);

        return rowData.jenis == 'I' ? 'bold-row' : '2';
    };

    // Yang Handle Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <div className="formgrid grid" style={{ width: '100%' }}>
                        {/* Antara Tanggal */}
                        <div className="field col-3 mb-2 lg:col-3" style={{ display: 'flex', alignItems: 'center' }}>
                            <label style={{ marginBottom: '0' }}>Antara Tanggal</label>
                        </div>
                        <div className="field col-9 mb-2 lg:col-9">
                            <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                                <label style={{ marginBottom: '0', marginRight: '8px' }}>:</label>
                                <div className="field col-5 mb-2 lg:col-5" style={{ display: 'flex', alignItems: 'center' }}>
                                    <Calendar
                                        style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}
                                        name="startDate"
                                        value={startDate}
                                        onInput={handleStartDateChange}
                                        onChange={handleStartDate}
                                        placeholder="Start Date"
                                        dateFormat="dd-mm-yy"
                                        showIcon
                                    />
                                </div>
                                <label style={{ margin: '2px' }}>s.d.</label>
                                <div className="field col-5 mb-2 lg:col-5" style={{ display: 'flex', alignItems: 'center' }}>
                                    <Calendar
                                        style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}
                                        name="endDate"
                                        value={endDate}
                                        onInput={handleEndDateChange}
                                        onChange={handleEndDate}
                                        placeholder="End Date"
                                        dateFormat="dd-mm-yy"
                                        showIcon
                                    />
                                </div>
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
                <Button label="Refresh" icon="pi pi-refresh" className="p-button-primary mr-2 ml-2" onClick={loadLazyData} />
            </React.Fragment>
        );
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (neracaTabel.length == 0 || !neracaTabel) {
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
            const rekeningPDF = neracaTabel ? JSON.parse(JSON.stringify(neracaTabel)) : [];

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

            if (!rekeningPDF || rekeningPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Neraca';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + ' s.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = rekeningPDF.map((item) => [
                item.Kode,
                item.Keterangan,
                item.SaldoAwal ? parseInt(item.SaldoAwal).toLocaleString() : 0,
                item.Debet ? parseInt(item.Debet).toLocaleString() : 0,
                item.Kredit ? parseInt(item.Kredit).toLocaleString() : 0,
                item.SaldoAkhir ? parseInt(item.SaldoAkhir).toLocaleString() : 0
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'KETERANGAN', 'SALDO AWAL', 'DEBET', 'KREDIT', 'SALDO AKHIR']],
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
                    2: { halign: 'right' },
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
                didParseCell: function (data) {
                    // Mengambil data asli dari rekeningPDF berdasarkan index baris
                    const currentRow = rekeningPDF[data.row.index];
                    // Jika JenisRekening adalah 'I', maka set style cell menjadi bold
                    if (currentRow && currentRow.JenisRekening === 'I') {
                        data.cell.styles.fontStyle = 'bold';
                    }
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
            showError(error?.message || 'Terjadi Kesalahan');
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(neracaTabel, 'laporan-neraca.xlsx');
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
                <h4>Laporan Neraca</h4>
                <hr></hr>
                <Toast ref={toast}></Toast>
                <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
                <TabView activeIndex={activeIndex} onTabChange={toggleDataTable}>
                    {/* NERACA HARIAN*/}
                    <TabPanel header="Neraca Harian">
                        <DataTable size="small" value={neracaTabel} scrollable scrollHeight="550px" loading={loading} emptyMessage="Data Kosong" className="datatable-responsive" filter rowClassName={rowClass}>
                            <Column field="Kode" header="KODE" body={(rowData) => (rowData.jenis === 'I' ? <b>{rowData.Kode}</b> : rowData.Kode)}></Column>
                            <Column field="Keterangan" header="KETERANGAN" body={(rowData) => (rowData.jenis === 'I' ? <b>{rowData.Keterangan}</b> : rowData.Keterangan)}></Column>
                            <Column
                                field="SaldoAwal"
                                align={'right'}
                                headerStyle={{ textAlign: 'right' }}
                                bodyStyle={{ textAlign: 'right' }}
                                header={subtractOneDay(startDate)}
                                body={(rowData) => {
                                    if (rowData.SaldoAwal == null) {
                                        return null; // Handle null values by returning null
                                    }
                                    const formattedValue =
                                        rowData.SaldoAwal !== 0 && !isNaN(rowData.SaldoAwal)
                                            ? rowData.SaldoAwal < 0
                                                ? `(${Math.abs(rowData.SaldoAwal).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})`
                                                : rowData.SaldoAwal.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')
                                            : null;

                                    return formattedValue && rowData.jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                }}
                            ></Column>

                            <Column
                                align={'right'}
                                field="Debet"
                                headerStyle={{ textAlign: 'right' }}
                                bodyStyle={{ textAlign: 'right' }}
                                header="DEBET"
                                body={(rowData) => {
                                    if (rowData.Debet == null) {
                                        return null; // Handle null values by returning null
                                    }
                                    const formattedValue =
                                        rowData.Debet !== 0 && !isNaN(rowData.Debet)
                                            ? rowData.Debet < 0
                                                ? `(${Math.abs(rowData.Debet).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})`
                                                : rowData.Debet.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')
                                            : null;
                                    return formattedValue && rowData.jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                }}
                            ></Column>

                            <Column
                                align={'right'}
                                field="Kredit"
                                headerStyle={{ textAlign: 'right' }}
                                bodyStyle={{ textAlign: 'right' }}
                                header="KREDIT"
                                body={(rowData) => {
                                    if (rowData.Kredit == null) {
                                        return null; // Handle null values by returning null
                                    }
                                    const formattedValue =
                                        rowData.Kredit !== 0 && !isNaN(rowData.Kredit)
                                            ? rowData.Kredit < 0
                                                ? `(${Math.abs(rowData.Kredit).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})`
                                                : rowData.Kredit.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')
                                            : null;
                                    return formattedValue && rowData.jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                }}
                            ></Column>

                            <Column
                                align={'right'}
                                field="SaldoAkhir"
                                headerStyle={{ textAlign: 'right' }}
                                bodyStyle={{ textAlign: 'right' }}
                                header={formatDate(endDate)}
                                body={(rowData) => {
                                    if (rowData.SaldoAkhir == null) {
                                        return null; // Handle null values by returning null
                                    }
                                    const formattedValue =
                                        rowData.SaldoAkhir !== 0 && !isNaN(rowData.SaldoAkhir)
                                            ? rowData.SaldoAkhir < 0
                                                ? `(${Math.abs(rowData.SaldoAkhir).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})`
                                                : rowData.SaldoAkhir.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')
                                            : null;
                                    return formattedValue && rowData.jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                }}
                            ></Column>
                        </DataTable>
                        <Toolbar className="mb-4" left={preview}></Toolbar>
                        <div style={{ margin: '50px 0' }}></div>
                        {/* Tabel Total Bulan Kemarin*/}
                        <DataTable size="small" value={totalBulanKemarinTabel} scrollable scrollHeight="300px" emptyMessage="Data Kosong" className="datatable-responsive">
                            <Column field="TotalAset" header={previousMonthString}></Column>
                            <Column field="SaldoAktiva" body={(rowData) => (rowData.SaldoAktiva ? `${rowData.SaldoAktiva.toLocaleString()}` : '0')} header="SALDO"></Column>
                            <Column field="Status" header="STATUS"></Column>
                            <Column field="Keterangan" header="KETERANGAN"></Column>
                            <Column field="SaldoPasiva" body={(rowData) => (rowData.SaldoPasiva ? `${rowData.SaldoPasiva.toLocaleString()}` : '0')} header="SALDO"></Column>
                        </DataTable>
                        <div style={{ margin: '50px 0' }}></div>
                        {/* Tabel Total Bulan Ini*/}
                        <DataTable size="small" value={totalBulanIniTabel} scrollable scrollHeight="300px" emptyMessage="Data Kosong" className="datatable-responsive">
                            <Column field="TotalAset" header={currentMonthString}></Column>
                            <Column field="SaldoAktiva" body={(rowData) => (rowData.SaldoAktiva ? `${rowData.SaldoAktiva.toLocaleString()}` : '0')} header="SALDO"></Column>
                            <Column field="Status" header="STATUS"></Column>
                            <Column field="Keterangan" header="KETERANGAN"></Column>
                            <Column field="SaldoPasiva" body={(rowData) => (rowData.SaldoPasiva ? `${rowData.SaldoPasiva.toLocaleString()}` : '0')} header="SALDO"></Column>
                        </DataTable>
                    </TabPanel>
                    {/* LABA RUGI SALDO */}
                    <TabPanel header="Neraca Saldo">
                        <div className="field col-12 mb-2 lg:col-12">
                            <div className="formgrid grid">
                                <div className="field col-12 mb-2 lg:col-6">
                                    <h2>Aktiva</h2>
                                </div>
                                <div className="field col-12 mb-2 lg:col-6">
                                    <h2>Pasiva</h2>
                                </div>
                                <div className="field col-12 mb-2 lg:col-6">
                                    <DataTable size="small" value={neracaAktivaTabel} scrollable scrollHeight="550px" loading={loading} emptyMessage="Data Kosong" className="datatable-responsive" filter rowClassName={rowClass}>
                                        <Column field="Kode" header="KODE" body={(rowData) => (rowData.jenis === 'I' ? <b>{rowData.Kode}</b> : rowData.Kode)}></Column>
                                        <Column field="Keterangan" header="KETERANGAN" body={(rowData) => (rowData.jenis === 'I' ? <b>{rowData.Keterangan}</b> : rowData.Keterangan)}></Column>
                                        <Column
                                            field="SaldoAkhir"
                                            header={formatDate(endDate)}
                                            body={(rowData) => {
                                                const formattedValue =
                                                    rowData.SaldoAkhir !== 0 && !isNaN(rowData.SaldoAkhir)
                                                        ? rowData.SaldoAkhir < 0
                                                            ? `(${Math.abs(rowData.SaldoAkhir).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})` // Menghapus "IDR" dan mengganti koma dengan titik
                                                            : rowData.SaldoAkhir.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.') // Menghapus "IDR" dan mengganti koma dengan titik
                                                        : null;
                                                return formattedValue && rowData.jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                            }}
                                        ></Column>
                                    </DataTable>
                                </div>
                                <div className="field col-12 mb-2 lg:col-6">
                                    <DataTable size="small" value={neracaPasivaTabel} scrollable scrollHeight="550px" loading={loading} emptyMessage="Data Kosong" className="datatable-responsive" filter rowClassName={rowClass}>
                                        <Column field="Kode" header="KODE" body={(rowData) => (rowData.jenis === 'I' ? <b>{rowData.Kode}</b> : rowData.Kode)}></Column>
                                        <Column field="Keterangan" header="KETERANGAN" body={(rowData) => (rowData.jenis === 'I' ? <b>{rowData.Keterangan}</b> : rowData.Keterangan)}></Column>
                                        <Column
                                            field="SaldoAkhir"
                                            header={formatDate(endDate)}
                                            body={(rowData) => {
                                                const formattedValue =
                                                    rowData.SaldoAkhir !== 0 && !isNaN(rowData.SaldoAkhir)
                                                        ? rowData.SaldoAkhir < 0
                                                            ? `(${Math.abs(rowData.SaldoAkhir).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})` // Menghapus "IDR" dan mengganti koma dengan titik
                                                            : rowData.SaldoAkhir.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.') // Menghapus "IDR" dan mengganti koma dengan titik
                                                        : null;
                                                return formattedValue && rowData.jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                            }}
                                        ></Column>
                                    </DataTable>
                                </div>
                            </div>
                        </div>
                    </TabPanel>
                </TabView>
            </div>
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                </div>
            </Dialog>
        </div>
    );
}

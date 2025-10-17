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
 * Created on Fri Jul 19 2024 - 03:29:58
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { Calendar } from 'primereact/calendar'; import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BlockUI } from 'primereact/blockui';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import { convertToISODate, formatAndSetDate, formatDate, getEmail, getUserName, showError, subtractOneDay, subtractOneDayYMD } from '../../../component/GeneralFunction/GeneralFunction';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../component/PDFViewer';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function LaporanLabaRugi() {
    const apiEndPointGet = '/api/laporan/laba-rugi/get';
    const toast = useRef(null);
    const [labaRugiHarianTabel, setLabaRugiHarianTabel] = useState([]);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const fileName = `laporan-laba-rugi-${new Date().toISOString().slice(0, 10)}`;
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

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const requestData = {
                TglAwal: subtractOneDayYMD(startDate),
                TglAkhir: convertToISODate(endDate)
            };

            // Memanggil endpoint API
            const vaTable = await postData(apiEndPointGet, requestData);
            const json = vaTable.data.data;

            // Memisahkan data berdasarkan awalan rekening
            const pendapatan = [];
            const hpp = [];
            const biaya = [];

            json.forEach((item) => {
                const rekening = item.Kode;
                if (rekening.startsWith('4')) {
                    pendapatan.push(item);
                } else if (rekening.startsWith('5')) {
                    biaya.push(item);
                }
            });

            // GABUNGAN
            setLabaRugiHarianTabel(json);
        } catch (error) {
            console.error('Error loading data:', error);
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

    // Yang Handle Pencarian
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:align-items-center">
                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                    {/* <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} /> */}
                </div>
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih kolom" style={{ marginRight: '0.5rem' }} /> */}
                <span className="block p-input-icon-left" style={{ marginRight: '0.5rem' }}>
                    <i className="pi pi-search" />
                    {/* <InputText type="search" onInput={(e) => onSearch(e.target.value)} placeholder="Search..." /> */}
                </span>
            </div>
        </div>
    );

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
                <Button label="Preview" icon="pi pi-file-o" className="p-button-warning mr-2 ml-2" onClick={btnAdjust} />
            </React.Fragment>
        );
    };

    // Yang Handle Bold
    const rowClass = (rowData) => {
        return rowData.JenisRekening === 'I' ? 'bold-row' : '2';
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (labaRugiHarianTabel.length == 0 || !labaRugiHarianTabel) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    };

    const exportPDF = async (dataAdjust) => {
        setLoadingPreview(true);
        try {
            const rekeningPDF = labaRugiHarianTabel ? JSON.parse(JSON.stringify(labaRugiHarianTabel)) : [];
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

            let paraf1 = dataAdjust?.paraf1 || '';
            let paraf2 = dataAdjust?.paraf2 || '';
            let namaPetugas1 = dataAdjust?.namaPetugas1 || '';
            let namaPetugas2 = dataAdjust?.namaPetugas2 || '';
            let jabatan1 = dataAdjust?.jabatan1 || '';
            let jabatan2 = dataAdjust?.jabatan2 || '';

            if (!rekeningPDF || rekeningPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Laba Rugi';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + ' s.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = rekeningPDF.map((item) => [
                item.Kode,
                item.Keterangan,
                item.SaldoAwal ? parseInt(item.SaldoAwal).toLocaleString() : '',
                item.Mutasi ? parseInt(item.Mutasi).toLocaleString() : '',
                item.SaldoAkhir ? parseInt(item.SaldoAkhir).toLocaleString() : ''
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'KETERANGAN', 'SALDO AWAL', 'MUTASI', 'SALDO AKHIR']],
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
                    4: { halign: 'right' }
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
                    if (currentRow && currentRow.Jenis === 'I') {
                        data.cell.styles.fontStyle = 'bold';
                    }
                },
                didDrawPage: (data) => {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm, paraf1, paraf2, namaPetugas1, namaPetugas2, jabatan1, jabatan2 });
            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
        } catch (error) {
            showError(toast, error?.message || 'Terjadi Kesalahan');
        } finally {
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(labaRugiHarianTabel, 'laporan-laba-rugi.xlsx');
    };

    return (
        <BlockUI
            blocked={loadingPreview}
            template={
                <div className="flex align-items-center justify-content-center flex-column gap-3" style={{ height: '100%' }}>
                    <div className="pi pi-spin pi-spinner" style={{ fontSize: '6rem' }}></div>
                    <p>Loading...</p>
                </ div>
            }
        >
            <div className="full-page">
                <div className="card">
                    <h4>Laporan Laba Rugi</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

                    {/* LABA RUGI HARIAN */}
                    <div className="laba-rugi-section">
                        <DataTable
                            size="small"
                            value={labaRugiHarianTabel}
                            scrollable
                            scrollHeight="550px"
                            loading={loading}
                            emptyMessage="Data Kosong"
                            className="datatable-responsive"
                            filter
                            rowClassName={rowClass}
                        >
                            <Column
                                field="Kode"
                                header="KODE"
                                body={(rowData) => rowData.Jenis === 'I' ? <b>{rowData.Kode}</b> : rowData.Kode}
                            />
                            <Column
                                field="Keterangan"
                                header="KETERANGAN"
                                body={(rowData) => rowData.Jenis === 'I' ? <b>{rowData.Keterangan}</b> : rowData.Keterangan}
                            />
                            <Column
                                field="SaldoAwal"
                                header={subtractOneDay(startDate)}
                                align="right"
                                body={(rowData) => {
                                    if (rowData.SaldoAwal == null) return null;
                                    const formattedValue =
                                        rowData.SaldoAwal !== 0 && !isNaN(rowData.SaldoAwal)
                                            ? rowData.SaldoAwal < 0
                                                ? `(${Math.abs(rowData.SaldoAwal).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})`
                                                : rowData.SaldoAwal.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')
                                            : null;
                                    return rowData.Jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                }}
                            />
                            <Column
                                field="Mutasi"
                                header="MUTASI"
                                align="right"
                                body={(rowData) => {
                                    if (rowData.Mutasi == null) return null;
                                    const formattedValue =
                                        rowData.Mutasi !== 0 && !isNaN(rowData.Mutasi)
                                            ? rowData.Mutasi < 0
                                                ? `(${Math.abs(rowData.Mutasi).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})`
                                                : rowData.Mutasi.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')
                                            : null;
                                    return rowData.Jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                }}
                            />
                            <Column
                                field="SaldoAkhir"
                                header={formatDate(endDate)}
                                align="right"
                                body={(rowData) => {
                                    if (rowData.SaldoAkhir == null) return null;
                                    const formattedValue =
                                        rowData.SaldoAkhir !== 0 && !isNaN(rowData.SaldoAkhir)
                                            ? rowData.SaldoAkhir < 0
                                                ? `(${Math.abs(rowData.SaldoAkhir).toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')})`
                                                : rowData.SaldoAkhir.toLocaleString('id-ID').replace('IDR', '').replace(/,/g, '.')
                                            : null;
                                    return rowData.Jenis === 'I' ? <b>{formattedValue}</b> : formattedValue;
                                }}
                            />
                        </DataTable>
                    </div>
                </div>
                <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                    <div className="p-dialog-content">
                        <PDFViewer pdfUrl={pdfUrl} fileName={fileName} />
                    </div>
                </Dialog>
            </div>
        </BlockUI>
    );
}

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
 * Created on Mon May 13 2024 - 02:01:33
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { Panel } from 'primereact/panel';
import { Calendar } from 'primereact/calendar';
import { convertToISODate, formatAndSetDate, formatDate, getEmail, getUserName } from '../../../../component/GeneralFunction/GeneralFunction';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'jspdf-autotable';
import { Dialog } from 'primereact/dialog';
import PDFViewer from '../../../../component/PDFViewer';
import { Button } from 'primereact/button';
import postData from '../../../../lib/Axios';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import jsPDF from 'jspdf';
import { Footer, Header, HeaderAsli, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
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

export default function LaporanNilaiPersediaan() {
    const apiEndPointGet = '/api/laporan/transaksi-stock/nilai-persediaan';

    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [nilaiPersediaanTable, setNilaiPersediaanTable] = useState(null);
    const [nilaiPersediaanTableFilt, setNilaiPersediaanTableFilt] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [dataNilaiPersediaan, setDataNilaiPersediaan] = useState([]);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [totalHargaPokok, setTotalHargaPokok] = useState(0);
    const [totalSaldoStock, setTotalSaldoStock] = useState(0);
    const [totalNilaiStock, setTotalNilaiStock] = useState(0);
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
        { name: 's.Kode', label: 'Kode' },
        { name: 's.Kode_Toko', label: 'Barcode' },
        { name: 's.Nama', label: 'Nama' }
    ];

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        try {
            let requestBody = {
                ...lazyState,
                Tgl: convertToISODate(startDate)
            };
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setNilaiPersediaanTable(json.data);
            setTotalHargaPokok(json.totals.totalHargaPokok);
            setTotalSaldoStock(json.totals.totalSaldoStock);
            setTotalNilaiStock(json.totals.totalNilaiStock);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // Yang Handle Inputan Tanggal
    const handleStartDate = (e) => {
        setStartDate(e.value);
    };

    const handleStartDateChange = (e) => {
        const inputValue = e.target.value;
        formatAndSetDate(inputValue, setStartDate);
    };

    // Yang Handle Preview
    const btnAdjust = () => {
        if (nilaiPersediaanTable.length == 0 || !nilaiPersediaanTable) {
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
            setLoadingPreview(true);
            const nilaiPersediaanPDF = nilaiPersediaanTableFilt ? JSON.parse(JSON.stringify(nilaiPersediaanTableFilt)) : [];

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

            if (!nilaiPersediaanPDF || nilaiPersediaanPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Nilai Persediaan';
            const periodeLaporan = 'Tanggal ' + formatDate(startDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = nilaiPersediaanPDF.map((item) => [
                item.Kode,
                item.Barcode,
                item.Nama,
                item.Satuan,
                parseInt(item.HargaBeli).toLocaleString(),
                parseInt(item.HargaJual).toLocaleString(),
                parseInt(item.HargaPokok).toLocaleString(),
                parseInt(item.SaldoStock).toLocaleString(),
                parseInt(item.NilaiStock).toLocaleString()
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'BARCODE', 'NAMA PRODUK', 'SATUAN', 'HARGA BELI', 'HARGA POKOK', 'HARGA JUAL', 'SALDO STOCK', 'NILAI STOCK']],
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
        exportToXLSX(nilaiPersediaanTableFilt, 'laporan-nilai-persediaan.xlsx');
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

    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };

    useEffect(() => {
        setNilaiPersediaanTableFilt(nilaiPersediaanTable);
    }, [nilaiPersediaanTable, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = nilaiPersediaanTable.filter((d) => (x ? x.test(d.Barcode) || x.test(d.Kode) || x.test(d.Nama) || x.test(d.Satuan) : []));
            setSearch(searchVal);
        }

        setNilaiPersediaanTableFilt(filtered);
    };

    // Yang Handle Search
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="tgl" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} placeholder="Tanggal" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} />
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.name != null) {
            _lazyState['filters'][defaultOption.name] = value;
        }
        onPage(_lazyState);
    };

    return (
        <div className="full-page">
            <div className="card">
                <h4>Laporan Nilai Persediaan</h4>
                <hr />
                <Toast ref={toast} />
                <DataTable
                    value={nilaiPersediaanTableFilt}
                    // globalFilter={globalFilter}
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
                    <Column field="Barcode" header="BARCODE"></Column>
                    <Column field="Kode" header="KODE"></Column>
                    <Column field="Nama" header="NAMA PRODUK"></Column>
                    <Column field="Satuan" header="SATUAN" footer={'TOTAL'}></Column>
                    <Column
                        field="HargaBeli"
                        body={(rowData) => {
                            const value = rowData.HargaBeli ? parseInt(rowData.HargaBeli).toLocaleString() : 0;
                            return value;
                        }}
                        header="HARGA BELI"
                    ></Column>
                    <Column
                        field="HargaPokok"
                        body={(rowData) => {
                            const value = rowData.HargaPokok ? parseInt(rowData.HargaPokok).toLocaleString() : 0;
                            return value;
                        }}
                        footer={parseInt(totalHargaPokok).toLocaleString()}
                        header="HARGA POKOK"
                    ></Column>
                    <Column
                        field="HargaJual"
                        body={(rowData) => {
                            const value = rowData.HargaJual ? parseInt(rowData.HargaJual).toLocaleString() : 0;
                            return value;
                        }}
                        header="HARGA JUAL"
                    ></Column>
                    <Column
                        field="SaldoStock"
                        body={(rowData) => {
                            const value = rowData.SaldoStock ? parseInt(rowData.SaldoStock).toLocaleString() : 0;
                            return value;
                        }}
                        footer={parseInt(totalSaldoStock).toLocaleString()}
                        header="SALDO STOCK"
                    ></Column>
                    <Column
                        field="NilaiStock"
                        body={(rowData) => {
                            const value = rowData.NilaiStock ? parseInt(rowData.NilaiStock).toLocaleString() : 0;
                            return value;
                        }}
                        footer={parseInt(totalNilaiStock).toLocaleString()}
                        header="NILAI STOCK"
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

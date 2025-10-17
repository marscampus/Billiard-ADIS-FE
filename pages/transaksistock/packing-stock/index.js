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
 * Created on Wed Apr 24 2024 - 01:51:06
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { startOfMonth } from 'date-fns';
import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { convertToISODate, formatAndSetDate, formatDate, formatDateTable, getEmail, getUserName } from '../../../component/GeneralFunction/GeneralFunction';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { getSessionServerSide } from '../../../utilities/servertool';
import { Calendar } from 'primereact/calendar';
import postData from '../../../lib/Axios';
import PDFViewer from '../../../component/PDFViewer';
import jsPDF from 'jspdf';
import { Footer, Header, HeaderLaporan, addPageInfo } from '../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function PackingStock() {
    const apiEndPointGet = '/api/packing-stock/data';
    const apiEndPointGetDataEdit = '/api/packing-stock/data-edit';
    const apiEndPointDelete = '/api/packing-stock/delete';

    const toast = useRef(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [packingStock, setPackingStock] = useState([]);
    const [packingStockTabel, setPackingStockTabel] = useState(null);
    const [packingStockTabelFilt, setPackingStockTabelFilt] = useState(null);
    const [totalRecords, setTotalRecords] = useState(0);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [defaultOption, setDropdownValue] = useState(null);
    const [deletePackingStockDialog, setDeletePackingStockDialog] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [adjustDialog, setAdjustDialog] = useState(false);
    // JSPDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [marginTop, setMarginTop] = useState(10);
    const [marginLeft, setMarginLeft] = useState(10);
    const [marginRight, setMarginRight] = useState(10);
    const [marginBottom, setMarginBottom] = useState(10);
    const [tableWidth, setTableWidth] = useState(800);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const [search, setSearch] = useState('');
    const paperSizes = [
        { name: 'A4', value: 'A4' },
        { name: 'Letter', value: 'Letter' },
        { name: 'Legal', value: 'Legal' }
    ];
    const orientationOptions = [
        { label: 'Potret', value: 'portrait' },
        { label: 'Lanskap', value: 'landscape' }
    ];
    const handlePaperSizeChange = (event) => {
        setSelectedPaperSize(event.target.value);
    };
    const handleOrientationChange = (event) => {
        setOrientation(event.target.value);
    };
    function handleShowPreview() {
        setShowPreview(true);
    }
    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const dropdownValues = [
        { name: 'FAKTUR', label: 'm.Faktur' },
        { name: 'GUDANG', label: 'g.Keterangan' },
        { name: 'KODE', label: 'm.Kode' }
    ];

    const onPage = (event) => {
        setLazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = async () => {
        try {
            setLoading(true);
            let requestBody = { ...lazyState };
            if (startDate && endDate) {
                requestBody.TglAwal = convertToISODate(startDate);
                requestBody.TglAkhir = convertToISODate(endDate);
            }
            const vaData = await postData(apiEndPointGet, requestBody);
            const json = vaData.data;
            setTotalRecords(json.total_data);
            setPackingStockTabel(json.data);
        } catch (error) {
            setLoading(false);
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    // Dialog Form
    const openNew = () => {
        setPackingStock([]);
        setSubmitted(false);
        router.push('/transaksistock/packing-stock/form');
    };

    // Edit Data
    const editPackingStock = async (rowData) => {
        const { Faktur } = rowData;
        try {
            let requestBody = {
                Faktur: Faktur
            };
            const vaData = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaData.data;
            console.log('json update = ', json);
            if (json.status === '0') {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Data Telah Diterima, Tidak Dapat Diedit!', life: 3000 });
                return;
            } else {
                localStorage.setItem('Faktur', Faktur);
                router.push('/transaksistock/packing-stock/form?status=update');
            }
        } catch (error) {
            console.log('Error fetching data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    // Hapus Data
    const deletePackingStock = async () => {
        let requestBody = {
            Faktur: selectedRowData.Faktur
        };
        const vaData = await postData(apiEndPointDelete, requestBody);
        let data = vaData.data;
        if (data.status == 'success') {
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Dihapus!', life: 3000 });
            setDeletePackingStockDialog(false);
            loadLazyData();
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Gagal Dihapus!', life: 3000 });
            setDeletePackingStockDialog(false);
            return;
        }
    };

    // Yang Handle Laporan
    // PDF
    const btnAdjust = () => {
        if (packingStockTabel.length == 0 || !packingStockTabel) {
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
            setLoadingPreview(true);
            const packingPDF = packingStockTabelFilt ? JSON.parse(JSON.stringify(packingStockTabelFilt)) : [];

            const marginLeftInMm = parseFloat(marginLeft);
            const marginTopInMm = parseFloat(marginTop);
            const marginRightInMm = parseFloat(marginRight);

            const doc = new jsPDF({
                orientation: dataAdjust?.orientation,
                unit: 'mm',
                format: dataAdjust?.paperSize,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!packingPDF || packingPDF.lenght === 0) {
                // If the table is empty, add a message to the PDF
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });

                // You can also add any other relevant information or styling for an empty table
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Packing Stock';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + ' sd. ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = packingPDF.map((item) => [item.Faktur, item.Tgl, item.ketGudang, item.Kode, item.Nama, item.Qty]);
            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['FAKTUR', 'TANGGAL', 'GUDANG', 'KODE', 'NAMA BARANG', 'QTY']],
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
            setLoadingExportPDF(false);
            setLoadingPreview(false);
        } catch (error) {
            console.log(error);
            setLoadingPreview(false);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(packingStockTabelFilt, 'laporan-packing-stock.xlsx');
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="warning" rounded className="mr-2" onClick={() => editPackingStock(rowData)} />
                <Button icon="pi pi-trash" severity="danger" rounded onClick={() => handleDelete(rowData)} />
            </>
        );
    };

    // Action
    const handleDelete = (rowData) => {
        setSelectedRowData(rowData);
        setDeletePackingStockDialog(true);
    };

    // Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew}>
                        {' '}
                    </Button>
                </div>
            </React.Fragment>
        );
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

    useEffect(() => {
        setPackingStockTabelFilt(packingStockTabel);
    }, [packingStockTabel, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = packingStockTabel.filter((d) => (x ? x.test(d.Faktur) || x.test(d.Kode) || x.test(d.Nama) || x.test(d.ketGudang) || x.test(d.Qty) : []));
            setSearch(searchVal);
        }

        setPackingStockTabelFilt(filtered);
    };

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} dateFormat="dd-mm-yy" showIcon />
                    <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} dateFormat="dd-mm-yy" showIcon />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} style={{ marginLeft: '5px' }} />
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
        if (defaultOption != null && defaultOption.label != null) {
            _lazyState['filters'][defaultOption.label] = value;
        }
        console.log(_lazyState);
        onPage(_lazyState);
    };

    const deletePackingStockDialogFooter = (rowData) => (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={() => setDeletePackingStockDialog(false)} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deletePackingStock} />
        </>
    );

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
                <h4>Packing Stock</h4>
                <hr />
                <Toast ref={toast}></Toast>
                <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                <DataTable
                    value={packingStockTabelFilt}
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
                    <Column field="Faktur" header="FAKTUR"></Column>
                    <Column field="Tgl" body={(rowData) => (rowData.Tgl ? `${formatDateTable(rowData.Tgl)}` : '')} header="TANGGAL"></Column>
                    <Column field="ketGudang" header="GUDANG"></Column>
                    <Column field="Kode" header="KODE"></Column>
                    <Column field="Nama" header="NAMA BARANG"></Column>
                    <Column field="Qty" header="QTY" bodyStyle={{ textAlign: 'right' }}></Column>
                    <Column header="ACTION" body={actionBodyTemplate} bodyStyle={{ textAlign: 'center' }}></Column>
                </DataTable>
                <Toolbar className="mb-4" left={preview}></Toolbar>
            </div>
            {/* Dialog Delete Packing Stock */}
            <Dialog visible={deletePackingStockDialog} header="Confirm" modal footer={deletePackingStockDialogFooter} onHide={() => setDeletePackingStockDialog(false)}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {packingStock && <span>Yakin ingin Menghapus Data ini?</span>}
                </div>
            </Dialog>
            {/* Dialog JSPDF */}
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}

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
 * Created on Tue Apr 30 2024 - 09:27:14
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from 'primereact/toast';
import { getSessionServerSide } from '../../../utilities/servertool';
import React, { useEffect, useRef, useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { DataTable } from 'primereact/datatable';
import { startOfMonth } from 'date-fns';
import { convertToISODate, formatAndSetDate, formatDate, formatDatePdf, formatDateTable, getEmail, getUserName } from '../../../component/GeneralFunction/GeneralFunction';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Column } from 'jspdf-autotable';
import { useRouter } from 'next/router';
import { Panel } from 'primereact/panel';
import postData from '../../../lib/Axios';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../component/PDFViewer';
import { Footer, HeaderLaporan, addPageInfo } from '../../../component/exportPDF/exportPDF';
import jsPDF from 'jspdf';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function MutasiGudang() {
    const apiEndPointGet = '/api/mutasi-stock/data';
    const apiEndPointGetDataEditTerima = '/api/terima-stock/get-data-edit';
    const apiEndPointGetDataEditKirim = '/api/kirim-stock/get-data-edit';
    const apiEndPointDeleteTerima = '/api/terima-stock/delete';
    const apiEndPointDeleteKirim = '/api/kirim-stock/delete';

    const toast = useRef(null);
    const router = useRouter();
    const [mutasiGudang, setMutasiGudang] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [jenisMutasiGudangDialog, setJenisMutasiGudangDialog] = useState(false);
    const [mutasiGudangTabel, setMutasiGudangTabel] = useState([]);
    const [mutasiGudangTabelFilt, setMutasiGudangTabelFilt] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [defaultOption, setDropdownValue] = useState(null);
    const [jenisMutasiOption, setJenisMutasiOption] = useState('');
    const [isJenisMutasi, setIsJenisMutasi] = useState(false); // false masuk ke kirim, kalau true masuk ke terima
    const [deleteMutasiStockDialog, setDeleteMutasiStockDialog] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [adjustDialog, setAdjustDialog] = useState(false);
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const [search, setSearch] = useState('');
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

    const jenisMutasiValues = [
        { label: 'Semua', value: 'Semua' },
        { label: 'Kirim', value: 'Kirim' },
        { label: 'Terima', value: 'Terima' }
    ];

    const dropdownValues = [{ name: 'Faktur', label: 'Faktur' }];

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };

    useEffect(() => {
        setJenisMutasiOption('Semua');
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = async () => {
        try {
            setLoading(true);
            let requestBody = { ...lazyState };
            if (startDate && endDate) {
                requestBody.TglAwal = convertToISODate(startDate);
                requestBody.TglAkhir = convertToISODate(endDate);
                requestBody.JenisMutasi = jenisMutasiOption;
            }
            if (jenisMutasiOption === 'Terima') {
                setIsJenisMutasi(true);
            } else {
                setIsJenisMutasi(false);
            }
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setMutasiGudangTabel(json.data);
            setTotalRecords(json.total_data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };

    // Yang Handle Inputan
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _mutasiStock = { ...mutasiGudang };
        _mutasiStock[`${name}`] = val;
        setMutasiGudang(_mutasiStock);
        if (name === 'jenisMutasi') {
            setJenisMutasiOption(val);
        }
    };

    // Open Form
    const openNew = () => {
        setMutasiGudang([]);
        setSubmitted(false);
        setJenisMutasiGudangDialog(true);
    };

    const handleKirimStock = () => {
        setMutasiGudang([]);
        setSubmitted(false);
        router.push('/transaksistock/mutasi-gudang/form');
    };

    const handleTerimaStock = () => {
        setMutasiGudang([]);
        setSubmitted(false);
        router.push('/transaksistock/mutasi-gudang/terima-stock/form');
    };

    // Yang Handle Edit
    const editMutasi = async (rowData) => {
        const { Faktur } = rowData;
        try {
            let endPoint;
            if (Faktur.startsWith('BK')) {
                endPoint = apiEndPointGetDataEditKirim;
            } else if (Faktur.startsWith('BA')) {
                endPoint = apiEndPointGetDataEditTerima;
            } else {
                // Handle cases where Faktur does not start with BK or BA
                throw new Error('Invalid Faktur prefix');
            }
            let requestBody = {
                Faktur: Faktur
            };
            const vaData = await postData(endPoint, requestBody);
            const json = vaData.data;
            if (json.Status === '1') {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Data Telah Diterima, Tidak Dapat Diedit!', life: 3000 });
                return;
            } else {
                localStorage.setItem('Faktur', Faktur);
                if (Faktur.startsWith('BA')) {
                    router.push('/transaksistock/mutasi-gudang/terima-stock/form?status=update');
                } else {
                    router.push('/transaksistock/mutasi-gudang/form?status=update');
                }
            }
        } catch (error) {
            console.log('Error fetching data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const deleteMutasiGudang = async () => {
        try {
            let requestBody = {
                Faktur: selectedRowData.Faktur
            };

            // Menentukan endpoint berdasarkan pola faktur
            let endPoint;
            if (requestBody.Faktur.startsWith('BA')) {
                endPoint = apiEndPointDeleteTerima;
            } else if (requestBody.Faktur.startsWith('BK')) {
                endPoint = apiEndPointDeleteKirim;
            } else {
                console.error('Faktur tidak valid:', requestBody.Faktur);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Faktur tidak valid!', life: 3000 });
                return;
            }

            // Mengirim permintaan penghapusan
            const vaData = await postData(endPoint, requestBody);
            let data = vaData.data;

            // Menangani respons dari server
            if (data.status === 'success') {
                toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Berhasil Dihapus!', life: 3000 });
                setDeleteMutasiStockDialog(false);
                loadLazyData();
            } else if (data.status === '0') {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Gagal dihapus, Barang Sudah Diterima', life: 3000 });
                setDeleteMutasiStockDialog(false);
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Gagal Dihapus!', life: 3000 });
                setDeleteMutasiStockDialog(false);
            }
        } catch (error) {
            console.error(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Terjadi kesalahan saat menghapus!', life: 3000 });
            setDeleteMutasiStockDialog(false);
        }
    };

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
        setMutasiGudangTabelFilt(mutasiGudangTabel);
    }, [mutasiGudangTabel, lazyState]);

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = mutasiGudangTabel.filter((d) => (x ? x.test(d.Faktur) || x.test(d.KetGudangKirim) || x.test(d.KetGudangTerima) || x.test(d.FullName) : []));
            setSearch(searchVal);
        }

        setMutasiGudangTabelFilt(filtered);
    };

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown id="JenisMutasi" value={jenisMutasiOption} onChange={(e) => onInputChange(e, 'jenisMutasi')} options={jenisMutasiValues} optionLabel="label" optionValue="value" placeholder="Jenis Mutasi" />
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} placeholder="Start Date" dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} placeholder="End Date" dateFormat="dd-mm-yy" style={{ width: '100px' }} />
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

    // Yang Handle Toolbar
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2" style={{ display: 'flex', alignItems: 'center' }}>
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew}></Button>
                </div>
            </React.Fragment>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <div>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editMutasi(rowData)}></Button>
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteMutasi(rowData)}></Button>
            </div>
        );
    };

    const confirmDeleteMutasi = (rowData) => {
        setSelectedRowData(rowData);
        setDeleteMutasiStockDialog(true);
    };

    const deleteMutasiStockDialogFooter = (rowData) => (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={() => setDeleteMutasiStockDialog(false)} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteMutasiGudang} />
        </>
    );

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
            const mutasiGudangPDF = mutasiGudangTabelFilt ? JSON.parse(JSON.stringify(mutasiGudangTabelFilt)) : [];

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

            if (!mutasiGudangPDF || mutasiGudangPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Mutasi Gudang';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = mutasiGudangPDF.map((item) => [item.Faktur, formatDatePdf(item.Tgl), item.KetGudangKirim, item.KetGudangTerima, item.UserName]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['FAKTUR', 'TANGGAL', 'GUDANG KIRIM', 'GUDANG TERIMA', 'USERNAME']],
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
                    1: { halign: 'center' }
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
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(mutasiGudangTabelFilt, 'laporan-mutasi-antar-gudang.xlsx');
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
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Menu Mutasi Antar Gudang</h4>
                    <hr />
                    <Toast ref={toast}></Toast>
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
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
                    >
                        <Column field="Faktur" header="FAKTUR"></Column>
                        <Column field="Tgl" header="TANGGAL" body={(rowData) => (rowData.Tgl ? formatDateTable(rowData.Tgl) : '-')}></Column>
                        <Column field="KetGudangKirim" header="GUDANG KIRIM"></Column>
                        <Column field="KetGudangTerima" header="GUDANG TERIMA"></Column>
                        <Column field="UserName" header="USERNAME"></Column>
                        <Column header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={preview}></Toolbar>
                </div>
            </div>
            {/* Dialog Jenis Mutasi Gudang */}
            <Dialog visible={jenisMutasiGudangDialog} header="Pilih Jenis Mutasi antar Gudang" modal onHide={() => setJenisMutasiGudangDialog(false)}>
                <div className="flex align-items-center justify-content-center">
                    <Button label="Kirim Stock ke Gudang Lain" icon="pi pi-external-link" className="p-button-success ml-2 mr-2" onClick={handleKirimStock}></Button>
                    <Button label="Terima Stock dari Gudang Lain" icon="pi pi-box" className="p-button-success ml-2 mr-2" onClick={handleTerimaStock}></Button>
                </div>
            </Dialog>
            {/* Dialog Delete Mutasi Stock */}
            <Dialog visible={deleteMutasiStockDialog} header="Confirm" modal footer={deleteMutasiStockDialogFooter} onHide={() => setDeleteMutasiStockDialog(false)}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    {mutasiGudang && <span>Yakin ingin Menghapus Data ini?</span>}
                </div>
            </Dialog>
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}

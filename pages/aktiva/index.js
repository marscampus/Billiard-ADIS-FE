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
 * Created on Tue Mar 26 2024 - 02:17:29
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { formatDateTable, getEmail, getUserName } from '../../component/GeneralFunction/GeneralFunction';
import { FilterMatchMode } from 'primereact/api';
import { useRouter } from 'next/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import postData from '../../lib/Axios';
import { exportToXLSX } from '../../component/exportXLSX/exportXLSX';
import { getSessionServerSide } from '../../utilities/servertool';
import PDFViewer from '../../component/PDFViewer';
import AdjustPrintMarginLaporan from '../component/adjustPrintMarginLaporan';
import { addPageInfo, Footer, HeaderLaporan } from '../../component/exportPDF/exportPDF';

export const getServerSideProps = async (context) => {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }

    return {
        props: {}
    };
};

export default function MasterTemplate1() {
    //read
    const apiEndPointGet = '/api/aktiva/get';
    //delete
    const apiEndPointDelete = '/api/aktiva/delete';

    let emptyaktiva = {
        Kode: null,
        Keterangan: null,
        RekeningDebet: null,
        RekeningKredit: null
    };
    let emptykas = {
        ID: null,
        Faktur: null,
        Tgl: null,
        RekeningJumlah: null,
        RekeningKredit: null,
        Jumlah: null,
        Kredit: null,
        Keterangan: null
    };
    const toast = useRef(null);
    const dt = useRef(null);
    const [deleteAktivaDialog, setDeleteAktivaDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    // const [PenerimaanKasDialog, setPenerimaanKasDialog] = useState(false);
    const [aktiva, setAktiva] = useState(emptyaktiva);
    const [defaultOption, setDropdownValue] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [aktivaTabel, setAktivaTabel] = useState(null);
    const [aktivaTabelFilt, setAktivaTabelFilt] = useState(null);
    const [statusAction, setStatusAction] = useState(null);
    const [search, setSearch] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    // --------------------------------------------------------------------------------------------------- Export
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const dropdownValues = [
        { name: 'Kode', label: 'Kode' },
        { name: 'Nama', label: 'Nama' },
        { name: 'TglPerolehan', label: 'TglPerolehan' },
        { name: 'TglPenyusutan', label: 'TglPenyusutan' }
    ];

    // filter helper rekening
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const [globalFilterValue, setGlobalFilterValue] = useState('');

    useEffect(() => {
        setAktivaTabelFilt(aktivaTabel);
    }, [aktivaTabel, lazyState]);

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const router = useRouter();
    const openNew = () => {
        setAktiva(emptyaktiva);
        setSubmitted(false);
        // setaktivaDialog(true);
        router.push('/aktiva/form');
        setStatusAction('store');
    };

    const hideDeleteAktivaDialog = () => {
        setDeleteAktivaDialog(false);
    };

    const exportCSV = () => {
        dt.current.exportCSV();
    };

    // Fungsi untuk menampilkan popup iframe
    function handleShowPreview() {
        setShowPreview(true);
    }
    // Fungsi untuk menampilkan preview PDF

    const editAktiva = (aktiva) => {
        // setAktiva({ ...aktiva });
        // setStatusAction('update');
        localStorage.setItem('KODE_AKTIVA', aktiva.Kode);
        router.push(`/aktiva/form?status=update`);
    };

    const confirmDeleteAktiva = (aktiva) => {
        setAktiva(aktiva);
        setDeleteAktivaDialog(true);
    };

    const deleteAktiva = async () => {
        try {
            const vaDelete = await postData(apiEndPointDelete, { Kode: aktiva.Kode });
            let data = vaDelete.data;
            toast.current.show({
                severity: 'success',
                summary: data.message,
                detail: 'data berhasil dihapus',
                life: 3000
            });
            setDeleteAktivaDialog(false);
            loadLazyData();
        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'data gagal dihapus',
                life: 3000
            });
        }
    };

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Add" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                </div>
            </React.Fragment>
        );
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (aktivaTabel.length == 0 || !aktivaTabel) {
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
            const rekeningPDF = aktivaTabelFilt ? JSON.parse(JSON.stringify(aktivaTabelFilt)) : [];

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust.orientation,
                unit: 'mm',
                format: dataAdjust.paperSize,
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

            const judulLaporan = 'Master Golongan Aktiva';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = rekeningPDF.map((item) => [
                item.Kode,
                item.Nama,
                formatDateTable(item.TglPerolehan),
                formatDateTable(item.TglPenyusutan),
                item.Unit,
                item.Golongan,
                item.JenisPenyusutan == 0 ? 'Saldo Menurun' : 'Garis Lurus',
                item.Lama,
                item.TarifPenyusutan ? parseFloat(item.TarifPenyusutan).toLocaleString() : 0,
                item.HargaPerolehan ? parseInt(item.HargaPerolehan).toLocaleString() : 0,
                item.Residu ? parseInt(item.Residu).toLocaleString() : 0
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'NAMA', 'TGL PEROLEHAN', 'TGL PENYUSUTAN', 'JUMLAH UNIT', 'GOLONGAN AKTIVA', 'JENIS PENYUSUTAN', 'LAMA PENYUSUTAN', 'TARIF PENYUSUTAN', 'HARGA PEROLEHAN', 'NILAI RESIDU']],
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
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                    7: { halign: 'center' },
                    8: { halign: 'center' },
                    9: { halign: 'right' },
                    10: { halign: 'right' }
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
        exportToXLSX(aktivaTabel, 'master-golongan-aktiva.xlsx');
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

    const deleteAktivaDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteAktivaDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteAktiva} />
        </>
    );

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

    const penarikantunaiBodyTemplate = (rowData) => {
        return <span> {rowData.PenarikanTunai == 'Y' ? 'Ya' : 'Tidak'} </span>;
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editAktiva(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteAktiva(rowData)} />
            </>
        );
    };

    //##################################################################################################################################################################

    const showSuccess = (detail) => {
        toast.current.show({ severity: 'success', summary: 'Success Message', detail: detail, life: 3000 });
    };

    const showError = (detail) => {
        toast.current.show({ severity: 'error', summary: 'Error Message', detail: detail, life: 3000 });
    };

    //##################################################################################################################################################################

    const loadLazyData = async () => {
        setLoading(true);
        try {
            const vaTable = await postData(apiEndPointGet, lazyState);
            const json = vaTable.data;
            setTotalRecords(json.total);
            setAktivaTabel(json.data);
            setLoading(false);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(e.message);
            setLoading(false);
        }
    };

    const [timer, setTimer] = useState(null);

    const inputChanged = (e) => {
        // setInputValue(e.target.value)
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            _lazyState['filters'] = {};
            console.log(_lazyState);
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    {/* <Calendar name="startDate" value={startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                     <Calendar name="endDate" value={endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                     <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={refresh}/> */}
                </div>
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => filterPlugins('search', e.target.value)} placeholder="Search..." value={search} />
                </span>
            </div>
        </div>
    );

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = aktivaTabel.filter((d) => (x ? x.test(d.Kode) || x.test(d.Nama) || x.test(d.TglPerolehan) || x.test(d.TglPenyusutan) || x.test(d.Unit) || x.test(d.Golongan) || x.test(d.Unit) || x.test(d.Golongan) : []));
            setSearch(searchVal);
        }

        setAktivaTabelFilt(filtered);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                {/* <BreadCrumb home={breadcrumbHome} model={breadcrumbItems} style={{ background: 'none', border: 'none' }} /> */}
                <div className="card">
                    <h4>Aktiva</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" start={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={aktivaTabelFilt}
                        filters={lazyState.filters}
                        header={header}
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
                        {/* <Column field="NO" header="#" body={(rowData) => coa.indexOf(rowData) + 1}></Column> */}
                        <Column field="Kode" header="KODE"></Column>
                        <Column field="Nama" header="NAMA"></Column>
                        <Column field="TglPerolehan" header="TGL PEROLEHAN" body={(rowData) => formatDateTable(rowData.TglPerolehan)}></Column>
                        <Column field="TglPenyusutan" header="TGL MULAI PENYUSUTAN" body={(rowData) => formatDateTable(rowData.TglPenyusutan)}></Column>
                        <Column field="Unit" header="JUMLAH UNIT"></Column>
                        <Column field="Golongan" header="GOL. AKTIVA"></Column>
                        <Column field="JenisPenyusutan" body={(data) => (data.JenisPenyusutan == 0 ? 'Saldo Menurun' : 'Garis Lurus')} header="JENIS PENYUSUTAN"></Column>
                        <Column field="Lama" header="LAMA PENYUSUTAN"></Column>
                        <Column
                            field="TarifPenyusutan"
                            body={(rowData) => {
                                const value = rowData.TarifPenyusutan ? parseFloat(rowData.TarifPenyusutan).toLocaleString() : '';
                                return value;
                            }}
                            header="TARIF PENYUSUTAN"
                        ></Column>
                        <Column
                            field="HargaPerolehan"
                            body={(rowData) => {
                                const value = rowData.HargaPerolehan ? parseInt(rowData.HargaPerolehan).toLocaleString() : '';
                                return value;
                            }}
                            header="HARGA PEROLEHAN"
                        ></Column>
                        <Column
                            field="Residu"
                            body={(rowData) => {
                                const value = rowData.Residu ? parseInt(rowData.Residu).toLocaleString() : '';
                                return value;
                            }}
                            header="NILAI RESIDU"
                        ></Column>
                        <Column header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={preview}></Toolbar>
                    <Dialog visible={deleteAktivaDialog} header="Confirm" modal footer={deleteAktivaDialogFooter} onHide={hideDeleteAktivaDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {aktiva && (
                                <span>
                                    Yakin ingin menghapus <strong>{aktiva.Kode} ?</strong>
                                </span>
                            )}
                        </div>
                    </Dialog>
                </div>
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

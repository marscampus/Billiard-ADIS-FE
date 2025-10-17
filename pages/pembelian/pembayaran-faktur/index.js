/**
     * Nama Program: GODONG POS - Pembayaran - Penerimaan Barang
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 1 Maret 2024 (re-coding)
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Menu Penerimaan Barang
*/
import { startOfMonth } from 'date-fns';
import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { convertToISODate, formatDate, getEmail, getUserName, showError } from '../../../component/GeneralFunction/GeneralFunction';

import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../component/PDFViewer';
import jsPDF from 'jspdf';
import { addPageInfo, Footer, HeaderLaporan } from '../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';

export async function getServerSideProps(context) {
    //cari session
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    //   const sessionData = await getSessionServerSide(context, '/pembayaran/penerimaan-barang');

    //jika session  tidak sesuai dengan url yang dicari maka redirect
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function MasterData() {
    //hubungan dengan path api disini
    const apiEndPointGet = '/api/pembayaran_faktur/get';
    const apiEndPointDelete = '/api/pembayaran_faktur/delete';

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pembayaran, setPembayaran] = useState([]);
    const [pembayaranTabel, setPembayaranTabel] = useState(null);
    const [pembayaranTabelFilt, setPembayaranTabelFilt] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [deletePembayaranDialog, setDeletePembayaranDialog] = useState(false);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [search, setSearch] = useState('');
    const [adjustDialog, setAdjustDialog] = useState(false);
    // PDF
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
    const op = useRef(null);

    const onPage1 = (event) => {
        // Set lazyState from event
        setlazyState(event);

        // Ensure filters['s.Nama'] remains as a string "SRZNARA"
        if (event.filters && event.filters['s.Nama']) {
            const filterValue = event.filters['s.Nama'];
            if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                // Convert object to string if necessary
                const stringValue = Object.values(filterValue).join('');
                event.filters['s.Nama'] = stringValue;
            }
        } else if (event.filters && event.filters['kh.FKT']) {
            const filterValue = event.filters['kh.FKT'];
            if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                // Convert object to string if necessary
                const stringValue = Object.values(filterValue).join('');
                event.filters['kh.FKT'] = stringValue;
            }
        } else if (event.filters && event.filters['kh.FAKTUR']) {
            const filterValue = event.filters['kh.FAKTUR'];
            if (typeof filterValue === 'object' && !Array.isArray(filterValue)) {
                // Convert object to string if necessary
                const stringValue = Object.values(filterValue).join('');
                event.filters['kh.FAKTUR'] = stringValue;
            }
        }

        // Log lazyState for debugging purposes
        // Set first and rows for pagination
        setFirst(event.first);
        setRows(event.rows);

        // Load data with updated lazyState
        loadLazyData();
    };

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
        setPembayaranTabelFilt(pembayaranTabel);
    }, [pembayaranTabel, lazyState]);

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const loadLazyData = async () => {
        try {
            setLoading(true);
            let requestBody = { ...lazyState };

            if (startDate && endDate) {
                requestBody.TglAwal = convertToISODate(startDate);
                requestBody.TglAkhir = convertToISODate(endDate);
            }
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setPembayaranTabel(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDeletePembayaranDialog = () => {
        setDeletePembayaranDialog(false);
    };

    // ----------------------------------------------------------------------------------------------------------------- Handle Change
    const handleStartDateChange = (e) => {
        setStartDate(e.value);
    };
    const handleEndDateChange = (e) => {
        setEndDate(e.value);
    };
    const confirmDeletePembayaran = (pembayaran) => {
        setPembayaran(pembayaran);
        setDeletePembayaranDialog(true);
    };
    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const router = useRouter();
    const openNew = () => {
        setPembayaran([]);
        setSubmitted(false);
        router.push('/pembelian/pembayaran-faktur/form');
    };
    // -------------------------------------------------------------------------------------------------------------------- Func
    const refresh = () => {
        setLoading(true);
        if (startDate && endDate) {
            const updatedLazyState = {
                ...lazyState,
                START_DATE: startDate,
                END_DATE: endDate
            };
            loadLazyData(updatedLazyState);
        } else {
            loadLazyData(lazyState);
        }
        setLoading(false);
    };

    const deletePembayaran = async () => {
        let requestBody = {
            FKT: pembayaran.FKT
        };
        try {
            const vaDelete = await postData(apiEndPointDelete, requestBody);
            let data = vaDelete.data;
            
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Dihapus', life: 3000 });
            setDeletePembayaranDialog(false);
            refreshTabel();

            // if (data.code === '200') {
            // } else {
            //     toast.current.show({ severity: 'error', summary: data.message, detail: 'Kesalahan Proses', life: 3000 });
            // }
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
        // if (data.status === 'success') {
        //     toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Data Berhasil Dihapus', life: 3000 });
        //   //   setPembayaran([]);
        //     setDeletePembayaranDialog(false);
        //     refreshTabel();
        // } else {
        //     toast.current.show({ severity: 'error', summary: 'Error', detail: 'Data Gagal Dihapus!', life: 3000 });
        // }
    };
    // ---------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2" style={{ display: 'flex', alignItems: 'center' }}>
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                </div>
            </React.Fragment>
        );
    };
    const deletePembayaranDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeletePembayaranDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deletePembayaran} />
        </>
    );
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeletePembayaran(rowData)} />
            </>
        );
    };
    // ----------------------------------------------------------------------------------------------------------------------------------------------------- search
    const dropdownValues = [
        { name: 'FAKTUR', label: 'kh.FAKTUR' },
        { name: 'FAKTURASLI', label: 'kh.FKT' },
        { name: 'SUPPLIER', label: 's.Nama' }
    ];

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={refresh} />
                </div>
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih kolom" /> */}
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
            filtered = pembayaranTabel.filter((d) => (x ? x.test(d.FAKTUR) || x.test(d.FKT) || x.test(d.TGL) || x.test(d.JTHTMP) || x.test(d.SUPPLIER) || x.test(d.GUDANG) || x.test(d.KETERANGAN) || x.test(d.KREDIT) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = pembayaranTabel;
            } else {
                filtered = pembayaranTabel.filter((d) => (x ? x.test(d.FAKTUR) : []));
            }
        }

        setPembayaranTabelFilt(filtered);
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (pembayaranTabelFilt.length == 0 || !pembayaranTabelFilt) {
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
            const returPembelianTabelPDF = pembayaranTabelFilt ? JSON.parse(JSON.stringify(pembayaranTabelFilt)) : [];

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

            if (!returPembelianTabelPDF || returPembelianTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Pembayaran Faktur';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = returPembelianTabelPDF.map((item) => [item.FAKTUR, item.FKT, item.KETERANGAN, formatDate(item.TGL), formatDate(item.JTHTMP), item.SUPPLIER, item.GUDANG, parseInt(item.KREDIT).toLocaleString()]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['FAKTUR PEMBELIAN', 'FAKTUR', 'KETERANGAN', 'TANGGAL', 'JTHTMP', 'SUPPLIER', 'GUDANG', 'PEMBAYARAN']],
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
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                    7: { halign: 'right' }
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
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(pembayaranTabelFilt, 'laporan-pembayaran-faktur.xlsx');
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
                    <h4>Menu Pembayaran Faktur</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                    <DataTable
                        value={pembayaranTabelFilt}
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
                        <Column headerStyle={{ textAlign: 'center' }} field="FAKTUR" header="FAKTUR" bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="FKT" header="FKT" bodyStyle={{ textAlign: 'center' }}></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} field="KETERANGAN" header="KETERANGAN" ></Column> */}
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TANGGAL" body={(rowData) => formatDate(rowData.TGL)} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="JTHTMP" header="JTH TEMPO" body={(rowData) => formatDate(rowData.JTHTMP)} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="SUPPLIER" header="SUPPLIER" bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="GUDANG" header="GUDANG" bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} field="DEBET" header="DEBET" body={(rowData) => rowData.DEBET ? `${rowData.DEBET.toLocaleString()}` : '0'} bodyStyle={{ textAlign: "right" }}></Column> */}
                        <Column headerStyle={{ textAlign: 'center' }} field="KREDIT" header="PEMBAYARAN" body={(rowData) => (rowData.KREDIT ? `${rowData.KREDIT.toLocaleString()}` : '0')} bodyStyle={{ textAlign: 'right' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate} bodyStyle={{ textAlign: 'center' }}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={preview}></Toolbar>
                    {/* Dialog Delete Pembayaran */}
                    <Dialog visible={deletePembayaranDialog} header="Confirm" modal footer={deletePembayaranDialogFooter} onHide={hideDeletePembayaranDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {pembayaran && (
                                <span>
                                    are you sure you want to delete <strong>{pembayaran.FKT}</strong>
                                </span>
                            )}
                        </div>
                    </Dialog>
                    <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
                    <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                        <div className="p-dialog-content">
                            <PDFViewer pdfUrl={pdfUrl} />
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}

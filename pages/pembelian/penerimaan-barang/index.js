/**
     * Nama Program: GODONG POS - Pembelian - Penerimaan Barang
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
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { convertToISODate, formatAndSetDate, formatDate, getEmail, getUserName, showError } from '../../../component/GeneralFunction/GeneralFunction';

import jsPDF from 'jspdf';
import { Footer, HeaderLaporan, addPageInfo } from '../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import PDFViewer from '../../../component/PDFViewer';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';

export async function getServerSideProps(context) {
    //cari session
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    //   const sessionData = await getSessionServerSide(context, '/pembelian/penerimaan-barang');

    //jika session  tidak sesuai dengan url yang dicari maka redirect
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function MasterData() {
    const apiEndPointGet = '/api/pembelian/get';
    const apiEndPointDelete = '/api/pembelian/delete';
    const apiEndPointGetDataEdit = '/api/pembelian/getdata_edit';

    let emptypembelian = {
        FAKTUR: null
    };

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedCoa, setSelectedCoa] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [pembelian, setPembelian] = useState([]);
    const [pembelianTabel, setPembelianTabel] = useState([]);
    const [pembelianTabelFilt, setPembelianTabelFilt] = useState([]);
    const [dataDialog, setPembelianDialog] = useState(false);
    const [dates, setDates] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const [statusAction, setStatusAction] = useState(null);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [deletePembelianDialog, setDeletePembelianDialog] = useState(false);
    const [jenisPembelianDialog, setJenisPembelianDialog] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [search, setSearch] = useState('');

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [{ field: 'KODE', header: 'KODE' }];
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const op = useRef(null);

    // const onPage = (event) => {
    //     setlazyState(event);
    //     setFirst(event.first); // Mengatur halaman saat halaman berubah
    //     setRows(event.rows); // Mengatur jumlah baris per halaman
    // };

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
        setPembelianTabelFilt(pembelianTabel);
    }, [pembelianTabel, lazyState]);

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
            setPembelianTabel(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setPembelianDialog(false);
    };
    const hideDeletePembelianDialog = () => {
        setDeletePembelianDialog(false);
    };

    // ----------------------------------------------------------------------------------------------------------------- Handle Change
    const confirmDeletePembelian = (pembelian) => {
        setPembelian(pembelian);
        setDeletePembelianDialog(true);
    };
    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const router = useRouter();
    const openNew = () => {
        setPembelian([]);
        setSubmitted(false);
        // router.push('/pembelian/penerimaan-barang/form');
        setJenisPembelianDialog(true);
    };
    const handleDenganFakturPO = () => {
        setPembelian([]);
        setSubmitted(false);
        router.push('/pembelian/penerimaan-barang/form');
    };
    const handleTanpaFakturPO = () => {
        setPembelian([]);
        setSubmitted(false);
        router.push('/pembelian/penerimaan-barang/tanpa-po/form');
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
    const saveData = async (e) => {
        e.preventDefault();
    };

    const editPembelian = async (rowData) => {
        const { FAKTUR } = rowData;
        try {
            let requestBody = {
                faktur: FAKTUR
            };
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;

            if (json.status === '0') {
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Data Telah Diretur, Tidak Dapat Diedit!', life: 3000 });
                return;
            } //else {
            localStorage.setItem('FAKTUR', FAKTUR); // Simpan FAKTUR di localStorage
            if (rowData.PO === null) {
                router.push('/pembelian/penerimaan-barang/tanpa-po/form?status=update');
            } else {
                router.push('/pembelian/penerimaan-barang/form?status=update');
            }
            // }
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.log('Error fetching data:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const deletePembelian = async () => {
        let requestBody = {
            FAKTUR: pembelian.FAKTUR
        };
        try {
            const vaDelete = await postData(apiEndPointDelete, requestBody);
            let data = vaDelete.data;
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Dihapus', life: 3000 });
            setDeletePembelianDialog(false);
            loadLazyData();
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
        // if (data.code === '200') {
        // } else if (data.status === '0') {
        //     toast.current.show({ severity: 'error', summary: 'Error', detail: 'Data Telah Diretur, Tidak Dapat Dihapus!', life: 3000 });
        // } else {
        //     toast.current.show({ severity: 'error', summary: data.message, detail: 'Kesalahan Proses', life: 3000 });
        // }

        // if (json.status === 'success') {
        //     toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Data Berhasil Dihapus', life: 3000 });
        //   //   setPembelian([]);
        //     setDeletePembelianDialog(false);
        //     loadLazyData();
        // } else if (json.status === '0') {
        //     toast.current.show({ severity: 'error', summary: 'Error', detail: 'Data Telah Diretur, Tidak Dapat Dihapus!', life: 3000 });

        // } else {
        //     toast.current.show({ severity: 'error', summary: 'Error', detail: 'Data Gagal Dihapus!', life: 3000 });
        // }
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (pembelianTabelFilt.length == 0 || !pembelianTabelFilt) {
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
            const pembelianPDF = pembelianTabelFilt ? JSON.parse(JSON.stringify(pembelianTabelFilt)) : [];

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

            if (!pembelianPDF || pembelianPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Pembelian Penerimaan Barang';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = pembelianPDF.map((item) => [item.FAKTUR, item.PO, item.KETERANGAN, formatDate(item.TGL), formatDate(item.JTHTMP), item.NAMA, parseInt(item.TOTAL).toLocaleString()]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['FAKTUR', 'FAKTUR PO', 'KETERANGAN', 'TANGGAL', 'JTH TMP', 'SUPPLIER', 'TOTAL HARGA']],
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
                    6: { halign: 'right' }
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
        exportToXLSX(pembelianTabelFilt, 'laporan-pembelian.xlsx');
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
    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2" style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="field">
                        {/* <label>Range Tanggal</label> */}
                        <div className="p-inputgroup">
                            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" placeholder="Range Tanggal" readOnlyInput />
                            <Button label="Refresh" icon="pi pi-refresh" className="p-button-primary mr-2" />
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    };
    const dataDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveData} />
        </>
    );

    const deletePembelianDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeletePembelianDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deletePembelian} />
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

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editPembelian(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeletePembelian(rowData)} />
            </>
        );
    };
    // ----------------------------------------------------------------------------------------------------------------------------------------------------- search
    const dropdownValues = [
        { name: 'FAKTUR', label: 'tp.FAKTUR' },
        { name: 'FAKTUR PO', label: 'tp.PO' },
        { name: 'SUPPLIER', label: 's.NAMA' }
    ];

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

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} placeholder="Start Date" dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} placeholder="End Date" dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} />
                </div>
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Filter" /> */}
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
            filtered = pembelianTabel.filter((d) => (x ? x.test(d.FAKTUR) || x.test(d.PO) || x.test(d.KETERANGAN) || x.test(d.TGL) || x.test(d.JTHTMP) || x.test(d.NAMA) || x.test(d.TOTAL) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = pembelianTabel;
            } else {
                filtered = pembelianTabel.filter((d) => (x ? x.test(d.FAKTUR) : []));
            }
        }

        setPembelianTabelFilt(filtered);
    };

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyState['filters'][defaultOption.label] = value;
        }
        onPage(_lazyState);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Menu Pembelian/Penerimaan Barang</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                    <DataTable
                        value={pembelianTabelFilt}
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
                        <Column headerStyle={{ textAlign: 'center' }} field="PO" header="FAKTUR PO" bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TANGGAL" body={(rowData) => formatDate(rowData.TGL)} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="JTHTMP" header="JTH TEMPO" body={(rowData) => formatDate(rowData.JTHTMP)} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="SUPPLIER"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TOTAL" header="TOTAL HARGA" body={(rowData) => (rowData.TOTAL ? `${rowData.TOTAL.toLocaleString()}` : '0')} bodyStyle={{ textAlign: 'right' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate} bodyStyle={{ textAlign: 'center' }}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={preview}></Toolbar>

                    {/* Dialog Data  */}
                    <Dialog visible={dataDialog} style={{ width: '75%' }} header="Tambah Data " modal className="p-fluid" footer={dataDialogFooter} onHide={hideDialog}>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="kode">Kode</label>
                                <div className="p-inputgroup">
                                    <InputText disabled id="kode" value={pembelian.KODE} onChange={(e) => onInputChange(e, 'KODE')} className={classNames({ 'p-invalid': submitted && !pembelian.KODE })} />
                                </div>
                                {submitted && !pembelian.KODE && <small className="p-invalid">Kode is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="keterangan">Keterangan</label>
                                <InputText id="keterangan" value={pembelian.Keterangan} onChange={(e) => onInputChange(e, 'Keterangan')} required autoFocus className={classNames({ 'p-invalid': submitted && !pembelian.Keterangan })} />
                                {submitted && !pembelian.KETERANGAN && <small className="p-invalid">Keterangan is required.</small>}
                            </div>
                        </div>
                    </Dialog>

                    {/* Dialog Delete Pembelian */}
                    <Dialog visible={deletePembelianDialog} header="Confirm" modal footer={deletePembelianDialogFooter} onHide={hideDeletePembelianDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {pembelian && (
                                <span>
                                    are you sure you want to delete <strong>{pembelian.FAKTUR}</strong>
                                </span>
                            )}
                        </div>
                    </Dialog>
                    {/* Dialog Jenis Pembelian */}
                    <Dialog visible={jenisPembelianDialog} header="Pilih Jenis Penerimaan Barang" modal onHide={() => setJenisPembelianDialog(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <Button label="Dengan Faktur PO" icon="pi pi-external-link" className="p-button-success ml-2 mr-2" onClick={handleDenganFakturPO} />
                            <Button label="Tanpa Faktur PO" icon="pi pi-box" className="p-button-success ml-2 mr-2" onClick={handleTanpaFakturPO} />
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

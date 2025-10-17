/**
     * Nama Program: GODONG POS - Pembelian - Retur Pembelian
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 1 Maret 2024
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Menu Retur Pembelian
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
import { convertToISODate, formatAndSetDate, formatDate, formatDateTable, getEmail, getUserName } from '../../../component/GeneralFunction/GeneralFunction';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';

import jsPDF from 'jspdf';
import { Footer, HeaderLaporan, addPageInfo } from '../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
import PDFViewer from '../../../component/PDFViewer';
import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function MasterReturFaktur() {
    const apiEndPointGet = '/api/rtnpembelian_faktur/get';
    // Delete
    const apiEndPointDelete = '/api/rtnpembelian_faktur/delete';

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedCoa, setSelectedCoa] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [returFaktur, setReturFaktur] = useState([]);
    const [returFakturDialog, setReturFakturDialog] = useState(false);
    const [dates, setDates] = useState(null);
    const [defaultOption, setDropdownValue] = useState(null);
    const [statusAction, setStatusAction] = useState(null);
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [returPembelianTabel, setReturPembelianTabel] = useState(null);
    const [returPembelianTabelFilt, setReturPembelianTabelFilt] = useState(null);
    const [search, setSearch] = useState('');
    // BY DHEA
    const [deleteReturDialog, setDeleteReturDialog] = useState(false);
    const [adjustDialog, setAdjustDialog] = useState(false);
    // PDF
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
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [{ field: 'KODE', header: 'KODE' }];

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
        setReturPembelianTabelFilt(returPembelianTabel);
    }, [returPembelianTabel, lazyState]);

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

            console.log(requestBody);

            // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            console.log(json);
            setTotalRecords(json.total_data);
            setReturPembelianTabel(json.data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setReturFakturDialog(false);
    };

    const hideDeleteReturDialog = () => {
        setDeleteReturDialog(false);
    };

    //--------------------------------------------------------------------------------------------------------------- Handle Chage
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

    const confirmDeleteRetur = (retur) => {
        setReturFaktur(retur);
        setDeleteReturDialog(true);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const router = useRouter();
    const [jenisReturDialog, setJenisReturDialog] = useState(false);
    const openNew = () => {
        setReturFaktur([]);
        setSubmitted(false);
        // router.push('/pembelian/retur/form');
        setJenisReturDialog(true);
    };
    const handleDenganFakturPembelian = () => {
        // setRetur([]);
        setSubmitted(false);
        router.push('/pembelian/retur/form');
    };
    const handleTanpaFakturPembelian = () => {
        // setRetur([]);
        setSubmitted(false);
        router.push('/pembelian/retur/tanpa-po/form');
    };

    const refresh = () => {
        setLoading(true);
        if (startDate && endDate) {
            const updatedLazyState = {
                ...lazyState,
                START_DATE: convertToISODate(startDate),
                END_DATE: convertToISODate(endDate)
            };
            loadLazyData(updatedLazyState);
        } else {
            loadLazyData(lazyState);
        }
        setLoading(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const saveReturFaktur = async (e) => {
        e.preventDefault();
    };

    const editRetur = async (rowData) => {
        const { FAKTUR } = rowData;
        localStorage.setItem('FAKTUR', FAKTUR); // Simpan FAKTUR di localStorage
        // router.push('/pembelian/retur/form?status=update');
        // return console.log(rowData);
        if (rowData.FAKTURPEMBELIAN === null) {
            console.log('TANPA FAKTURPEMBELIAN');
            router.push('/pembelian/retur/tanpa-po/form?status=update');
        } else {
            console.log('DENGAN FAKTURPEMBELIAN');
            router.push('/pembelian/retur/form?status=update');
        }
    };

    const deleteRetur = async () => {
        console.log(returFaktur);
        let requestBody = {
            FAKTUR: returFaktur.FAKTUR
        };
        console.log('requestBody', requestBody);
        // return;
        try {
            const header = { 'Content-Type': 'application/json;charset=UTF-8', 'X-ENDPembelianINT': apiEndPointDelete };
            // const vaDelete = await axios.post(apiDirPath, requestBody, { headers: header });
            const vaTable = await postData(apiEndPointDelete, requestBody);
            let data = vaTable.data;
            if (data.code === '200') {
                toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Dihapus', life: 3000 });
                // setReturFaktur([]);
                setDeleteReturDialog(false);
                refreshTabel();
            } else {
                toast.current.show({ severity: 'error', summary: data.message, detail: 'Kesalahan Proses', life: 3000 });
            }

            // if (data.status == 'success') {
            //     toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Data Berhasil Dihapus', life: 3000 });
            //     // setReturFaktur([]);
            //     setDeleteReturDialog(false);
            //     refreshTabel();
            // } else {
            //     toast.current.show({ severity: 'error', summary: 'Error', detail: 'Data Gagal Dihapus', life: 3000 });
            // }
        } catch (error) {
            // console.log(error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kesalahan Proses', life: 3000 });
        }
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (returPembelianTabelFilt.length == 0 || !returPembelianTabelFilt) {
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
            const returPembelianTabelPDF = returPembelianTabelFilt ? JSON.parse(JSON.stringify(returPembelianTabelFilt)) : [];

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

            const judulLaporan = 'Laporan Retur Pembelian';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = returPembelianTabelPDF.map((item) => [
                item.FAKTUR,
                item.FAKTURPEMBELIAN,
                item.KETERANGAN,
                formatDate(item.TGL),
                formatDate(item.JTHTMP),
                item.NAMA,
                parseInt(item.TOTALRETUR).toLocaleString(),
                parseInt(item.TOTAL).toLocaleString()
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['FAKTUR', 'FKT PEMBELIAN', 'KETERANGAN', 'TANGGAL', 'JTHTMP', 'SUPPLIER', 'RETUR', 'TOTAL HARGA']],
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
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                    6: { halign: 'right' },
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
            setShowPreview(false);
        } catch (error) {
            console.log(error);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(returPembelianTabelFilt, 'laporan-retur-faktur.xlsx');
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

    const returFakturDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveReturFaktur} />
        </>
    );

    const deleteReturDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteReturDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteRetur} />
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
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editRetur(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteRetur(rowData)} />
            </>
        );
    };
    // ----------------------------------------------------------------------------------------------------------------------------------------------------- search
    const dropdownValues = [
        { name: 'FAKTUR', label: 'FAKTUR' },
        { name: 'FAKTURPEMBELIAN', label: 'FAKTURPEMBELIAN' },
        { name: 'NAMA', label: 'NAMA' }
    ];
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onInput={handleStartDateChange} onChange={handleStartDate} placeholder="Start Date" dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onInput={handleEndDateChange} onChange={handleEndDate} placeholder="End Date" dateFormat="dd-mm-yy" style={{ width: '100px' }} />
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
            filtered = returPembelianTabel.filter((d) => (x ? x.test(d.FAKTUR) || x.test(d.FAKTURPEMBELIAN) || x.test(d.KETERANGAN) || x.test(d.TGL) || x.test(d.JTHTMP) || x.test(d.NAMA) || x.test(d.TOTALRETUR) || x.test(d.TOTAL) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = returPembelianTabel;
            } else {
                filtered = returPembelianTabel.filter((d) => (x ? x.test(d.FAKTUR) : []));
            }
        }

        setReturPembelianTabelFilt(filtered);
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Menu Retur Pembelian</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                    <DataTable
                        value={returPembelianTabelFilt}
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
                        <Column headerStyle={{ textAlign: 'center' }} field="FAKTURPEMBELIAN" header="FAKTUR PEMBELIAN" body={(rowData) => (rowData.FAKTURPEMBELIAN ? rowData.FAKTURPEMBELIAN : '-')} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TANGGAL" body={(rowData) => formatDateTable(rowData.TGL)} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="JTHTMP" header="JTH TMP" body={(rowData) => (rowData.JTHTMP ? formatDateTable(rowData.JTHTMP) : '-')} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="SUPPLIER "></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TOTALRETUR" header="RETUR" body={(rowData) => Math.floor(rowData.TOTALRETUR)} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="TOTAL"
                            header="TOTAL HARGA"
                            body={(rowData) => {
                                const value = rowData.TOTAL ? parseInt(rowData.TOTAL).toLocaleString() : 0;
                                return value;
                            }}
                            bodyStyle={{ textAlign: 'right' }}
                        ></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate} bodyStyle={{ textAlign: 'center' }}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={preview}></Toolbar>

                    {/* Dialog ReturFaktur  */}
                    <Dialog visible={returFakturDialog} style={{ width: '75%' }} header="Tambah ReturFaktur " modal className="p-fluid" footer={returFakturDialogFooter} onHide={hideDialog}>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="kode">Kode</label>
                                <div className="p-inputgroup">
                                    <InputText disabled id="kode" value={returFaktur.KODE} onChange={(e) => onInputChange(e, 'KODE')} className={classNames({ 'p-invalid': submitted && !returFaktur.KODE })} />
                                </div>
                                {submitted && !returFaktur.KODE && <small className="p-invalid">Kode is required.</small>}
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="keterangan">Keterangan</label>
                                <InputText id="keterangan" value={returFaktur.Keterangan} onChange={(e) => onInputChange(e, 'Keterangan')} required autoFocus className={classNames({ 'p-invalid': submitted && !returFaktur.Keterangan })} />
                                {submitted && !returFaktur.KETERANGAN && <small className="p-invalid">Keterangan is required.</small>}
                            </div>
                        </div>
                    </Dialog>

                    {/* DIALOG DELETE RETUR PEMBELIAN */}
                    <Dialog visible={deleteReturDialog} header="Confirm" modal footer={deleteReturDialogFooter} onHide={hideDeleteReturDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {returFaktur && (
                                <span>
                                    are you sure you want to delete <strong>{returFaktur.FAKTUR}</strong>
                                </span>
                            )}
                        </div>
                    </Dialog>
                    {/* Dialog Jenis Retur */}
                    <Dialog visible={jenisReturDialog} header="Pilih Jenis Retur Barang" modal onHide={() => setJenisReturDialog(false)}>
                        <div className="flex align-items-center justify-content-center">
                            <Button label="Dengan Faktur Pembelian" icon="pi pi-external-link" className="p-button-success ml-2 mr-2" onClick={handleDenganFakturPembelian} />
                            <Button label="Tanpa Faktur Pembelian" icon="pi pi-box" className="p-button-success ml-2 mr-2" onClick={handleTanpaFakturPembelian} />
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

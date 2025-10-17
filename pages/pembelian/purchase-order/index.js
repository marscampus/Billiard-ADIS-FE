/**
     * Nama Program: GODONG POS - Pembelian - Purchase Order
     * Pengembang: Salsabila Emma
     * Tanggal Pengembangan: 21 Feb 2024 (re-coding)
     * Versi: 1.1.0

    Catatan:
    - Versi 1.1.0 mencakup fungsionalitas Menu Purchase Order
*/
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
// import TabelSkaleton from '../../../../component/tabel/skaleton';
import { startOfMonth } from 'date-fns';
import { useRouter } from 'next/router';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { convertToISODate, formatDate, formatDateTable, getEmail, getUserName, showError } from '../../../component/GeneralFunction/GeneralFunction';
import { Footer, HeaderLaporan, addPageInfo } from '../../../component/exportPDF/exportPDF';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan';

import jsPDF from 'jspdf';
import PDFViewer from '../../../component/PDFViewer';
import { exportToXLSX } from '../../../component/exportXLSX/exportXLSX';
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
export default function MasterPo() {
    const apiEndPointGet = '/api/purchase_order/get';
    const apiEndPointDelete = '/api/purchase_order/delete';
    const apiEndPointGetDataEdit = '/api/purchase_order/getdata_edit';

    let emptypo = {
        KODE: null
    };

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [po, setPo] = useState([]);
    const [poDialog, setPoDialog] = useState(false);
    const [poTabel, setPoTabel] = useState([]);
    const [poTabelFilt, setPoTabelFilt] = useState([]);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [kodeError, setKodeError] = useState('');
    const [keteranganError, setKeteranganError] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [search, setSearch] = useState('');
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
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
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [{ field: 'KODE', header: 'KODE' }];

    const op = useRef(null);
    const dt = useRef(null);

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    };
    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };
    const [startDate, setStartDate] = useState(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState(new Date());
    const [defaultOption, setDropdownValue] = useState(null);
    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setPoTabelFilt(poTabel);
    }, [poTabel, lazyState]);

    const loadLazyData = async () => {
        try {
            setLoading(true);
            let requestBody = { ...lazyState };

            if (startDate && endDate) {
                requestBody.TglAwal = convertToISODate(startDate);
                requestBody.TglAkhir = convertToISODate(endDate);
            }
            console.log(requestBody);
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setPoTabel(json.data);
        } catch (error) {
            // Tangani error dengan sesuai, misalnya tampilkan pesan kesalahan
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
    };
    // -----------------------------------------------------------------------------------------------------------------< Handle Calendar >
    const handleStartDateChange = (e) => {
        setStartDate(e.value);
    };
    const handleEndDateChange = (e) => {
        setEndDate(e.value);
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setSubmitted(false);
        setPoDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const router = useRouter();
    const openNew = () => {
        setPo(emptypo);
        setSubmitted(false);
        router.push('/pembelian/purchase-order/form');
    };

    // -------------------------------------------------------------------------------------------------------------------- Func

    const editPo = async (rowData) => {
        const { faktur } = rowData;
        // router.push(`/pembelian/purchase-order/form?FAKTUR=${FAKTUR}&status=update`);

        try {
            console.log(rowData);
            let requestBody = {
                FAKTUR: faktur
            };
            const header = { 'Content-Type': 'application/json;charset=UTF-8', 'X-ENDPOINT': apiEndPointGetDataEdit };
            // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;

            localStorage.setItem('FAKTUR', faktur); // Simpan FAKTUR di localStorage
            router.push('/pembelian/purchase-order/form?status=update');
        } catch (error) {
            // console.log("Error fetching data:", error);
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------------------------------------------------------------< Search Bar >
    // useEffect(() => {
    //     refresh();
    // }, [startDate, endDate]);
    const refresh = () => {
        setLoading(true);
        if (startDate && endDate) {
            const updatedLazyState = {
                ...lazyState,
                START_DATE: startDate,
                END_DATE: endDate
            };
            console.log('updatedLazyState', updatedLazyState);
            loadLazyData(updatedLazyState);
        } else {
            loadLazyData(lazyState);
        }
        setLoading(false);
    };
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="startDate" value={startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Calendar name="endDate" value={endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={refresh} />
                </div>
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Pilih Kolom" /> */}
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
            filtered = poTabel.filter((d) => (x ? x.test(d.FAKTUR) || x.test(d.KETERANGAN) || x.test(d.TGL) || x.test(d.JTHTMP) || x.test(d.supplier.NAMA) || x.test(d.TOTAL) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = poTabel;
            } else {
                filtered = poTabel.filter((d) => (x ? x.test(d.FAKTUR) : []));
            }
        }

        setPoTabelFilt(filtered);
    };

    // ----------------------------------------------------------------------------------------------------------------< Delete >
    const [deletePoDialog, setDeletePoDialog] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState('');
    const handleDelete = (rowData) => {
        setSelectedRowData(rowData);
        setPo(rowData);
        setDeletePoDialog(true);
    };
    const deletePo = async () => {
        let requestBody = {
            FAKTUR: selectedRowData.faktur
        };
        console.log('requestBody', requestBody);

        try {
            const vaTable = await postData(apiEndPointDelete, requestBody);
            // return console.log(vaTable);
            let data = vaTable.data;
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Dihapus', life: 3000 });
            setDeletePoDialog(false);
            refreshTabel();
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            console.error('Error while loading data:', error);
        }
        // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (poTabelFilt.length == 0 || !poTabelFilt) {
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
            const poTabelPDF = poTabelFilt ? JSON.parse(JSON.stringify(poTabelFilt)) : [];

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

            if (!poTabelPDF || poTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Purchase Order';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = poTabelPDF.map((item) => [item.faktur, item.keterangan, formatDate(item.tgl), formatDate(item.jthtmp), item.supplier, parseInt(item.total).toLocaleString()]);
            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['FAKTUR', 'KETERANGAN', 'TANGGAL', 'JATUH TEMPO', 'SUPPLIER', 'TOTAL HARGA']],
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
        } catch (error) {
            console.log(error);
        }
    };

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(poTabel, 'laporan-purchase-order.xlsx');
    };

    // ----------------------------------------------------------------------------------------------------------------< Button >
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                </div>
            </React.Fragment>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="warning" rounded className="mr-2" onClick={() => editPo(rowData)} />
                <Button icon="pi pi-trash" severity="danger" rounded onClick={() => handleDelete(rowData)} />
            </>
        );
    };

    const deletePoDialogFooter = (rowData) => (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={() => setDeletePoDialog(false)} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deletePo} />
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
            {/* <div className="col-12"> */}
            <div className="card">
                <h4>Purchase Order</h4>
                <hr />
                <Toast ref={toast} />
                <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                <DataTable
                    value={poTabelFilt}
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
                    <Column headerStyle={{ textAlign: 'center' }} field="faktur" header="FAKTUR" bodyStyle={{ textAlign: 'center' }}></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="keterangan" header="KETERANGAN"></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="tgl" header="TANGGAL" body={(rowData) => formatDateTable(rowData.tgl)} bodyStyle={{ textAlign: 'center' }}></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="jthtmp" header="JTH TMP" body={(rowData) => formatDateTable(rowData.jthtmp)} bodyStyle={{ textAlign: 'center' }}></Column>
                    <Column headerStyle={{ textAlign: 'center' }} field="supplier" header="SUPPLIER"></Column>
                    <Column
                        headerStyle={{ textAlign: 'center' }}
                        field="total"
                        header="TOTAL HARGA"
                        body={(rowData) => {
                            const value = rowData.total ? parseInt(rowData.total).toLocaleString() : 0;
                            return value;
                        }}
                        bodyStyle={{ textAlign: 'right' }}
                    ></Column>
                    <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate} bodyStyle={{ textAlign: 'center' }}></Column>
                </DataTable>
                <Toolbar className="mb-4" left={preview}></Toolbar>

                {/* Dialog Delete Po  */}
                <Dialog visible={deletePoDialog} header="Confirm" modal footer={deletePoDialogFooter} onHide={() => setDeletePoDialog(false)}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        {po && (
                            <span>
                                Yakin ingin menghapus <strong>{po.FAKTUR}</strong>?
                            </span>
                        )}
                    </div>
                </Dialog>
            </div>
            {/* </div> */}
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}

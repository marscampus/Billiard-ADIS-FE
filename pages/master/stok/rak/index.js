import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';

import jsPDF from 'jspdf';
import { getEmail, getUserName, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/PDFViewer';
import { Footer, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function rak() {
    // API READ
    const apiEndPointGet = '/api/rak/get';
    // API STORE
    const apiEndPointStore = '/api/rak/store';
    // API UPDATE
    const apiEndPointUpdate = '/api/rak/update';
    // API DELETE
    const apiEndPointDelete = '/api/rak/delete';

    const toast = useRef(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [deleteRakDialog, setDeleteRakDialog] = useState(false);
    const [rak, setRak] = useState([]);
    const [rakDialog, setRakDialog] = useState(false);
    const [rakTabel, setRakTabel] = useState([]);
    const [rakTabelFilt, setRakTabelFilt] = useState([]);
    const [rakTabelAll, setRakTabelAll] = useState([]);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [search, setSearch] = useState('');
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman

    //  ------------------------------------------------------------------------------------------------------- Preparation
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const op = useRef(null);
    // const onPage = (event) => {
    //     setlazyState(event);
    // };

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
        setRakTabelFilt(rakTabel);
    }, [rakTabel, lazyState]);

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const loadLazyData = async () => {
        setLoading(true);
        let requestBody = { ...lazyState };
        try {
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setRakTabel(json.data);
            setTotalRecords(json.total_data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const allData = async () => {
        const vaData = await postData(apiEndPointGet);
        const data = vaData.data;
        setRakTabelAll(data.data);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        setRak([]);

        setRakDialog(true);
        setIsUpdateMode(false);
    };

    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setRakDialog(false);
    };
    const hideDeleteRakDialog = () => {
        setDeleteRakDialog(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _rak = { ...rak };
        _rak[`${name}`] = val;

        setRak(_rak);
    };
    const saveRak = async (e) => {
        e.preventDefault();
        let _rakTabel = [...rakTabel];
        let _rak = { ...rak };
        console.log('_rak', _rak);
        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _rak);
            let data = vaTable.data;
            console.log('data', data);

            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
            setRakDialog(false);
            setRakTabel(_rakTabel);
            refreshTabel();
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    const editRak = (rak) => {
        setRak({ ...rak });
        setRakDialog(true);
        setIsUpdateMode(true);
    };

    const confirmDeleteRak = (rak) => {
        setRak(rak);
        setDeleteRakDialog(true);
    };

    const deleteRak = async () => {
        let requestBody = {
            KODE: rak.KODE
        };
        try {
            const vaTable = await postData(apiEndPointDelete, requestBody);
            let data = vaTable.data;
            console.log(data);
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Dihapus', life: 3000 });
            setRak([]);
            setDeleteRakDialog(false);
            refreshTabel();
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (rakTabelFilt.length == 0 || !rakTabelFilt) {
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
            const rakTabelPDF = rakTabelFilt ? JSON.parse(JSON.stringify(rakTabelFilt)) : [];
            let format = 'a4';
            if (selectedPaperSize === 'Letter') {
                format = 'letter';
            } else if (selectedPaperSize === 'Legal') {
                format = 'legal';
            }

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation: dataAdjust.orientation,
                unit: 'mm',
                format: dataAdjust.format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!rakTabelPDF || rakTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Rak';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = rakTabelPDF.map((item) => [item.KODE, item.KETERANGAN]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['KODE', 'KETERANGAN']],
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
                columnStyles: {},
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
        exportToXLSX(rakTabelFilt, 'master-rak.xlsx');
    };

    // ---------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} readOnly={!selectedraks || !selectedraks.length} /> */}
                </div>
            </React.Fragment>
        );
    };

    const previewRak = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" icon="pi pi-file-o" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };
    const rakDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveRak} />
        </>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editRak(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteRak(rowData)} />
            </>
        );
    };

    const deleteRakDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteRakDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteRak} />
        </>
    );

    const dropdownValues = [
        { name: 'KODE', label: 'r.KODE' },
        { name: 'KETERANGAN', label: 'r.KETERANGAN' }
    ];
    const [defaultOption, setDropdownValue] = useState(null);
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
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
            filtered = rakTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.KETERANGAN) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = rakTabel;
            } else {
                filtered = rakTabel.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }

        setRakTabelFilt(filtered);
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
                    <h4>Menu Rak</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={rakTabelFilt}
                        filters={lazyState.filters}
                        header={headerSearch}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        paginator
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords}
                        size="small"
                        loading={loading}
                        className="datatable-responsive"
                        emptyMessage="Data Kosong"
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={previewRak}></Toolbar>

                    {/* Dialog Rak */}
                    <Dialog visible={rakDialog} header="Tambah Rak Stok" modal className="p-fluid" footer={rakDialogFooter} onHide={hideDialog}>
                        <div className="formgrid grid">
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="kode">Kode</label>
                                <div className="p-inputgroup">
                                    <InputText autoFocus id="kode" value={rak.KODE} onChange={(e) => onInputChange(e, 'KODE')} readOnly={isUpdateMode} />
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="keterangan">Keterangan</label>
                                <InputText id="keterangan" value={rak.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} required />
                            </div>
                        </div>
                    </Dialog>
                    <Dialog visible={deleteRakDialog} header="Confirm" modal footer={deleteRakDialogFooter} onHide={hideDeleteRakDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {rak && (
                                <span>
                                    Yakin ingin menghapus data <strong>{rak.KODE}</strong> ?
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

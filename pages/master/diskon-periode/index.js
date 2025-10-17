import jsPDF from 'jspdf';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { convertToISODate, formatColumnValue, formatDate, formatDateSave, getEmail, getUserName, showError } from '../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../component/PDFViewer.js';
import { Footer, HeaderLaporan, addPageInfo } from '../../../component/exportPDF/exportPDF.js';
import AdjustPrintMarginPDF from '../../component/adjustPrintMarginPDF';
import Produk from '../../component/produk';
import PrintDiskonPeriode from './printDiskonPeriode.js';

import postData from '../../../lib/Axios';
import { getSessionServerSide } from '../../../utilities/servertool';
import AdjustPrintMarginLaporan from '../../component/adjustPrintMarginLaporan.js';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
const styles = {
    tabHeader: {
        position: 'fixed',
        width: '650px',
        zIndex: 999
    },
    tabHeaderDiskon: {
        position: 'fixed',
        width: '700px',
        zIndex: 999
    },
    padding: {
        paddingTop: '50px'
    }
};
export default function MasterDiskon() {
    const apiEndPointGetDataPrint = '/api/diskon_periode/print';
    // API READ
    const apiEndPointGet = '/api/diskon_periode/get';
    // API DELETE
    const apiEndPointDelete = '/api/diskon_periode/delete';
    // API STORE
    const apiEndPointStore = '/api/diskon_periode/store';
    // API EDIT
    const apiEndPointUpdate = '/api/diskon_periode/update';
    const apiEndPointPriceTag = '/api/produk/pricetag';

    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [diskonPeriodeDialog, setDiskonPeriodeDialog] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [diskon, setDiskon] = useState([]);
    const [diskonCetak, setDiskonCetak] = useState([]);
    const [diskonTabel, setDiskonTabel] = useState([]);
    const [diskonTabelFilt, setDiskonTabelFilt] = useState([]);
    const [statusAction, setStatusAction] = useState(null);
    const [keteranganJenisDiskon, setKeteranganJenisDiskon] = useState('');
    const [keteranganRekening, setKeteranganRekening] = useState('');
    const [deleteDiskonDialog, setDeleteDiskonDialog] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [search, setSearch] = useState('');

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const op = useRef(null);

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
        setDiskonTabelFilt(diskonTabel);
    }, [diskonTabel, lazyState]);

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };
    const [ketOptions, setKetOptions] = useState([
        { label: 'Semua Data', value: 'ALL' },
        { label: 'Diskon Masih Berlaku', value: 'ACTIVE' }
    ]);

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [tgl, setTgl] = useState(new Date());
    const loadLazyData = async () => {
        try {
            setLoading(true);
            const requestBody = {
                ...lazyState,
                Tgl: convertToISODate(tgl)
            };
            console.log('requestBody', requestBody);
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            console.log('json', json);
            setDiskonTabel(json.data);
            setTotalRecords(json.total_data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };
    const handleTglChange = (e) => {
        setTgl(e.value);
    };
    const handleStartDateChange = (e) => {
        setStartDate(e.value);
        setDiskon((prevDiskon) => ({
            ...prevDiskon,
            TGL_MULAI: dataProduk.TGL_MULAI
        }));
    };
    const handleEndDateChange = (e) => {
        setEndDate(e.value);
        setDiskon((prevDiskon) => ({
            ...prevDiskon,
            TGL_AKHIR: dataProduk.TGL_AKHIR
        }));
    };
    const refresh = () => {
        setLoading(true);
        if (tgl) {
            const updatedLazyState = {
                ...lazyState,
                TGL: tgl
            };
            loadLazyData(updatedLazyState);
        } else {
            loadLazyData(lazyState);
        }
        setLoading(false);
    };
    // ----------------------------------------------------------------------------------------------------------------- Hide Dialog
    const hideDialog = () => {
        setKeteranganJenisDiskon('');
        setKeteranganRekening('');
        setSubmitted(false);
        setDiskonPeriodeDialog(false);
    };
    const hideDeleteDiskonDialog = () => {
        setDeleteDiskonDialog(false);
    };

    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [dataProduk, setDataProduk] = useState('');
    const btnProduk = () => {
        setProdukDialog(true);
    };
    const handleProduk = (dataProduk) => {
        setDataProduk(dataProduk);
        // detailDataProduk(kode)
        if (dialogPreview === true) {
            setDiskonCetak((prevDiskonCetak) => ({
                ...prevDiskonCetak,
                KODE: dataProduk.KODE
            }));
            setProdukDialog(false);
            return;
        }
        setDiskon((prevDiskon) => ({
            ...prevDiskon,
            KODE: dataProduk.KODE,
            BARCODE: dataProduk.KODE_TOKO,
            NAMA: dataProduk.NAMA,
            HJ_AWAL: dataProduk.HJ
        }));

        setProdukDialog(false);
    };

    // const detailDataProduk = async (rowData) => {
    //     const { KODE } = rowData;
    //     setLapDaftarPenjualanDialog(true);
    // 	try {
    //         let requestBody = {
    //             KODE: KODE,
    // 		};
    //         setFaktur(requestBody.FAKTUR);
    //         const vaTable = await postData(apiEndPointGetDataByKode, requestBody);
    // 		const json = vaTable.data;
    //         console.log('json dari update', json);
    //         setDiskon(json);
    //     } catch (error) {
    //         toast.current.show({ severity: 'error', summary: data.message, detail: 'Kesalahan Proses', life: 3000 });
    //         setLoading(false);
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        setDiskon([]);
        setSubmitted(false);
        setDiskonPeriodeDialog(true);
        setIsUpdateMode(false);
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        setDiskonCetak((prevState) => ({ ...prevState, [name]: val }));
        console.log('hah', { ...diskonCetak, [name]: val });

        // const val = (e.target && e.target.value) || '';
        // let _diskon = { ...diskon };
        // _diskon[`${name}`] = val;
        // setDiskon(_diskon);
        // console.log('hah', _diskon)
    };

    const onInputNumberChange = (e, name) => {
        const val = e.value || 0;
        let _diskon = { ...diskon };
        _diskon[`${name}`] = val;
        setDiskon(_diskon);
    };
    const saveDiskon = async (e) => {
        e.preventDefault();
        let _diskonTabel = [...diskonTabel];
        let _diskon = {
            ...diskon,
            TGL_MULAI: isUpdateMode ? diskon.TGL_MULAI : formatDateSave(diskon.TGL_MULAI || startDate),
            TGL_AKHIR: isUpdateMode ? diskon.TGL_AKHIR : formatDateSave(diskon.TGL_AKHIR || endDate)
        };
        console.log(_diskon);
        if (!_diskon.KODE) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kode Barang Belum Diisi !', life: 3000 });
            return;
        }
        if (!_diskon.KUOTA_QTY) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Kuota QTY masih 0 !', life: 3000 });
            return;
        }
        if (!_diskon.HJ_DISKON) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Harga Diskon Belum Diisi !', life: 3000 });
            return;
        }
        // return;
        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _diskon);
            let data = vaTable.data;
            console.log(data);
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
            if (statusAction == 'update') {
                setDiskonTabel(_diskonTabel);
                setDiskon([]);
            } else {
                refreshTabel();
            }
            setDiskonPeriodeDialog(false);
            // } else if (data.code === '409') {
            //     toast.current.show({ severity: 'error', summary: data.message, detail: 'Kode Tidak Boleh Sama', life: 3000 });
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    const editDiskon = (diskon) => {
        setDiskon({ ...diskon });
        setDiskonPeriodeDialog(true);
        setIsUpdateMode(true);
    };

    const confirmDeleteDiskon = (diskon) => {
        setDiskon(diskon);
        setDeleteDiskonDialog(true);
    };

    const deleteDiskon = async () => {
        let requestBody = {
            KODEDISKON: diskon.KODEDISKON
        };
        try {
            const vaDelete = await postData(apiEndPointDelete, requestBody);
            let data = vaDelete.data;
            console.log(data);
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Dihapus', life: 3000 });
            setDiskon([]);
            setDeleteDiskonDialog(false);
            refreshTabel();
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }

        // if (data.status == 'success') {
        //     toast.current.show({ severity: 'success', summary: 'Successful', detail: 'delected success', life: 3000 });
        //     setDiskon([]);
        //     setDeleteDiskonDialog(false);
        //     refreshTabel();
        // } else {
        //     toast.current.show({ severity: 'error', summary: 'Error', detail: 'deleted error', life: 3000 });
        // }
    };

    // -----------------------------------------------------------------------------------------------------------------< Print Barcode >
    const [deletePrintBarcodeDialog, setDeletePrintBarcodeDialog] = useState(false);
    const [printBarcode, setPrintBarcode] = useState([]);
    const [priceTagTabel, setPriceTagTabel] = useState([]);

    const [printBarcodeDialog, setPrintBarcodeDialog] = useState(false);
    const [dataPrint, setDataPrint] = useState('');
    const btnPrintBarcode = () => {
        setPrintBarcodeDialog(true);
    };

    const hideBarcodePrintDialog = () => {
        // setNull();
        setPriceTagTabel([]);
        setPrintBarcodeDialog(false);
    };

    // --------------------------------------------------
    // ---------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} readOnly={!selecteddiskons || !selecteddiskons.length} /> */}
                </div>
            </React.Fragment>
        );
    };
    const diskonDialogFooter = (
        <>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Save" icon="pi pi-check" className="p-button-text" onClick={saveDiskon} />
        </>
    );
    const previewDiskon = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" icon="pi pi-file-o" outlined className="p-button-secondary p-button-sm mr-2" onClick={previewDiskonPeriode} />
                </div>
                <div className="my-2">
                    <Button label="Print Diskon Periode" icon="pi pi-tag" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnPrintBarcode} />
                </div>
            </React.Fragment>
        );
    };
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editDiskon(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteDiskon(rowData)} />
            </>
        );
    };

    const deleteDiskonDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteDiskonDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteDiskon} />
        </>
    );

    const dropdownValues = [
        { name: 'KODE', label: 's.Kode' },
        { name: 'NAMA', label: 's.Nama' }
    ];
    const [defaultOption, setDropdownValue] = useState(null);
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup">
                    <Calendar name="tgl" value={tgl} onChange={handleTglChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
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
            filtered = diskonTabel.filter((d) => (x ? x.test(d.KodeDiskon) || x.test(d.Kode) || x.test(d.Barcode) || x.test(d.Nama) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = diskonTabel;
            } else {
                filtered = diskonTabel.filter((d) => (x ? x.test(d.KodeDiskon) : []));
            }
        }
        setDiskonTabelFilt(filtered);
    };

    const [startDateCetak, setStartDateCetak] = useState(new Date());
    const [endDateCetak, setEndDateCetak] = useState(new Date());
    const handleStartDateChangeCetak = (e) => {
        setStartDateCetak(e.value);
    };
    const handleEndDateChangeCetak = (e) => {
        setEndDateCetak(e.value);
    };

    const [dialogPreview, setDialogPreview] = useState(false);
    const [mutasiDiskonPeriode, setMutasiDiskonPeriode] = useState([]);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [pilihDiskonPeriodeDialog, setPilihDiskonPeriodeDialog] = useState(false);
    const previewDiskonPeriode = () => {
        setPilihDiskonPeriodeDialog(true);
        setDialogPreview(true);
    };
    const funcPilihDiskonPeriode = async () => {
        setLoading(true);
        try {
            let requestBody = {
                // START_DATE: convertToISODate(startDateCetak),
                // END_DATE: convertToISODate(endDateCetak),
                KET: diskonCetak.KET,
                KODE: diskonCetak.KODE
            };
            console.log(requestBody);
            const vaTable = await postData(apiEndPointGetDataPrint, requestBody);
            const json = vaTable.data.data;
            console.log('json nich __ ', json);
            setMutasiDiskonPeriode(json);
            setAdjustDialog(true);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
        setPilihDiskonPeriodeDialog(false);
    };

    const handleAdjust = async (dataAdjust) => {
        cetak(dataAdjust);
    };
    const [pdfUrl, setPdfUrl] = useState('');
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(true);

    const cetak = async (dataAdjust) => {
        try {
            // return;
            setLoadingPreview(true);
            const rekapPDF = mutasiDiskonPeriode ? JSON.parse(JSON.stringify(mutasiDiskonPeriode)) : [];
            const tableData = rekapPDF.map((item, index) => [
                index + 1,
                item.KODEDISKON,
                item.KODE,
                item.BARCODE,
                item.TGL,
                item.TGL_MULAI,
                item.TGL_AKHIR,
                formatColumnValue(item.HJ_AWAL),
                formatColumnValue(item.HJ_DISKON),
                // item.DISKON,
                item.KUOTA_QTY
            ]);

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

            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;

            if (!rekapPDF || rekapPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());
            const judulLaporan = 'Rekap Mutasi Diskon Periode ';
            const periodeLaporan = 'Antara Tanggal : ' + formatDate(startDateCetak) + '  -  ' + formatDate(endDateCetak);

            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const startY = 50 + marginTopInMm - 10;
            doc.autoTable({
                startY: startY,
                head: [['NO', 'KODE DISKON', 'KODE', 'BARCODE', 'TANGGAL', 'TANGGAL DIMULAI', 'TANGGAL BERAKHIR', 'HARGA AWAL', 'HARGA DISKON', 'KUOTA QTY']],
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
                    4: { halign: 'center' },
                    5: { halign: 'center' },
                    6: { halign: 'center' },
                    7: { halign: 'right' },
                    8: { halign: 'right' },
                    9: { halign: 'center' }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                didDrawPage: async function (data) {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });

            const pdfDataUrl = doc.output('datauristring');
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setAdjustDialog(false);
            setLoadingPreview(false);
        } catch (error) {
            console.log('catch', error);
            setLoadingPreview(false);
        }
        setLoadingPreview(false);
    };

    const diskonPeriodeDialogFooter = (
        <>
            {/* <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} /> */}
            <Button label="Cetak" loading={loading} icon="pi pi-check" className="p-button" onClick={funcPilihDiskonPeriode} />
        </>
    );
    const handleCloseDialog = () => {
        setPilihDiskonPeriodeDialog(false);
        setDialogPreview(false);
        setDiskonCetak([]);
    };
    // -------------------------------------------------------------------------------------------------------------------------- return view
    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Menu Diskon Periode</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>
                    <DataTable
                        value={diskonTabelFilt}
                        // filters={lazyState.filters}
                        header={headerSearch}
                        // first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        // onPage={onPage}
                        paginator
                        // paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        // currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords}
                        size="small"
                        loading={loading}
                        className="datatable-responsive"
                        emptyMessage="Data Kosong"
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODEDISKON" header="KODE DISKON"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                        <Column headerStyle={{ textAlign: 'center' }}  body={(rowData) => formatDate(rowData.TGL_MULAI)} header="TGL MULAI" bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }}  body={(rowData) => formatDate(rowData.TGL_AKHIR)} header="TGL AKHIR" bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="HJ_Awal"
                            header="HJ AWAL"
                            body={(rowData) => {
                                const value = rowData.HJ_Awal ? parseInt(rowData.HJ_Awal).toLocaleString() : 0;
                                return value;
                            }}
                            bodyStyle={{ textAlign: 'right' }}
                        ></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="HJ_DISKON"
                            header="HJ DISKON"
                            body={(rowData) => {
                                const value = rowData.HJ_DISKON ? parseInt(rowData.HJ_DISKON).toLocaleString() : 0;
                                return value;
                            }}
                            bodyStyle={{ textAlign: 'right' }}
                        ></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KUOTA_QTY" header="KUOTA" bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={previewDiskon}></Toolbar>

                    {/* Dialog Diskon  */}
                    <Dialog visible={diskonPeriodeDialog} style={{ width: '75%' }} header="Form Diskon Periode " modal className="p-fluid" footer={diskonDialogFooter} onHide={hideDialog}>
                        <div>
                            <div className="formgrid grid">
                                {/* <div className="field col-6 mb-2 lg:col-6">
                                        <label htmlFor="KODEDISKON">Kode Diskon Periode</label>
                                        <div className="p-inputgroup">
                                            <InputText id="KODEDISKON" readOnly={isUpdateMode} value={diskon.KODEDISKON} onChange={(e) => onInputChange(e, 'KODEDISKON')} />
                                        </div>
                                    </div> */}
                                <div className="field col-6 mb-2 lg:col-3">
                                    <label htmlFor="jenis-diskon">Kode</label>
                                    <div className="p-inputgroup">
                                        <InputText id="kode" readOnly value={diskon.KODE} onChange={(e) => onInputChange(e, 'KODE')} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-3">
                                    <label htmlFor="Barcode">Barcode</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly id="Barcode" value={diskon.BARCODE} onChange={(e) => onInputChange(e, 'BARCODE')} />
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="nama">Nama Produk</label>
                                    <div className="p-inputgroup">
                                        <InputText id="nama" readOnly value={diskon.NAMA} onChange={(e) => onInputChange(e, 'NAMA')} />
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="tglPerubahan">Tanggal Awal Periode</label>
                                    <div className="p-inputgroup">
                                        <Calendar
                                            // value={startDate}
                                            onChange={handleStartDateChange}
                                            value={diskon.TGL_MULAI && diskon.TGL_MULAI ? new Date(diskon.TGL_MULAI) : startDate}
                                            // onChange={(e) => onInputChange(e, "TGL_MULAI")}
                                            showIcon
                                            dateFormat="dd-mm-yy"
                                        />
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="tglPerubahan">Tanggal Akhir Periode</label>
                                    <div className="p-inputgroup">
                                        <Calendar
                                            // value={endDate}
                                            value={diskon.TGL_AKHIR && diskon.TGL_AKHIR ? new Date(diskon.TGL_AKHIR) : endDate}
                                            onChange={handleEndDateChange}
                                            // onChange={(e) => onInputChange(e, "TGL_AKHIR")}
                                            showIcon
                                            dateFormat="dd-mm-yy"
                                        />
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-3">
                                    <label htmlFor="alamat">Harga Jual Awal</label>
                                    <div className="p-inputgroup">
                                        <InputNumber readOnly value={diskon.HJ_AWAL} onChange={(e) => onInputNumberChange(e, 'HJ_AWAL')} inputStyle={{ textAlign: 'right' }} />
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-3">
                                    <label htmlFor="plafond1">Harga Jual Diskon</label>
                                    <div className="p-inputgroup">
                                        <InputNumber id="plafond1" value={diskon.HJ_DISKON} onChange={(e) => onInputNumberChange(e, 'HJ_DISKON')} inputStyle={{ textAlign: 'right' }} dateFormat="dd-mm-yy" />
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-6">
                                    <label htmlFor="plafond2">Kuota Qty</label>
                                    <div className="p-inputgroup">
                                        <InputNumber id="plafond2" value={diskon.KUOTA_QTY} onChange={(e) => onInputNumberChange(e, 'KUOTA_QTY')} inputStyle={{ textAlign: 'right' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Dialog>
                    <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProduk={handleProduk} />

                    <Dialog visible={deleteDiskonDialog} header="Confirm" modal footer={deleteDiskonDialogFooter} onHide={hideDeleteDiskonDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {diskon && (
                                <span>
                                    are you sure you want to delete <strong>{diskon.KODEDISKON}</strong>
                                </span>
                            )}
                        </div>
                    </Dialog>

                    <Dialog visible={pilihDiskonPeriodeDialog} style={{ width: '75%' }} header="Pilih Tanggal Diskon Periode" footer={diskonPeriodeDialogFooter} modal className="p-fluid" onHide={handleCloseDialog}>
                        <div className="formgrid grid">
                            {/* <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="kode">Tanggal</label>
                                <div className="p-inputgroup">
                                    <Calendar name="startDateCetak" value={startDateCetak} onChange={handleStartDateChangeCetak} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                                    <Calendar name="endDateCetak" value={endDateCetak} onChange={handleEndDateChangeCetak} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                                    <Button label="" icon="pi pi-calendar" className="p-button-primary mr-2"/>
                                </div>
                            </div> */}
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="ket">Keterangan</label>
                                <Dropdown id="ket" value={diskonCetak.KET} options={ketOptions} onChange={(e) => onInputChange(e, 'KET')} placeholder="Pilih Keterangan" />
                            </div>
                            <div className="field col-12 mb-2 lg:col-6">
                                <label htmlFor="kode">Kode Barang</label>
                                <div className="p-inputgroup">
                                    <InputText id="kode" readOnly value={diskonCetak.KODE} onChange={(e) => onInputChange(e, 'KODE')} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                </div>
                            </div>
                        </div>
                    </Dialog>
                    <PrintDiskonPeriode
                        printBarcodeDialog={printBarcodeDialog}
                        hideBarcodePrintDialog={hideBarcodePrintDialog}
                        deletePrintBarcodeDialog={deletePrintBarcodeDialog}
                        printBarcode={printBarcode}
                        setPrintBarcode={setPrintBarcode}
                        priceTagTabel={priceTagTabel}
                    />
                    <AdjustPrintMarginPDF loadingPreview={loadingPreview} adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} handleAdjust={handleAdjust} />
                    <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: '90%', height: '100%' }} header="PDF Preview">
                        {loadingPreview ? (
                            // Tampilkan indikator loading jika masih dalam proses loading
                            <div>
                                <center>
                                    {' '}
                                    <i className="pi pi-spinner pi-spin" style={{ fontSize: '6.5em', padding: '10px' }} />
                                </center>
                                {/* <span style={{ fontSize: "7.5em", marginLeft: "3px" }}>Loading...</span> */}
                            </div>
                        ) : (
                            <div className="p-dialog-content">
                                <PDFViewer pdfUrl={pdfUrl} />
                            </div>
                        )}
                    </Dialog>
                </div>
            </div>
        </div>
    );
}

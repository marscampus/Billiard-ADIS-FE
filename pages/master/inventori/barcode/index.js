import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import TabelSkaleton from '../../../../component/tabel/skaleton';
import Produk from '../../../component/produk';
import jsPDF from 'jspdf';
import { getEmail, getUserName } from '../../../../component/GeneralFunction/GeneralFunction';
import PDFViewer from '../../../../component/PDFViewer';
import { Footer, HeaderLaporan, addPageInfo } from '../../../../component/exportPDF/exportPDF';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import PrintBarcode from './printBarcode';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}

export default function MasterBarcode() {
    // PATH INSERT
    const apiEndPointStore = '/api/barcode/store';
    // PATH UPDATE
    const apiEndPointUpdate = '/api/barcode/update';
    // PATH SELECT
    const apiEndPointSelect = '/api/barcode/select_barcode';
    // PATH GET
    const apiEndPointGet = '/api/barcode/get';
    // PATH GET DATA EDIT
    const apiEndPointGetDataEdit = '/api/barcode/getdata_edit';
    // PATH DELETE DIALOG
    const apiEndPointDeleteDialog = '/api/barcode/delete_dialog';
    // PATH DELETE
    const apiEndPointDelete = '/api/barcode/delete';

    const [isButtonActive, setIsButtonActive] = useState(false);
    const toast = useRef(null);
    const [kodePrintTabel, setKodePrintTabel] = useState(null);
    const [barcodeDialog, setBarcodeDialog] = useState(false);
    const [deletePrintBarcodeDialog, setDeletePrintBarcodeDialog] = useState(false);
    const [deleteBarcodeDialog, setDeleteBarcodeDialog] = useState(false);
    const [deleteBarcodeInDialog, setDeleteBarcodeInDialog] = useState(false);
    const [kodeDialog, setKodeDialog] = useState(false);
    const [kodePrintDialog, setKodePrintDialog] = useState(false);
    const [status, setStatus] = useState(0);
    const [printBarcode, setPrintBarcode] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingEdit, setLoadingEdit] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const [barcodeTabel, setBarcodeTabel] = useState(null);
    const [barcodeTabelFilt, setBarcodeTabelFilt] = useState(null);
    const [barcodeTabelAll, setBarcodeTabelAll] = useState(null);
    const [barcodeTambah, setBarcodeTambah] = useState(null);
    const [isUpdateMode, setIsUpdateMode] = useState(false);
    const [namaKode, setNamaKode] = useState('');
    const [priceTagTabel, setPriceTagTabel] = useState([]);
    const [keteranganBarcode, setKeteranganBarcode] = useState('');
    const [keteranganBarcodePrint, setKeteranganBarcodePrint] = useState('');
    const [selectedRow, setSelectedRow] = useState(null);
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [search, setSearch] = useState('');
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [pdfUrl, setPdfUrl] = useState('');
    const [barcode, setBarcode] = useState([]);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });
    const itemsSkelaton = Array.from({ length: 2 }, (v, i) => i);
    const columns = [
        { field: 'KODE', header: 'KODE' },
        { field: 'NAMA', header: 'NAMA' },
        { field: 'BARCODE', header: 'BARCODE' },
        { field: 'KETERANGAN', header: 'KETERANGAN' }
    ];

    const op = useRef(null);

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
        setBarcodeTabelFilt(barcodeTabel);
    }, [barcodeTabel, lazyState]);

    const loadLazyData = async () => {
        setLoading(true);
        let requestBody = { ...lazyState };
        try {
            const vaTable = await postData(apiEndPointGet, requestBody);
            const jsonBarcode = vaTable.data;
            setTotalRecords(jsonBarcode.total_data);
            setBarcodeTabel(jsonBarcode.data);
        } catch (error) {
            let e = error?.response?.data || error;
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: e?.message || 'Terjadi Kesalahan', life: 3000 });
        } finally {
            setLoading(false);
        }
    };
    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [produkDialog, setProdukDialog] = useState(false);
    const [dataProduk, setDataProduk] = useState('');
    const btnProduk = () => {
        setProdukDialog(true);
    };
    const handleProduk = (dataProduk) => {
        setDataProduk(dataProduk);
        console.log(dataProduk);
        const kode = dataProduk.KODE;
        const nama = dataProduk.NAMA;
        onRowSelectBarcode(kode);
        setBarcode((prevBarcode) => ({
            ...prevBarcode,
            KODE: kode,
            NAMA: nama
        }));
    };

    // -----------------------------------------------------------------------------------------------------------------< Print Barcode >
    const [printBarcodeDialog, setPrintBarcodeDialog] = useState(false);
    const [dataPrint, setDataPrint] = useState('');
    const btnPrintBarcode = () => {
        setPrintBarcodeDialog(true);
    };
    const handlePrintBarcode = (dataPrintBarcode) => {
        setDataPrint(dataPrintBarcode);
        console.log(dataPrintBarcode);
    };
    const onRowSelectBarcode = async (kode) => {
        let requestBody = {
            KODE: kode
        };
        console.log(requestBody);
        try {
            const vaTable = await postData(apiEndPointSelect, requestBody);
            const json = vaTable.data;
            console.log(json);
            setBarcodeTambah(json);
        } catch (error) {
            console.error('Error fetching barcode data:', error);
        }
    };

    // ------------
    const toggleKodePrint = async (event) => {
        let indeks = null;
        let skipRequest = false;

        setKodePrintDialog(true);
        setActiveIndex(event.index ?? 0);
        setLoadingItem(true);
        if (skipRequest === false) {
            const resKode = await dataTableKode(indeks);
            setKodePrintTabel(resKode.data);
            // updateStateKode(indeks,resKode);
        }
        setLoadingItem(false);
    };

    const togglePrintBarcode = async (event) => {
        setPrintBarcodeDialog(true);
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        setBarcode([]);
        setSubmitted(false);
        setBarcodeDialog(true);
        setIsButtonActive(false);
        setIsUpdateMode(false);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setNull();
        setBarcodeTambah([]);
        setBarcodeDialog(false);
    };

    const hideDeleteBarcodeDialog = () => {
        setDeleteBarcodeDialog(false);
    };

    const hideDeleteBarcodeInDialog = () => {
        setDeleteBarcodeInDialog(false);
    };
    const hideKodeDialog = () => {
        setKodeDialog(false);
    };

    const hideBarcodePrintDialog = () => {
        setNull();
        setPriceTagTabel([]);
        setPrintBarcodeDialog(false);
    };

    // ----------------------------------------------------------------------------------------------------------------- Datatable
    const dataTablePrintBarcode = (id) => {
        return new Promise((resolve) => {
            setPrintBarcodeDialog(true);
        });
    };

    const onInputChangeBarcode = (e, field) => {
        const { checked } = e.target;
        const value = checked ? 1 : 0; // Jika checkbox dicentang, nilai menjadi 1; jika tidak, menjadi 0
        console.log('status', value);
        setStatus(value);
        setBarcode((prevBarcode) => ({
            ...prevBarcode,
            STATUS: value
        }));
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || '';
        let _barcode = { ...barcode };
        _barcode[name] = val;
        setBarcode(_barcode);
        // console.log(status); // This will show the current value of status
    };

    const dataTableKode = (KODE) => {
        return new Promise((resolve) => {
            return fetch('/api/barcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-ACTION': 'get' },
                body: JSON.stringify({ KODE: KODE })
            })
                .then((result) => result.json())
                .then((body) => {
                    return resolve(body);
                }); //footer={golonganDialogFooter}
        });
    };

    // ---------------------------------------------------------------------------------------------------------------- func CRUD

    const confirmDeleteBarcode = (barcode) => {
        setBarcode(barcode);
        setDeleteBarcodeDialog(true);
    };
    const confirmDeleteInDialog = (barcode) => {
        console.log('hai', barcode);
        setBarcode(barcode);
        setDeleteBarcodeInDialog(true);
    };

    const setNull = () => {
        setKeteranganBarcode('');
        setKeteranganBarcodePrint('');
        setBarcode({
            // KODE: "",
            // KODE_TOKO: "",
            // NAMA: "",
            BARCODE: '',
            KETERANGAN: '',
            STATUS: false
        });
        setPrintBarcode({
            KODE_TOKO: '',
            NAMA: '',
            HJ: '',
            JUMLAH: ''
        });
    };
    const confirmDeleteSelected = () => {
        setDeleteBarcodeDialog(true);
    };

    const deleteBarcode = async () => {
        let requestBody = {
            KODE: barcode.KODE
        };
        // return console.log(requestBody);
        const vaTable = await postData(apiEndPointDelete, requestBody);
        let data = vaTable.data;
        if (data.code === '200') {
            toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Dihapus', life: 3000 });
            setBarcodeTambah([]);
            setDeleteBarcodeDialog(false);
            refreshTabel();
        } else {
            toast.current.show({ severity: 'error', summary: data.message, detail: 'Kesalahan Proses', life: 3000 });
        }
        // if (data.status === "success") {
        // 	toast.current.show({ severity: "success", summary: "Successful", detail: "Data Berhasil Dihapus", life: 3000 });
        // 	setBarcodeTambah([]);
        // 	setDeleteBarcodeDialog(false);
        // 	refreshTabel();
        // } else {
        // 	toast.current.show({ severity: "error", summary: "Error", detail: "Data Gagal Dihapus", life: 3000 });
        // }
    };
    //delete per row di tabel dialog
    const deleteTambah = async (rowData) => {
        let requestBody = {
            KODE: rowData.KODE,
            BARCODE: rowData.BARCODE
        };
        // return console.log(requestBody);
        const vaTable = await postData(apiEndPointDeleteDialog, requestBody);
        let data = vaTable.data;
        if (data.status == 'success') {
            toast.current.show({ severity: 'success', summary: 'Successful', detail: 'Data Berhasil Dihapus', life: 3000 });
            const newData = barcodeTambah.filter((item) => item.BARCODE !== rowData.BARCODE);
            setBarcodeTambah(newData);
        } else {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Data Gagal Dihapus', life: 3000 });
        }
    };

    // print barcode
    const deleteBarcodeD = async () => {
        if (selectedRow) {
            const updatedTabel = barcodeTabel.slice();
            const selectedIndex = updatedTabel.findIndex((row) => row === selectedRow);
            // Jika indeks ditemukan, hapus baris dari updatedTabel
            if (selectedIndex !== -1) {
                updatedTabel.splice(selectedIndex, 1);
                setBarcodeTabel(updatedTabel);
            }

            setSelectedRow(null);
        }
    };

    const findIndexById = (BARCODE) => {
        let index = -1;
        for (let i = 0; i < barcodeTambah.length; i++) {
            if (barcodeTambah[i].BARCODE === BARCODE) {
                index = i;
                break;
            }
        }
        return index;
    };

    const saveBarcode = async (e) => {
        e.preventDefault();
        // let _barcodeTabel = [...barcodeTabel];
        let _barcodeTambah = [...barcodeTambah];
        let _barcode = { ...barcode };
        console.log(_barcode);
        if (_barcodeTambah.length === 0) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Data Masih Kosong', life: 3000 });
            return;
        }
        try {
            let endPoint;
            if (isUpdateMode) {
                endPoint = apiEndPointUpdate;
            } else {
                endPoint = apiEndPointStore;
            }
            const vaTable = await postData(endPoint, _barcode);
            let data = vaTable.data;
            console.log(data);
            // return;
            if (data.code === '200') {
                toast.current.show({ severity: 'success', summary: data.message, detail: 'Data Berhasil Tersimpan', life: 3000 });
                if (isUpdateMode) {
                    const index = findIndexById(barcode.BARCODE);
                    _barcodeTambah[index].KETERANGAN = _barcode.KETERANGAN;
                    setBarcodeTambah(_barcodeTambah);
                    setBarcode([]);
                } else {
                    // Tampil di Tabel bawahnya
                    const data = {
                        KODE: barcode.KODE,
                        NAMA: barcode.NAMA,
                        BARCODE: barcode.BARCODE,
                        KETERANGAN: barcode.KETERANGAN,
                        STATUS: barcode.STATUS
                    };
                    const updateData = [...barcodeTambah];
                    updateData.push(data);
                    setBarcodeTambah(updateData);
                    // setBarcodeDialog(false);
                }
                setBarcode((prevBarcode) => ({
                    ...prevBarcode,
                    BARCODE: '',
                    KETERANGAN: ''
                }));
            } else if (data.code === '409') {
                toast.current.show({ severity: 'error', summary: data.message, detail: 'Kode Tidak Boleh Sama', life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: data.message, detail: data.messageValidator, life: 3000 });
            }
            // if (data.status === "success") {
            //     if (isUpdateMode) {
            //         const index = findIndexById(barcode.BARCODE);
            //         _barcodeTambah[index].KETERANGAN = _barcode.KETERANGAN;
            //         setBarcodeTambah(_barcodeTambah);
            // 		setBarcode([]);
            // 	} else {
            // 		// Tampil di Tabel bawahnya
            // 		const data = {
            //             KODE: barcode.KODE,
            // 			NAMA: barcode.NAMA,
            // 			BARCODE: barcode.BARCODE,
            // 			KETERANGAN: barcode.KETERANGAN,
            // 			STATUS: barcode.STATUS,
            // 		};
            // 		const updateData = [...barcodeTambah];
            // 		updateData.push(data);
            // 		setBarcodeTambah(updateData);
            //         // setBarcodeDialog(false);
            // 	}
            //     toast.current.show({ severity: "success", summary: "Successful", detail: "Data Berhasil Disimpan", life: 3000 });
            //     setBarcode((prevBarcode) => ({
            //         ...prevBarcode,
            //         BARCODE: '',
            //         KETERANGAN: '',
            //     }));
            // } else {
            // 	toast.current.show({ severity: "error", summary: "Error Message", detail: "error", life: 3000 });
            // }
        } catch (error) {
            console.error(error);
        }
    };

    const editBarcode = async (barcode) => {
        console.log('param', barcode);
        setIsUpdateMode(true);
        setBarcodeDialog(true);
        setBarcode({ ...barcode });
        let requestBody = {
            KODE: barcode.KODE
        };
        try {
            const vaTable = await postData(apiEndPointGetDataEdit, requestBody);
            const json = vaTable.data;
            console.log(json);
            setBarcodeTambah(json);
            // setBarcodeTambah((prevBarcode) => ({
            //     ...prevBarcode,
            //     NAMA: barcode.NAMA
            // }));
        } catch (error) {
            console.error('Error fetching barcode data:', error);
        }
    };

    const editBarcodembuh = async (barcode) => {
        setIsButtonActive(false);
        setBarcode({ ...barcode });
        setLoadingEdit(true);
        setBarcodeDialog(true);
        setIsUpdateMode(true);
        // console.log(barcode);
        barcode = barcode.KODE;
        const getEditResponse = await fetch('/api/barcode/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-ACTION': 'getEdit' },
            body: JSON.stringify({ KODE: barcode })
        })
            .then((result) => result.json())
            .then((json) => {
                return json;
            });
        setBarcodeTambah(getEditResponse);
        console.log(barcodeTambah);
        // setBarcode(getEditResponse);
        setLoadingEdit(false);
    };

    const onRowSelectBarcodeTambah = (event) => {
        const selectedBarcode = event.data.BARCODE;
        const selectedBarcodeData = barcodeTambah.find((barcode) => barcode.BARCODE === selectedBarcode);
        console.log('selectedBarcodeData', selectedBarcodeData);
        if (selectedBarcodeData) {
            setBarcode((prevData) => ({
                ...prevData,
                KODE: selectedBarcodeData.KODE,
                //   NAMA: selectedBarcodeData.stock.NAMA,
                NAMA: selectedBarcodeData.stock ? selectedBarcodeData.stock.NAMA : '',
                BARCODE: selectedBarcodeData.BARCODE,
                KETERANGAN: selectedBarcodeData.KETERANGAN,
                STATUS: selectedBarcodeData.STATUS
            }));
        }
        // setStatus(selectedBarcodeData.STATUS);
        setIsButtonActive(true);
        // setKodePrintDialog(false);
    };

    const onRowSelectKodePrint = (event) => {
        const selectedKode = event.data.KODE;
        const selectedBarcode = barcodeTabel.find((barcode) => barcode.KODE === selectedKode);

        if (selectedBarcode) {
            setInputData((prevData) => ({
                ...prevData,
                KODE_TOKO: selectedBarcode.KODE_TOKO,
                NAMA: selectedBarcode.NAMA
            }));
        }
        setKeteranganBarcodePrint(selectedBarcode.NAMA);
        setKodePrintDialog(false);
    };

    const onRowSelectKode = (event) => {
        setLoadingEdit(true);
        const selectedKode = event.data.KODE;
        const selectedBarcode = barcodeTabel.find((barcode) => barcode.KODE === selectedKode);
        // console.log('selectedBarcode '+event.data.NAMA);

        if (selectedBarcode) {
            setBarcode((prevData) => ({
                ...prevData,
                KODE: selectedBarcode.KODE,
                NAMA: selectedBarcode.NAMA
                //   NAMA: event.data.NAMA,
            }));
        }
        setKeteranganBarcode(selectedBarcode.NAMA);
        setKodeDialog(false);

        // Panggil fungsi onRowSelectedSelectBarcode di sini
        onRowSelectedSelectBarcode(selectedBarcode);
    };
    const onRowSelectedSelectBarcode = async (selectedBarcode) => {
        const selectResponse = await fetch('/api/barcode/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-ACTION': 'select' },
            body: JSON.stringify(selectedBarcode)
        })
            .then((result) => result.json())
            .then((json) => {
                return json;
            });
        setBarcodeTambah(selectResponse);
        // console.log('->' +selectResponse);
        setLoadingEdit(false);
    };

    const onRowSelectPriceTagList = (event) => {
        setSelectedRow(event.data);
    };
    // ----------------------------------------------------------------------------------------------------------------- Button
    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="New" icon="pi pi-plus" className="p-button-success mr-2" onClick={openNew} />
                    {/* <Button label="Delete" icon="pi pi-trash" className="p-button-danger" onClick={confirmDeleteSelected} readOnly={!selectedbanks || !selectedbanks.length} /> */}
                </div>
            </React.Fragment>
        );
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (barcodeTabel.length == 0 || !barcodeTabel) {
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
            const barcodeTabelPDF = barcodeTabelFilt ? JSON.parse(JSON.stringify(barcodeTabelFilt)) : [];

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

            if (!barcodeTabelPDF || barcodeTabelPDF.length === 0) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Master Barcode';
            const periodeLaporan = '';
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = barcodeTabelPDF.map((item) => [item.KODE, item.NAMA]);

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
        exportToXLSX(barcodeTabelFilt, 'master-barcode.xlsx');
    };

    const previewBarcode = () => {
        return (
            <React.Fragment>
                <div className="my-2">{/* <Button label="Preview" icon="pi pi-file-o" outlined className="p-button-secondary p-button-sm mr-2" /> */}</div>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                    <Button label="Print Barcode" icon="pi pi-print" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnPrintBarcode} />
                </div>
            </React.Fragment>
        );
    };

    const barcodeDialogFooter = (
        <>
            {/* <Button label="Delete" icon="pi pi-times" className="p-button-text" disabled={!isUpdateMode} onClick={confirmDeleteInDialog} /> */}
            <Button label="Batal" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
            <Button label="Simpan" icon="pi pi-check" className="p-button-text" onClick={saveBarcode} />
        </>
    );

    const deleteBarcodeInDialogFooter = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" severity="danger" rounded onClick={() => deleteTambah(rowData)} />
            </>
        );
    };
    // button delete di tabel luar
    const deleteBarcodeDialogFooter = (
        <>
            <Button label="No" icon="pi pi-times" className="p-button-text" onClick={hideDeleteBarcodeDialog} />
            <Button label="Yes" icon="pi pi-check" className="p-button-text" onClick={deleteBarcode} />
        </>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-pencil" severity="success" rounded className="mr-2" onClick={() => editBarcode(rowData)} />
                <Button icon="pi pi-trash" severity="warning" rounded onClick={() => confirmDeleteBarcode(rowData)} />
            </>
        );
    };

    const allData = async () => {
        const vaData = await postData(apiEndPointGet);
        const data = vaData.data;
        setBarcodeTabelAll(data.data);
    };

    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'KETERANGAN', label: 'NAMA' }
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
            filtered = barcodeTabel.filter((d) => (x ? x.test(d.KODE) || x.test(d.NAMA) : []));
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = barcodeTabel;
            } else {
                filtered = barcodeTabel.filter((d) => (x ? x.test(d.KODE) : []));
            }
        }

        setBarcodeTabelFilt(filtered);
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
                    <h4>Menu Barcode</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

                    <DataTable
                        value={barcodeTabelFilt}
                        size="small"
                        dataKey="KODE"
                        paginator
                        className="datatable-responsive"
                        totalRecords={totalRecords}
                        loading={loading}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        header={headerSearch}
                        filters={lazyState.filters}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        onPage={onPage}
                        emptyMessage="Data Kosong"
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="KETERANGAN"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate}></Column>
                    </DataTable>
                    <Toolbar className="mb-4" left={previewBarcode}></Toolbar>

                    {/* Dialog Tambah edit Barcode */}
                    <Dialog visible={barcodeDialog} style={{ width: '75%' }} header="Dialog Barcode" modal className="p-fluid" footer={barcodeDialogFooter} onHide={hideDialog}>
                        <div className="formgrid grid">
                            <div className="field col-6 mb-2 lg:col-6">
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="kode">Kode</label>
                                        <div className="p-inputgroup">
                                            <InputText readOnly id="kode" value={barcode.KODE} onChange={(e) => onInputChange(e, 'KODE')} />
                                            <Button disabled={isUpdateMode} icon="pi pi-search" className="p-button" onClick={btnProduk} />
                                        </div>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-6">
                                        <label htmlFor="nama">Nama</label>
                                        {/* <div className="p-inputgroup">{isUpdateMode ? <InputText id="nama" value={barcode.NAMA} readOnly onChange={(e) => onInputChangeBarcode(e, "NAMA")}  /> : <InputText readOnly value={keteranganBarcode} />}</div> */}
                                        <div className="p-inputgroup">
                                            <InputText id="nama" readOnly={isUpdateMode} value={barcode.NAMA} onChange={(e) => onInputChange(e, 'NAMA')} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="field col-6 mb-2 lg:col-6">
                                <div className="formgrid grid">
                                    <div className="field col-12 mb-2 lg:col-9">
                                        <label htmlFor="barcode">Barcode</label>
                                        <div className="p-inputgroup">
                                            <InputText id="barcode" readOnly={isUpdateMode} value={barcode.BARCODE} onChange={(e) => onInputChange(e, 'BARCODE')} autoFocus />
                                        </div>
                                    </div>
                                    <div className="field col-12 mb-2 lg:col-3">
                                        <label htmlFor="status">Status</label>
                                        <div className="p-inputgroup">
                                            <Checkbox inputId="status" checked={isUpdateMode ? barcode.STATUS === '1' : status === 1} onChange={(e) => onInputChangeBarcode(e, 'STATUS')} style={{ marginRight: '5px' }} />
                                            <label htmlFor="status">Aktif</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="field col-12 mb-2 lg:col-12">
                                <label htmlFor="keterangan">Keterangan</label>
                                <div className="p-inputgroup">
                                    <InputText id="keterangan" value={barcode.KETERANGAN} onChange={(e) => onInputChange(e, 'KETERANGAN')} required />
                                </div>
                            </div>
                        </div>
                        <div className="mt-2">
                            <DataTable
                                value={barcodeTambah}
                                size="small"
                                lazy
                                dataKey="KODE"
                                rows={10}
                                loading={loadingEdit}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                onRowSelect={onRowSelectBarcodeTambah}
                                selectionMode={isUpdateMode ? 'single' : null} // Memungkinkan pemilihan satu baris
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field={isUpdateMode ? 'stock.NAMA' : 'NAMA'} header="NAMA" />
                                <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KETERANGAN" header="KETERANGAN"></Column>
                                {isUpdateMode ? <Column headerStyle={{ textAlign: 'center' }} field="ACTION" header="ACTION" body={deleteBarcodeInDialogFooter}></Column> : null}
                            </DataTable>
                        </div>
                    </Dialog>
                    <Produk produkDialog={produkDialog} setProdukDialog={setProdukDialog} btnProduk={btnProduk} handleProduk={handleProduk} />

                    {/* Dialog Kode Barcode Print*/}
                    <Dialog visible={kodePrintDialog} style={{ width: '75%' }} header="Kode Barcode" modal onHide={hideKodeDialog}>
                        {loadingItem && <TabelSkaleton items={itemsSkelaton} kolom={columns} />}
                        {!loadingItem && (
                            <DataTable
                                value={kodePrintTabel}
                                lazy
                                dataKey="KODE"
                                // paginator
                                rows={10}
                                onRowSelect={onRowSelectKodePrint}
                                className="datatable-responsive"
                                first={lazyState.first}
                                totalRecords={totalRecords}
                                onPage={onPage}
                                loading={loading}
                                selectionMode="single" // Memungkinkan pemilihan satu baris
                                size="small"
                            >
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="KODE_TOKO" header="KODE TOKO"></Column>
                                <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                                {/* <Column headerStyle={{ textAlign: "center" }} header="ACTION" body={actionBodyTemplate}></Column> */}
                            </DataTable>
                        )}
                    </Dialog>

                    <PrintBarcode
                        printBarcodeDialog={printBarcodeDialog}
                        hideBarcodePrintDialog={hideBarcodePrintDialog}
                        deletePrintBarcodeDialog={deletePrintBarcodeDialog}
                        printBarcode={printBarcode}
                        setPrintBarcode={setPrintBarcode}
                        priceTagTabel={priceTagTabel}
                    />

                    {/* Dialog In Delete */}
                    <Dialog visible={deleteBarcodeInDialog} header="Confirm" modal footer={deleteBarcodeInDialogFooter} onHide={hideDeleteBarcodeInDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {barcode && (
                                <span>
                                    are you sure you want to delete <strong>{barcode.KODE}</strong>
                                </span>
                            )}
                        </div>
                    </Dialog>

                    {/* Dialog Delete */}
                    <Dialog visible={deleteBarcodeDialog} header="Confirm" modal footer={deleteBarcodeDialogFooter} onHide={hideDeleteBarcodeDialog}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {barcode && (
                                <span>
                                    are you sure you want to delete <strong>{barcode.KODE}</strong>
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

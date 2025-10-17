import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';

import { useRouter } from 'next/router';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Row } from 'primereact/row';
import { convertToISODate, formatDate, formatRibuan, getEmail, getUserName, showError } from '../../../../component/GeneralFunction/GeneralFunction';

import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import Gudang from '../../../component/gudang';
import Supervisor from '../../../component/supervisor';
import UserKasir from '../../../component/userKasir';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../../component/PDFViewer';
import jsPDF from 'jspdf';
import { addPageInfo, Footer, HeaderLaporan } from '../../../../component/exportPDF/exportPDF';
export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {}
    };
}
export default function MasterLapDaftarPenjualan() {
    const apiEndPointGet = '/api/laporan/daftar-penjualan/get';
    const apiEndPointGetDataByFaktur = '/api/laporan/daftar-penjualan/getdata_byfaktur';
    const router = useRouter();
    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [tampilkanDataRetur, setTampilkanDataRetur] = useState(false);
    const [lapDaftarPenjualan, setLapDaftarPenjualan] = useState(null);
    const [lapDaftarPenjualanTabel, setLapDaftarPenjualanTabel] = useState([]);
    const [lapDaftarPenjualanTabelFilt, setLapDaftarPenjualanTabelFilt] = useState([]);
    const [lapDaftarPenjualanTabelDetail, setLapDaftarPenjualanTabelDetail] = useState([]);
    const [lapDaftarPenjualanDialog, setLapDaftarPenjualanDialog] = useState(false);
    const [search, setSearch] = useState('');

    const [totalRecords, setTotalRecords] = useState(0);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const [defaultOption, setDropdownValue] = useState(null);
    const dropdownValues = [
        // { name: 'NAMA', label: 'NAMA' },
        // { name: 'KODE', label: 'KODE' },
        // { name: 'BARCODE', label: 'BARCODE' },
        { name: 'FAKTUR', label: 'FAKTUR' }
    ];
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
    // const onPage = (event) => {
    //     setlazyState(event);
    //     setFirst(event.first); // Mengatur halaman saat halaman berubah
    //     setRows(event.rows); // Mengatur jumlah baris per halaman
    // };
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    // -----------------------------------------------------------------------------------------------------------------< Handle Calendar >
    const handleStartDateChange = (e) => {
        setStartDate(e.value);
    };
    const handleEndDateChange = (e) => {
        setEndDate(e.value);
    };

    const [resetState, setResetState] = useState(false); // Tambahkan state ini

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        setLapDaftarPenjualanTabelFilt(lapDaftarPenjualanTabel);
    }, [lapDaftarPenjualanTabel, lazyState]);

    const loadLazyData = async () => {
        try {
            setLoading(true);
            const requestBody = {
                ...lazyState,
                START_DATE: convertToISODate(startDate),
                END_DATE: convertToISODate(endDate),
                GUDANG: lapDaftarPenjualan?.GUDANG || gudangKode,
                KASIR: lapDaftarPenjualan?.USERKASIR || userKasirKode,
                SUPERVISOR: lapDaftarPenjualan?.SUPERVISOR || supervisorKode,
                STATUS: tampilkanDataRetur === 1 ? 1 : 0
            };
            console.log('requestBody', requestBody);
            // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            console.log('json', json.data);
            setTotalRecords(json.total_data);

            // let dataArray = json.data;
            // if (!Array.isArray(dataArray)) {
            //     // Jika dataArray bukan array, ubah menjadi array dengan satu elemen
            //     dataArray = Object.values(dataArray);
            // }
            // console.log('dataArray', dataArray);
            // // return;
            // // setLapDaftarPenjualanTabel(dataArray);
            // const filteredDataArray = dataArray.filter(data => {
            //     if (tampilkanDataRetur) {
            //       return data.INDIKASI_FAKTUR === "KODESESI_RETUR";
            //     } else {
            //       return data.INDIKASI_FAKTUR === "KODESESI";
            //     }
            //   });
            //   console.log('filteredDataArray', filteredDataArray);
            setLapDaftarPenjualanTabel(json.data);
        } catch (error) {
            // Tangani error dengan sesuai, misalnya tampilkan pesan kesalahan
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (e) => {
        setTampilkanDataRetur(e.target.checked ? 1 : 0);
    };

    const reset = () => {
        setLoading(true);
        setStartDate(new Date());
        setEndDate(new Date());
        setLapDaftarPenjualan(null);
        setLapDaftarPenjualanTabel([]);
        setGudangKode('');
        setGudangKet('');
        setUserKasirKode('');
        setUserKasirKet('');
        setSupervisorKode('');
        setSupervisorKet('');
        setTampilkanDataRetur(false);
        setlazyState({
            ...lazyState,
            START_DATE: new Date(),
            END_DATE: new Date(),
            GUDANG: null,
            KASIR: null,
            SUPERVISOR: null,
            filters: {}
        });
        setResetState((prev) => !prev);
        setLoading(false);
    };

    const refresh = () => {
        setLoading(true);
        if (startDate && endDate) {
            const updatedLazyState = {
                ...lazyState,
                START_DATE: startDate,
                END_DATE: endDate,
                GUDANG: lapDaftarPenjualan?.GUDANG || gudangKode,
                KASIR: lapDaftarPenjualan?.KASIR || userKasirKode,
                SUPERVISOR: lapDaftarPenjualan?.SUPERVISOR || supervisorKode
            };

            loadLazyData(updatedLazyState);
        } else {
            loadLazyData(lazyState);
        }
        setLoading(false);
    };

    // GUDANG: lapDaftarPenjualan.GUDANG || "",
    // KASIR: lapDaftarPenjualan.USERKASIR || "",
    // SPV: lapDaftarPenjualan.SPV || "",
    // -----------------------------------------------------------------------------------------------------------------< Gudang >
    const [gudangDialog, setGudangDialog] = useState(false);
    const [gudangKode, setGudangKode] = useState('');
    const [gudangKet, setGudangKet] = useState('');
    const btnGudang = () => {
        setGudangDialog(true);
    };
    const handleGudangData = (gudangKode, gudangKet) => {
        setGudangKode(gudangKode);
        setGudangKet(gudangKet);
        setLapDaftarPenjualan((prevLapDaftarPenjualan) => ({
            ...prevLapDaftarPenjualan,
            GUDANG: gudangKode
        }));
    };
    // -----------------------------------------------------------------------------------------------------------------< UserKasir >
    const [userKasirDialog, setUserKasirDialog] = useState(false);
    const [userKasirKode, setUserKasirKode] = useState('');
    const [userKasirKet, setUserKasirKet] = useState('');
    const btnUserKasir = () => {
        setUserKasirDialog(true);
    };
    const handleUserKasirData = (userKasirKode, userKasirKet) => {
        setUserKasirKode(userKasirKode);
        setUserKasirKet(userKasirKet);
        setLapDaftarPenjualan((prevLapDaftarPenjualan) => ({
            ...prevLapDaftarPenjualan,
            USERKASIR: userKasirKode
        }));
    };
    // -----------------------------------------------------------------------------------------------------------------< Supervisor >
    const [supervisorDialog, setSupervisorDialog] = useState(false);
    const [supervisorKode, setSupervisorKode] = useState('');
    const [supervisorKet, setSupervisorKet] = useState('');
    const btnSupervisor = () => {
        setSupervisorDialog(true);
    };
    const handleSupervisorData = (supervisorKode, supervisorKet) => {
        setSupervisorKode(supervisorKode);
        setSupervisorKet(supervisorKet);
        setLapDaftarPenjualan((prevLapDaftarPenjualan) => ({
            ...prevLapDaftarPenjualan,
            SUPERVISOR: supervisorKode
        }));
    };

    // -------------------------------------------------------------------------------------------------------------------- Dialog
    const openNew = () => {
        // setCustomer(emptycustomer);
        setSubmitted(false);
        // setStatusAction('store');
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const [faktur, setFaktur] = useState('');

    const detail = async (rowData) => {
        const { FAKTUR } = rowData;
        setLapDaftarPenjualanDialog(true);
        try {
            let requestBody = {
                FAKTUR: FAKTUR
            };
            setFaktur(requestBody.FAKTUR);
            const vaTable = await postData(apiEndPointGetDataByFaktur, requestBody);
            const json = vaTable.data;
            console.log('json dari update', json);
            setLapDaftarPenjualanTabelDetail(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };
    // ---------------------------------------------------------------------------------------------------------------- Button

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.name != null) {
            _lazyState['filters'][defaultOption.name] = value;
        }
        onPage(_lazyState);
    };
    const [timer, setTimer] = useState(null);
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            _lazyState['filters'] = {};
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };

    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                {/* <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" /> */}
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
            filtered = lapDaftarPenjualanTabel.filter((d) =>
                x
                    ? x.test(d.TGL) ||
                      x.test(d.FAKTUR) ||
                      x.test(d.KODE) ||
                      x.test(d.BARCODE) ||
                      x.test(d.NAMA) ||
                      x.test(d.GUDANG) ||
                      x.test(d.HARGA) ||
                      x.test(d.QTY) ||
                      x.test(d.SATUAN) ||
                      x.test(d.JUMLAH) ||
                      x.test(d.HP) ||
                      x.test(d.DISCOUNT) ||
                      x.test(d.PPN) ||
                      x.test(d.SELISIHJUAL) ||
                      x.test(d.KASIR) ||
                      x.test(d.SPV)
                    : []
            );
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = lapDaftarPenjualanTabel;
            } else {
                filtered = lapDaftarPenjualanTabel.filter((d) => (x ? x.test(d.KodeDiskon) : []));
            }
        }

        setLapDaftarPenjualanTabelFilt(filtered);
    };

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-file" severity="warning" rounded className="mr-2" onClick={() => detail(rowData)} />
            </>
        );
    };

    const footernya = () => {
        return (
            <React.Fragment>
                {/* <div className="my-2">
                    <Button label="Batal" icon="pi pi-times" outlined className="p-button-secondary p-button-sm mr-2"/>
                </div> */}
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                    {/* <Button label="Export Excel" icon="pi pi-print" outlined className="p-button-secondary p-button-sm mr-2" onClick={exportExcel} /> */}
                </div>
            </React.Fragment>
        );
    };
    // const totQty =
    //     lapDaftarPenjualanTabel.reduce((accumulator, item) => {
    //         const totQtyValue = parseFloat(item.QTY);
    //         return isNaN(totQtyValue) ? accumulator : accumulator + totQtyValue;
    //     }, 0) ?? 0;

    const totQty = lapDaftarPenjualanTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.QTY) || 0), 0);
    const totTotal = lapDaftarPenjualanTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.JUMLAH) || 0), 0);
    const totTotalHp = lapDaftarPenjualanTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.HP) || 0), 0);
    const totDiscount = lapDaftarPenjualanTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.DISCOUNT) || 0), 0);
    const totPpn = lapDaftarPenjualanTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.PPN) || 0), 0);
    const totSelisihJual = lapDaftarPenjualanTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.SELISIHJUAL) || 0), 0);

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={7} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`${totQty}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={2} footer={`Rp. ${formatRibuan(totTotal)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totTotalHp)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totDiscount)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totPpn)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totSelisihJual)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={3} />
            </Row>
        </ColumnGroup>
    );

    // ---------------------------------------------------------------------< Handle Excel >
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [marginTop, setMarginTop] = useState(10);
    const [marginLeft, setMarginLeft] = useState(10);
    const [marginRight, setMarginRight] = useState(10);
    const [marginBottom, setMarginBottom] = useState(10);
    const [tableWidth, setTableWidth] = useState(800);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [orientation, setOrientation] = useState('landscape');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');

    const exportExcel = () => {
        exportToXLSX(lapDaftarPenjualanTabelFilt, 'laporan-daftar-penjualan.xlsx');
    };

    const btnAdjust = () => {
        if (lapDaftarPenjualanTabelFilt.length == 0 || !lapDaftarPenjualanTabelFilt) {
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
            const defectaPDF = lapDaftarPenjualanTabelFilt ? JSON.parse(JSON.stringify(lapDaftarPenjualanTabelFilt)) : [];
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

            if (!defectaPDF || defectaPDF.length === 0) {
                // If the table is empty, add a message to the PDF
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text('Data Kosong', doc.internal.pageSize.width / 2, 60 + marginTopInMm - 10, { align: 'center' });

                // You can also add any other relevant information or styling for an empty table
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = 'Laporan Daftar Penjualan';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = defectaPDF.map((item) => [
                item.TGL,
                item.FAKTUR,
                item.KODE,
                item.NAMA,
                parseInt(item.HARGA).toLocaleString(),
                parseInt(item.QTY).toLocaleString(),
                item.SATUAN,
                parseInt(item.JUMLAH).toLocaleString(),
                parseInt(item.HP).toLocaleString(),
                parseInt(item.DISCOUNT).toLocaleString(),
                parseInt(item.PPN).toLocaleString(),
                parseInt(item.SELISIHJUAL).toLocaleString(),
                item.KASIR
            ]);
            tableData.push([
                '',
                '',
                '',
                '',

                'Total Items : ',
                parseInt(totQty).toLocaleString(),
                // parseInt().toLocaleString(),
                '',
                parseInt(totTotal).toLocaleString(),
                parseInt(totTotalHp).toLocaleString(),
                parseInt(totDiscount).toLocaleString(),
                parseInt(totPpn).toLocaleString(),
                parseInt(totSelisihJual).toLocaleString()
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['TANGGAL', 'FAKTUR', 'KODE', 'NAMA', 'HARGA', 'QTY', 'SATUAN', 'JUMLAH', 'TOTALHPP', 'DISCOUNT', 'PPN', 'SELISIH JUAL', 'KASIR']],
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
                    4: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right' },
                    9: { halign: 'right' },
                    10: { halign: 'right' },
                    11: { halign: 'right' }
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
            setLoadingPreview(false);
        } catch (error) {
            console.log(error);
            setLoadingPreview(false);
        }
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <h4>Laporan Daftar Penjualan</h4>
                    <hr />
                    <Toast ref={toast} />
                    <Panel header="Filter" toggleable>
                        <div className="formgrid grid">
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="gudang">Gudang</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="gudang_kode" value={gudangKode} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnGudang} />
                                    <InputText readOnly id="ket-Gudang" value={gudangKet} />
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="Kasir">Kasir</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="userKasir" value={userKasirKode} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnUserKasir} />
                                    <InputText readOnly id="ket-UserKasir" value={userKasirKet} />
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="supervisor">SPV</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="supervisor_kode" value={supervisorKode} />
                                    <Button icon="pi pi-search" className="p-button" onClick={btnSupervisor} />
                                    <InputText readOnly id="ket-Supervisor" value={supervisorKet} />
                                </div>
                            </div>
                        </div>
                        <div className="formgrid grid">
                            <div className="field col-6 mb-2 lg:col-8">
                                <label htmlFor="faktur">Periode</label>
                                <div className="p-inputgroup">
                                    <Calendar name="startDate" value={lapDaftarPenjualan?.START_DATE || startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                                    <Calendar name="endDate" value={lapDaftarPenjualan?.END_DATE || endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                                    <Button label="" icon="pi pi-calendar" className="p-button-primary mr-2" />
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2 mt-3">
                                <div className="p-inputgroup mt-2">
                                    <Checkbox id="tampilDataRetur" checked={tampilkanDataRetur === 1} onChange={handleCheckboxChange} />
                                    <label htmlFor="tampilDataRetur" className="ml-2">
                                        Tampil Data Retur
                                    </label>
                                </div>
                            </div>
                            <div className="field col-4 mb-2 lg:col-2 mt-2">
                                <div className="p-inputgroup mt-3">
                                    <Button label="Refresh" className="p-button-primary p-button-md w-full mr-1" onClick={refresh} />
                                    <Button label="Reset" className="p-button-primary p-button-md w-full" onClick={reset} />
                                </div>
                            </div>
                        </div>
                    </Panel>
                    <DataTable
                        value={lapDaftarPenjualanTabelFilt}
                        paginator
                        totalRecords={totalRecords}
                        loading={loading}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                        header={headerSearch}
                        filters={lazyState.filters}
                        emptyMessage="Data Kosong"
                        footerColumnGroup={footerGroup}
                        size="small"
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TANGGAL"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="FAKTUR" header="FAKTUR"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="GUDANG" header="GUDANG"></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="HARGA"
                            header="HARGA"
                            body={(rowData) => {
                                const value = rowData.HARGA ? parseInt(rowData.HARGA).toLocaleString() : 0;
                                return value;
                            }}
                            bodyStyle={{ textAlign: 'right' }}
                        ></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="QTY" header="QTY"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="SATUAN" header="SATUAN"></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="JUMLAH"
                            header="JUMLAH"
                            body={(rowData) => {
                                const value = rowData.JUMLAH ? parseInt(rowData.JUMLAH).toLocaleString() : 0;
                                return value;
                            }}
                            bodyStyle={{ textAlign: 'right' }}
                        ></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="HP"
                            header="HP"
                            body={(rowData) => {
                                const value = rowData.HP ? parseInt(rowData.HP).toLocaleString() : 0;
                                return value;
                            }}
                            bodyStyle={{ textAlign: 'right' }}
                        ></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="DISCOUNT"
                            header="DISCOUNT"
                            body={(rowData) => {
                                const value = rowData.DISCOUNT ? parseInt(rowData.DISCOUNT).toLocaleString() : 0;
                                return value;
                            }}
                            bodyStyle={{ textAlign: 'right' }}
                        ></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="PPN"
                            header="PPN"
                            body={(rowData) => {
                                const value = rowData.PPN ? parseInt(rowData.PPN).toLocaleString() : 0;
                                return value;
                            }}
                            bodyStyle={{ textAlign: 'right' }}
                        ></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="SELISIHJUAL"
                            header="SELISIH JUAL"
                            body={(rowData) => {
                                const value = rowData.SELISIHJUAL ? parseInt(rowData.SELISIHJUAL).toLocaleString() : 0;
                                return value;
                            }}
                            bodyStyle={{ textAlign: 'right' }}
                        ></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="KASIR" header="KASIR"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="SPV" header="SPV"></Column>
                        {/* <Column
                            headerStyle={{ textAlign: "center" }}
                            body={(rowData) => {
                                const value = rowData.sesijual ? rowData.sesijual.SUPERVISOR : rowData.sesijual_retur ? rowData.sesijual_retur.SUPERVISOR : '';
                                return value;
                            }}
                            header="SPV"
                        /> */}
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTemplate} bodyStyle={{ textAlign: 'center' }}></Column>
                    </DataTable>
                    <Toolbar className="mb-2" right={footernya}></Toolbar>

                    <Gudang gudangDialog={gudangDialog} setGudangDialog={setGudangDialog} btnGudang={btnGudang} handleGudangData={handleGudangData} />
                    <UserKasir userKasirDialog={userKasirDialog} setUserKasirDialog={setUserKasirDialog} btnUserKasir={btnUserKasir} handleUserKasirData={handleUserKasirData} />
                    <Supervisor supervisorDialog={supervisorDialog} setSupervisorDialog={setSupervisorDialog} btnSupervisor={btnSupervisor} handleSupervisorData={handleSupervisorData} />
                    {/* <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} excel={exportExcel}></AdjustPrintMarginLaporan> */}
                    {/* btnAdjust={btnAdjust}  handleAdjust={handleAdjust} */}

                    <Dialog visible={lapDaftarPenjualanDialog} style={{ width: '75%' }} header="Detail Penjualan " modal className="p-fluid" onHide={() => setLapDaftarPenjualanDialog(false)}>
                        <div className="formgrid grid">
                            <div className="field col-4 mb-2 lg:col-4">
                                <label htmlFor="gudang">FAKTUR</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="gudang_kode" value={faktur} />
                                </div>
                            </div>
                        </div>
                        <DataTable
                            value={lapDaftarPenjualanTabelDetail}
                            lazy
                            // dataKey="KODE"
                            // paginator
                            rows={10}
                            className="datatable-responsive"
                            first={lazyState.first}
                            totalRecords={totalRecords}
                            onPage={onPage}
                            loading={loading}
                            size="small"
                        >
                            <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="stock.NAMA" header="NAMA BARANG"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="QTY" header="QTY"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="SATUAN" header="SATUAN"></Column>
                            <Column headerStyle={{ textAlign: 'center' }} field="DISCOUNT" header="DISC %"></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="SELISIHJUAL"
                                header="HARGA"
                                body={(rowData) => {
                                    const value = rowData.HARGA ? parseInt(rowData.HARGA).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                            <Column
                                headerStyle={{ textAlign: 'center' }}
                                field="JUMLAH"
                                header="SUBTOTAL"
                                body={(rowData) => {
                                    const value = rowData.JUMLAH ? parseInt(rowData.JUMLAH).toLocaleString() : 0;
                                    return value;
                                }}
                                bodyStyle={{ textAlign: 'right' }}
                            ></Column>
                        </DataTable>
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

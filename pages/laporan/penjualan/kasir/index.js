import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import { Row } from 'primereact/row';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
// component/exportXLSX/exportXLSX
import { convertToISODate, formatDate, formatRibuan, getEmail, getUserName, showError } from '../../../../component/GeneralFunction/GeneralFunction';

import postData from '../../../../lib/Axios';
import { getSessionServerSide } from '../../../../utilities/servertool';
import Gudang from '../../../component/gudang';
import Supervisor from '../../../component/supervisor';
import UserKasir from '../../../component/userKasir';
import PDFViewer from '../../../../component/PDFViewer';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
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
export default function MasterLapKasir() {
    const apiEndPointGet = '/api/laporan/kasir/get';
    const apiEndPointGetDataByFaktur = '/api/laporan/kasir/getdata_byfaktur';
    const router = useRouter();
    const toast = useRef(null);
    const [submitted, setSubmitted] = useState(false);
    const [loadingPreview, setLoadingPreview] = useState(true);
    const [loading, setLoading] = useState(false);
    const [tampilkanDataRetur, setTampilkanDataRetur] = useState(false);
    const [lapKasir, setLapKasir] = useState(null);
    const [lapKasirTabel, setLapKasirTabel] = useState([]);
    const [lapKasirTabelFilt, setLapKasirTabelFilt] = useState([]);
    const [lapKasirTabelDetail, setLapKasirTabelDetail] = useState([]);
    const [lapKasirDialog, setLapKasirDialog] = useState(false);
    const [search, setSearch] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [marginTop, setMarginTop] = useState(10);
    const [marginLeft, setMarginLeft] = useState(10);
    const [marginRight, setMarginRight] = useState(10);
    const [marginBottom, setMarginBottom] = useState(10);
    const [tableWidth, setTableWidth] = useState(800);
    const [orientation, setOrientation] = useState('portrait');
    const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
    const [adjustDialog, setAdjustDialog] = useState(false);

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
    function handleShowPreview() {
        setShowPreview(true);
    }

    const [defaultOption, setDropdownValue] = useState(null);
    const dropdownValues = [
        { name: 'FAKTUR', label: 'FAKTUR' }
        // { name: 'FAKTURASLI', label: 'FAKTURASLI' },
        // { name: 'SUPPLIER', label: 'SUPPLIER' }
    ];
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
    }, [lazyState, resetState]);

    useEffect(() => {
        setLapKasirTabelFilt(lapKasirTabel);
    }, [lapKasirTabel, lazyState]);

    const loadLazyData = async () => {
        try {
            setLoading(true);
            const requestBody = {
                ...lazyState,
                START_DATE: convertToISODate(startDate),
                END_DATE: convertToISODate(endDate),
                GUDANG: lapKasir?.GUDANG || gudangKode,
                KASIR: lapKasir?.USERKASIR || userKasirKode,
                SUPERVISOR: lapKasir?.SUPERVISOR || supervisorKode,
                STATUS: tampilkanDataRetur === 1 ? 1 : 0
            };
            // const vaTable = await axios.post(apiDirPath, requestBody, { headers: header });
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);

            // let dataArray = json.data;
            // if (!Array.isArray(dataArray)) {
            //     // Jika dataArray bukan array, ubah menjadi array dengan satu elemen
            //     dataArray = Object.values(dataArray);
            // }
            // const filteredDataArray = dataArray.filter((data) => {
            //     if (tampilkanDataRetur) {
            //         return data.KODESESI_RETUR !== '';
            //     } else {
            //         return data.KODESESI !== '';
            //     }
            // });
            setLapKasirTabel(json.data);
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

    const refreshTabel = () => {
        let getLazyState = { ...lazyState };
        setlazyState(getLazyState);
    };

    const reset = () => {
        setLoading(true);
        setStartDate(new Date());
        setEndDate(new Date());
        setLapKasir(null);
        setLapKasirTabel([]);
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
                GUDANG: lapKasir?.GUDANG || gudangKode,
                KASIR: lapKasir?.KASIR || userKasirKode,
                SUPERVISOR: lapKasir?.SUPERVISOR || supervisorKode
            };

            loadLazyData(updatedLazyState);
        } else {
            loadLazyData(lazyState);
        }
        setLoading(false);
    };

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
        setLapKasir((prevLapKasir) => ({
            ...prevLapKasir,
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
        setLapKasir((prevLapKasir) => ({
            ...prevLapKasir,
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
        setLapKasir((prevLapKasir) => ({
            ...prevLapKasir,
            SUPERVISOR: supervisorKode
        }));
    };

    // -------------------------------------------------------------------------------------------------------------------- Func
    const detail = async (rowData) => {
        const { FAKTUR } = rowData;

        setLapKasirDialog(true);
        try {
            let requestBody = {
                FAKTUR: FAKTUR
            };
            const vaTable = await postData(apiEndPointGetDataByFaktur, requestBody);
            const json = vaTable.data;
            setLapKasirTabelDetail(json.data);
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        } finally {
            setLoading(false);
        }
    };
    // ---------------------------------------------------------------------------------------------------------------- Button

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

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.name != null) {
            _lazyState['filters'][defaultOption.name] = value;
        }
        onPage(_lazyState);
    };

    const filterPlugins = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = lapKasirTabel.filter((d) =>
                x
                    ? x.test(d.TGL) ||
                      x.test(d.FAKTUR) ||
                      x.test(d.GUDANG) ||
                      x.test(d.TOTAL) ||
                      x.test(d.TOTALHPP) ||
                      x.test(d.DISCOUNT) ||
                      x.test(d.PPN) ||
                      x.test(d.SELISIHJUAL) ||
                      x.test(d.PPN) ||
                      x.test(d.SELISIHJUAL) ||
                      x.test(d.KASIR) ||
                      x.test(d.SPV)
                    : []
            );
            setSearch(searchVal);
        } else {
            if (searchVal == 'all') {
                filtered = lapKasirTabel;
            } else {
                filtered = lapKasirTabel.filter((d) => (x ? x.test(d.FAKTUR) : []));
            }
        }

        setLapKasirTabelFilt(filtered);
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
                <div className="my-2 flex gap-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />

                    {/* <Button label="Export Excel" icon="pi pi-print" outlined className="p-button-secondary p-button-sm mr-2" onClick={exportExcel} /> */}
                    {/* <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} /> */}
                </div>
            </React.Fragment>
        );
    };

    const totTotal = lapKasirTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.TOTAL) || 0), 0);
    const totTotalHp = lapKasirTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.TOTALHPP) || 0), 0);
    const totDiscount = lapKasirTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.DISCOUNT) || 0), 0);
    const totPpn = lapKasirTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.PPN) || 0), 0);
    const totSelisihJual = lapKasirTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.SELISIHJUAL) || 0), 0);
    const totDonasi = lapKasirTabelFilt.reduce((accumulator, item) => accumulator + (parseFloat(item.DONASI) || 0), 0);

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={3} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totTotal)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totTotalHp)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totDiscount)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totPpn)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totDonasi)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totSelisihJual)}`} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={3} />
            </Row>
        </ColumnGroup>
    );

    // ---------------------------------------------------------------------< Handle Excel >
    const exportExcel = () => {
        exportToXLSX(lapKasirTabelFilt, 'laporan-penjualan-kasir.xlsx');
    };

    const btnAdjust = () => {
        if (lapKasirTabelFilt.length == 0 || !lapKasirTabelFilt) {
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
            const defectaPDF = lapKasirTabelFilt ? JSON.parse(JSON.stringify(lapKasirTabelFilt)) : [];

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

            const judulLaporan = 'Laporan Penjualan Kasir';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(startDate) + 's.d ' + formatDate(endDate);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = defectaPDF.map((item) => [
                item.TGL,
                item.FAKTUR,
                item.GUDANG,
                parseInt(item.TOTAL).toLocaleString(),
                parseInt(item.TOTALHPP).toLocaleString(),
                parseInt(item.DISCOUNT).toLocaleString(),
                parseInt(item.PPN).toLocaleString(),
                parseInt(item.DONASI).toLocaleString(),
                parseInt(item.SELISIHJUAL).toLocaleString(),
                item.KASIR
            ]);
            tableData.push([
                '',
                '',
                'Total Items : ',
                parseInt(totTotal).toLocaleString(),
                parseInt(totTotalHp).toLocaleString(),
                parseInt(totDiscount).toLocaleString(),
                parseInt(totPpn).toLocaleString(),
                parseInt(totDonasi).toLocaleString(),
                parseInt(totSelisihJual).toLocaleString()
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [['TANGGAL', 'FAKTUR', 'GUDANG', 'TOTAL', 'TOTALHPP', 'DISCOUNT', 'PPN', 'DONASI', 'SELISIH JUAL', 'KASIR']],
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
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                    5: { halign: 'right' },
                    6: { halign: 'right' },
                    7: { halign: 'right' },
                    8: { halign: 'right' }
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
                    <h4>Laporan Penjualan Kasir</h4>
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
                                <label htmlFor="userKasir">Kasir</label>
                                <div className="p-inputgroup">
                                    <InputText readOnly id="userKasir_kode" value={userKasirKode} />
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
                                    <Calendar name="startDate" value={lapKasir?.START_DATE || startDate} onChange={handleStartDateChange} placeholder="Start Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                                    <Calendar name="endDate" value={lapKasir?.END_DATE || endDate} onChange={handleEndDateChange} placeholder="End Date" readOnlyInput dateFormat="dd-mm-yy" style={{ width: '100px' }} />
                                    <Button label="" icon="pi pi-calendar" className="p-button-primary mr-2" />
                                </div>
                            </div>
                            <div className="field col-2 mb-2 lg:col-2 mt-3">
                                <div className="p-inputgroup mt-2">
                                    <Checkbox id="tampilDataRetur" className="mr-2" checked={tampilkanDataRetur === 1} onChange={handleCheckboxChange} />
                                    <label htmlFor="tampilDataRetur">Tampil Data Retur</label>
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
                        value={lapKasirTabelFilt}
                        filters={lazyState.filters}
                        header={headerSearch}
                        first={first} // Menggunakan nilai halaman pertama dari state
                        rows={rows} // Menggunakan nilai jumlah baris per halaman dari state
                        onPage={onPage} // Memanggil fungsi onPage saat halaman berubah
                        paginator
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Menampilkan {first} - {last} dari {totalRecords} data"
                        totalRecords={totalRecords}
                        size="small"
                        loading={loading}
                        emptyMessage="Data Kosong"
                        onRowsPerPageChange={(e) => setRowsPerPage(e.value)}
                        footerColumnGroup={footerGroup}
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL" header="TANGGAL"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="FAKTUR" header="FAKTUR"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="GUDANG" header="GUDANG"></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="TOTAL"
                            header="TOTAL"
                            body={(rowData) => {
                                const value = rowData.TOTAL ? parseInt(rowData.TOTAL).toLocaleString() : 0;
                                return value;
                            }}
                            bodyStyle={{ textAlign: 'right' }}
                        ></Column>
                        <Column
                            headerStyle={{ textAlign: 'center' }}
                            field="TOTALHPP"
                            header="TOTALHPP"
                            body={(rowData) => {
                                const value = rowData.TOTALHPP ? parseInt(rowData.TOTALHPP).toLocaleString() : 0;
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
                            field="DONASI"
                            header="DONASI"
                            body={(rowData) => {
                                const value = rowData.DONASI ? parseInt(rowData.DONASI).toLocaleString() : 0;
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

                    <Dialog visible={lapKasirDialog} style={{ width: '75%' }} header="Detail Penjualan " modal className="p-fluid" onHide={() => setLapKasirDialog(false)}>
                        <DataTable
                            value={lapKasirTabelDetail}
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

import { useRouter } from 'next/router';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { exportToXLSX } from '../../../../component/exportXLSX/exportXLSX';
import { convertToISODate, formatDate, formatRibuan, getEmail, getUserName, rupiahConverter, showError } from '../../../../component/GeneralFunction/GeneralFunction';
import postData from '../../../../lib/Axios';
import Supervisor from '../../../component/supervisor';
import UserKasir from '../../../component/userKasir';
import AdjustPrintMarginLaporan from '../../../component/adjustPrintMarginLaporan';
import PDFViewer from '../../../../component/PDFViewer';
import { addPageInfo, Footer, HeaderLaporan } from '../../../../component/exportPDF/exportPDF';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function MasterLapKasir() {
    const router = useRouter();
    const toast = useRef(null);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });

    const [state, setState] = useState({
        data: [],
        dataFiltered: [],
        searchVal: '',
        load: false,
        tglLaporan: [new Date(), new Date()],
        dataDetail: [],
        showDetail: false,
        dataFilter: {
            tipeLaporan: 'invoice',
            kasir: { kode: '', ket: '' },
            supervisor: { kode: '', ket: '' }
        }
    });

    const [dialogFilter, setDialogFilter] = useState({
        showSupervisor: false,
        showKasir: false
    });

    const [pdf, setPdf] = useState({
        uri: '',
        showDialog: false,
        showPreview: false
    });

    // API Handlers
    const loadData = async () => {
        try {
            setState((prev) => ({ ...prev, load: true }));

            const payload = {
                startDate: convertToISODate(state.tglLaporan[0]),
                endDate: convertToISODate(state.tglLaporan[1]),
                kasir: state.dataFilter.kasir.kode,
                supervisor: state.dataFilter.supervisor.kode,
                tipeLaporan: state.dataFilter.tipeLaporan
            };

            const response = await postData('/api/laporan/transaksi/get-all', payload);
            setState((prev) => ({
                ...prev,
                data: response.data.data,
                load: false
            }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
            setState((p) => ({
                ...p,
                load: false
            }));
        }
    };

    const setAdjustDialog = (bool) => {
        setPdf((p) => ({
            ...p,
            showDialog: bool
        }));
    };

    const handleKasirDialog = (bool) => {
        setDialogFilter((p) => ({ ...p, showKasir: bool }));
    };

    const handleSupervisorDialog = (bool) => {
        setDialogFilter((p) => ({ ...p, showSupervisor: bool }));
    };

    const btnUserKasir = () => {
        setDialogFilter((p) => ({ ...p, showKasir: true }));
    };
    const btnSupervisor = () => {
        setDialogFilter((p) => ({ ...p, showSupervisor: true }));
    };

    const filterData = (name, searchVal) => {
        const x = searchVal.length > 0 ? new RegExp(searchVal, 'i') : null;
        let filtered = [];

        if (name == 'search') {
            filtered = state?.data.filter((d) => (x ? x.test(d.kode) || x.test(d.kasir) || x.test(d.spv) || x.test(d.sesi_jual) : []));
            setState((p) => ({ ...p, searchVal }));
        } else {
            if (searchVal == 'all') {
                filtered = state?.data;
            } else {
                filtered = state?.data.filter((d) => (x ? x.test(d.kode) : []));
            }
        }

        setState((p) => ({ ...p, dataFiltered: filtered }));
    };

    const handleUserKasirData = (kode, ket) => {
        setState((p) => ({
            ...p,
            dataFilter: {
                ...p.dataFilter,
                kasir: { kode, ket }
            }
        }));
        console.log(kode, ket);
    };
    const handleSupervisorData = (kode, ket) => {
        setState((p) => ({
            ...p,
            dataFilter: {
                ...p.dataFilter,
                supervisor: { kode, ket }
            }
        }));
        console.log(kode, ket);
    };

    // Event Handlers
    const handleDateChange = (dates) => {
        setState((prev) => ({
            ...prev,
            tglLaporan: dates
        }));
    };

    const handleFilterChange = (type, value) => {
        setState((prev) => ({
            ...prev,
            dataFilter: {
                ...prev.dataFilter,
                [type]: value
            }
        }));
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        filterData('search', value);
    };

    // Action Handlers
    const handleReset = () => {
        setState((prev) => ({
            ...prev,
            tglLaporan: [new Date(), new Date()],
            dataFilter: {
                tipeLaporan: '',
                kasir: { kode: '', ket: '' },
                supervisor: { kode: '', ket: '' }
            },
            searchVal: ''
        }));
    };

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            dataFiltered: state.data
        }));
    }, [state.data]);

    const exportExcel = () => {
        exportToXLSX(state.dataFiltered, 'laporan-transaksi.xlsx');
    };

    const btnAdjust = () => {
        if (state.dataFiltered.length == 0 || !state.dataFiltered) {
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
            const defectaPDF = state.dataFiltered ? JSON.parse(JSON.stringify(state.dataFiltered)) : [];

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

            const judulLaporan = 'Laporan Transaksi';
            const periodeLaporan = 'Antara Tanggal ' + formatDate(state.tglLaporan[0]) + 's.d ' + formatDate(state.tglLaporan[1]);
            await HeaderLaporan({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            let tableData;
            let tableHead;

            if (state.dataFilter.tipeLaporan !== 'invoice') {
                // Hanya tampilkan kolom non-invoice
                tableData = defectaPDF.map((item, index) => [index + 1, item.tgl, item.kode, item.sesi_jual, parseInt(item.total_kamar).toLocaleString(), parseInt(item.dp).toLocaleString(), item.kasir]);
                tableData.push(['', '', '', 'Total Items : ', parseInt(totTotal).toLocaleString(), parseInt(totDp).toLocaleString()]);
                tableHead = ['NO', 'TANGGAL', 'FAKTUR', 'SESI', 'TOTAL KAMAR', 'DP', 'KASIR'];
            } else {
                // Tampilkan semua kolom, termasuk invoice, dan tambahkan baris total
                tableData = defectaPDF.map((item, index) => [
                    index + 1,
                    item.tgl,
                    item.kode,
                    item.sesi_jual,
                    parseInt(item.total_kamar).toLocaleString(),
                    parseInt(item.total_harga_real).toLocaleString(),
                    parseInt(item.dp).toLocaleString(),
                    parseInt(item.total_bayar_tersisa).toLocaleString(),
                    parseInt(item.bayar).toLocaleString(),
                    item.kasir
                ]);

                tableHead = ['NO', 'TANGGAL', 'FAKTUR', 'SESI', 'TOTAL KAMAR', 'HARGA REAL', 'DP', 'TOTAL BAYAR YANG TERSISA', 'BAYAR', 'KASIR'];

                tableData.push([
                    '',
                    '',
                    '',
                    'Total Items : ',
                    parseInt(totTotal).toLocaleString(),
                    parseInt(totHargaReal).toLocaleString(),
                    parseInt(totDp).toLocaleString(),
                    parseInt(totBayarTersisa).toLocaleString(),
                    parseInt(totBayar).toLocaleString()
                ]);
            }

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [tableHead],
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
            setPdf((p) => ({ ...p, uri: pdfDataUrl, showPreview: true }));
        } catch (error) {
            console.log(error);
            setPdf((p) => ({ ...p, showPreview: false }));
        }
    };

    // UI Components
    const actionBodyTemplate = (rowData) => (
        <Button
            icon="pi pi-file"
            severity="warning"
            rounded
            onClick={() =>
                setState((prev) => ({
                    ...prev,
                    showDetail: true,
                    dataDetail: rowData.kamar || []
                }))
            }
        />
    );

    const footernya = () => {
        return (
            <React.Fragment>
                <div className="my-2 flex gap-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        );
    };

    const totTotal = state.dataFiltered.reduce((accumulator, item) => accumulator + (parseFloat(item.total_kamar) || 0), 0);
    const totHargaReal = state.dataFiltered.reduce((accumulator, item) => accumulator + (parseFloat(item.total_harga_real) || 0), 0);
    const totDp = state.dataFiltered.reduce((accumulator, item) => accumulator + (parseFloat(item.dp) || 0), 0);
    const totBayarTersisa = state.dataFiltered.reduce((accumulator, item) => accumulator + (parseFloat(item.total_bayar_tersisa) || 0), 0);
    const totSisaBayar = state.dataFiltered.reduce((accumulator, item) => accumulator + (parseFloat(item.sisa_bayar) || 0), 0);
    const totBayar = state.dataFiltered.reduce((accumulator, item) => accumulator + (parseFloat(item.bayar) || 0), 0);

    let footerGroup = (
        <ColumnGroup>
            <Row>
                <Column headerStyle={{ textAlign: 'center' }} footer="Total:" colSpan={3} footerStyle={{ textAlign: 'right' }} />
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totTotal)}`} footerStyle={{ textAlign: 'right' }} />
                {state.dataFilter.tipeLaporan == 'invoice' ? <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totHargaReal)}`} footerStyle={{ textAlign: 'right' }} /> : ''}
                <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totDp)}`} footerStyle={{ textAlign: 'right' }} />
                {state.dataFilter.tipeLaporan == 'invoice' ? <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totBayarTersisa)}`} footerStyle={{ textAlign: 'right' }} /> : ''}
                {state.dataFilter.tipeLaporan == 'invoice' ? <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totSisaBayar)}`} footerStyle={{ textAlign: 'right' }} /> : ''}
                {state.dataFilter.tipeLaporan == 'invoice' ? <Column headerStyle={{ textAlign: 'center' }} colSpan={1} footer={`Rp. ${formatRibuan(totBayar)}`} footerStyle={{ textAlign: 'right' }} /> : ''}
                <Column headerStyle={{ textAlign: 'center' }} colSpan={3} />
            </Row>
        </ColumnGroup>
    );

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <h4>Laporan Transaksi</h4>

                    <Panel header="Filter" toggleable>
                        <div className="flex flex-column gap-2">
                            <div className="flex gap-2">
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="userKasir">Kasir</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly id="userKasir_kode" value={state.dataFilter.kasir.kode} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnUserKasir} />
                                        <InputText readOnly id="ket-UserKasir" value={state.dataFilter.kasir.ket} />
                                    </div>
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="supervisor">SPV</label>
                                    <div className="p-inputgroup">
                                        <InputText readOnly id="supervisor_kode" value={state.dataFilter.supervisor.kode} />
                                        <Button icon="pi pi-search" className="p-button" onClick={btnSupervisor} />
                                        <InputText readOnly id="ket-Supervisor" value={state.dataFilter.supervisor.ket} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 align-items-center">
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="faktur">Periode</label>
                                    <div className="p-inputgroup">
                                        <Calendar value={state.tglLaporan} onChange={(e) => handleDateChange(e.value)} selectionMode="range" dateFormat="dd/mm/yy" showIcon />
                                    </div>
                                </div>
                                <div className="flex flex-column gap-2 w-full">
                                    <label htmlFor="faktur">Tipe Laporan</label>
                                    <div className="p-inputgroup">
                                        <Dropdown
                                            options={['invoice', 'reservasi']}
                                            value={state.dataFilter.tipeLaporan}
                                            onChange={(e) => {
                                                const val = e.value;

                                                setState((p) => ({
                                                    ...p,
                                                    dataFilter: {
                                                        ...p.dataFilter,
                                                        tipeLaporan: val
                                                    }
                                                }));
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 flex-column">
                                    <label htmlFor="faktur">Action</label>
                                    <div className="p-inputgroup">
                                        <Button label="Refresh" className="p-button-primary p-button-md w-full mr-1" onClick={loadData} />
                                        <Button label="Reset" className="p-button-primary p-button-md w-full" onClick={handleReset} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Panel>

                    <DataTable
                        value={state.dataFiltered}
                        loading={state.load}
                        header={
                            <div className="flex justify-content-between">
                                <InputText placeholder="Search" value={state.searchVal} onChange={handleSearch} className="w-6" />
                            </div>
                        }
                        rows={10}
                        totalRecords={state.dataFiltered.length}
                        paginator
                        size="small"
                        footerColumnGroup={footerGroup}
                    >
                        <Column field="tgl" header="Tanggal" />
                        <Column field="kode" header="Faktur" />
                        <Column field="sesi_jual" header="Sesi Jual" />
                        <Column align={'right'} field="total_kamar" header="Total Kamar" body={(rowData) => rupiahConverter(rowData.total_kamar)}></Column>
                        {state.dataFilter.tipeLaporan == 'invoice' ? <Column align={'right'} field="total_harga_real" header="Total Harga Asli" body={(rowData) => rupiahConverter(rowData.total_harga_real)}></Column> : ''}
                        <Column align={'right'} field="dp" header="Total DP" body={(rowData) => rupiahConverter(rowData.dp)}></Column>
                        {state.dataFilter.tipeLaporan == 'invoice' ? <Column align={'right'} field="total_bayar_tersisa" header="Total Bayar Yang Tersisa" body={(rowData) => rupiahConverter(rowData.total_bayar_tersisa)}></Column> : ''}
                        {state.dataFilter.tipeLaporan == 'invoice' ? <Column align={'right'} field="sisa_bayar" header="Sisa Bayar" body={(rowData) => rupiahConverter(rowData.sisa_bayar)}></Column> : ''}
                        {state.dataFilter.tipeLaporan == 'invoice' ? <Column align={'right'} field="bayar" header="Bayar" body={(rowData) => rupiahConverter(rowData.bayar)}></Column> : ''}
                        <Column field="kasir" header="Kasir" />
                        <Column align={'right'} body={actionBodyTemplate} header="Aksi" />
                    </DataTable>
                    <Toolbar className="mb-2" end={footernya}></Toolbar>

                    <Dialog
                        visible={state.showDetail}
                        onHide={() => {
                            setState((prev) => ({
                                ...prev,
                                showDetail: false,
                                dataDetail: []
                            }));
                        }}
                    >
                        <DataTable value={state.dataDetail}>
                            <Column field="no_kamar" header="No Kamar"></Column>
                            <Column field="harga_kamar" header="Harga Kamar" body={(rowData) => rupiahConverter(rowData.harga_kamar)}></Column>
                            <Column field="cek_in" header="Checkin"></Column>
                            <Column field="cek_out" header="Checkout"></Column>
                        </DataTable>
                    </Dialog>

                    <Dialog
                        visible={pdf.showPreview}
                        onHide={() => {
                            setPdf((prev) => ({
                                ...prev,
                                showPreview: false
                            }));
                        }}
                    >
                        <div className="p-dialog-content">
                            <PDFViewer pdfUrl={pdf.uri} />
                        </div>
                    </Dialog>

                    <AdjustPrintMarginLaporan adjustDialog={pdf.showDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>

                    <UserKasir userKasirDialog={dialogFilter.showKasir} setUserKasirDialog={handleKasirDialog} btnUserKasir={btnUserKasir} handleUserKasirData={handleUserKasirData} />
                    <Supervisor supervisorDialog={dialogFilter.showSupervisor} setSupervisorDialog={handleSupervisorDialog} btnSupervisor={btnSupervisor} handleSupervisorData={handleSupervisorData} />
                </div>
            </div>
        </div>
    );
}

/*
 * Copyright (C) Godong
 *http://www.marstech.co.id
 *Email. info@marstech.co.id
 *Telp. 0811-3636-09
 *Office        : Jl. Margatama Asri IV, Kanigoro, Kec. Kartoharjo, Kota Madiun, Jawa Timur 63118
 *Branch Office : Perum Griya Gadang Sejahtera Kav. 14 Gadang - Sukun - Kota Malang - Jawa Timur
 *
 *Godong
 *Adalah merek dagang dari PT. Marstech Global
 *
 *License Agreement
 *Software komputer atau perangkat lunak komputer ini telah diakui sebagai salah satu aset perusahaan yang bernilai.
 *Di Indonesia secara khusus,
 *software telah dianggap seperti benda-benda berwujud lainnya yang memiliki kekuatan hukum.
 *Oleh karena itu pemilik software berhak untuk memberi ijin atau tidak memberi ijin orang lain untuk menggunakan softwarenya.
 *Dalam hal ini ada aturan hukum yang berlaku di Indonesia yang secara khusus melindungi para programmer dari pembajakan software yang mereka buat,
 *yaitu diatur dalam hukum hak kekayaan intelektual (HAKI).
 *
 *********************************************************************************************************
 *Pasal 72 ayat 3 UU Hak Cipta berbunyi,
 *' Barangsiapa dengan sengaja dan tanpa hak memperbanyak penggunaan untuk kepentingan komersial '
 *' suatu program komputer dipidana dengan pidana penjara paling lama 5 (lima) tahun dan/atau '
 *' denda paling banyak Rp. 500.000.000,00 (lima ratus juta rupiah) '
 *********************************************************************************************************
 *
 *Proprietary Software
 *Adalah software berpemilik, sehingga seseorang harus meminta izin serta dilarang untuk mengedarkan,
 *menggunakan atau memodifikasi software tersebut.
 *
 *Commercial software
 *Adalah software yang dibuat dan dikembangkan oleh perusahaan dengan konsep bisnis,
 *dibutuhkan proses pembelian atau sewa untuk bisa menggunakan software tersebut.
 *Detail Licensi yang dianut di software https://en.wikipedia.org/wiki/Proprietary_software
 *EULA https://en.wikipedia.org/wiki/End-user_license_agreement
 *
 *Lisensi Perangkat Lunak https://id.wikipedia.org/wiki/Lisensi_perangkat_lunak
 *EULA https://id.wikipedia.org/wiki/EULA
 *
 * Created on Mon Jun 03 2024 - 06:48:18
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Toast } from "primereact/toast";
import { getSessionServerSide } from "../../../../utilities/servertool";
import React, { useEffect, useRef, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import { formatDatePdf, formatDateTable, getEmail, getNamaBulan, getTglTransaksi, getUserName } from "../../../../component/GeneralFunction/GeneralFunction";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import postData from "../../../../lib/Axios";
import { exportToXLSX } from "../../../../component/exportXLSX/exportXLSX";
import { Footer, Header, addPageInfo } from "../../../../component/exportPDF/exportPDF";
import AdjustPrintMarginLaporan from "../../../component/adjustPrintMarginLaporan";
import { Dialog } from "primereact/dialog";
import PDFViewer from "../../../../component/PDFViewer";
import jsPDF from "jspdf";
import { InputText } from "primereact/inputtext";
import { Panel } from "primereact/panel";
import { RadioButton } from "primereact/radiobutton";

export async function getServerSideProps(context) {
    const sessionData = await getSessionServerSide(context, context.resolvedUrl);
    if (sessionData?.redirect) {
        return sessionData;
    }
    return {
        props: {},
    };
}

export default function LaporanExpired() {
    const apiEndPointGet = '/api/laporan/stock/expired/data';
    const toast = useRef(null);
    const [expired, setExpired] = useState([]);
    const [expiredTabel, setExpiredTabel] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [bulan, setBulan] = useState("");
    const [tahun, setTahun] = useState("");
    const [yearOptions, setYearOptions] = useState([]);
    const [first, setFirst] = useState(0); // Halaman pertama
    const [rows, setRows] = useState(10); // Jumlah baris per halaman
    const [adjustDialog, setAdjustDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filterDataOption, setFilterDataOption] = useState("");
    const [defaultOption, setDropdownValue] = useState(null);
    const [checked, setChecked] = useState(false);
    // PDF
    const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [orientation, setOrientation] = useState("portrait");
    const [selectedPaperSize, setSelectedPaperSize] = useState("A4");
    const [pdfUrl, setPdfUrl] = useState("");
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
        { name: "A4", value: "A4" },
        { name: "Letter", value: "Letter" },
        { name: "Legal", value: "Legal" },
    ]; // JSPDF
    const orientationOptions = [
        { label: "Potret", value: "portrait" },
        { label: "Lanskap", value: "landscape" },
    ]; // JSPDF
    const handlePaperSizeChange = (event) => {
        setSelectedPaperSize(event.target.value);
    }; // JSPDF
    const handleOrientationChange = (event) => {
        setOrientation(event.target.value);
    }; // JSPDF
    // JSPDF
    // PDF OLD
    const months = [
        { label: 'Januari', value: 1 },
        { label: 'Februari', value: 2 },
        { label: 'Maret', value: 3 },
        { label: 'April', value: 4 },
        { label: 'Mei', value: 5 },
        { label: 'Juni', value: 6 },
        { label: 'Juli', value: 7 },
        { label: 'Agustus', value: 8 },
        { label: 'September', value: 9 },
        { label: 'Oktober', value: 10 },
        { label: 'November', value: 11 },
        { label: 'Desember', value: 12 },
    ];

    const dropdownValues = [
        { name: "Kode", label: "se.Kode" },
        { name: "Barcode", label: "s.Barcode" },
        { name: "Nama", label: "s.Nama" }
    ];

    const jenisFilterValues = [
        { label: '<= 6 Bulan', value: 'B' },
        { label: '> 6 Bulan', value: 'U' }
    ];

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {},
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Mendapatkan tanggal hari ini
                const today = new Date();

                // Set tahun
                const currentYear = today.getFullYear();
                const years = Array.from({ length: 20 }, (_, index) => currentYear - index);
                const yearOptions = years.map((year) => ({ label: year.toString(), value: year }));
                setYearOptions(yearOptions);
                setTahun(currentYear);

                // Set bulan
                const currentMonth = today.getMonth() + 1;
                setBulan(currentMonth);

                setExpired({ ...expired, FilterData: "B" });

                loadLazyData(currentMonth, currentYear, "B");
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [lazyState]);

    const onPage = (event) => {
        setlazyState(event);
        setFirst(event.first); // Mengatur halaman saat halaman berubah
        setRows(event.rows); // Mengatur jumlah baris per halaman
    }

    const loadLazyData = async (bulan, tahun, filterData) => {
        setLoading(true);
        try {
            let requestBody = {
                ...lazyState,
                Bulan: bulan,
                Tahun: tahun,
                FilterData: filterData
            }
            console.log(requestBody);
            const vaTable = await postData(apiEndPointGet, requestBody);
            const json = vaTable.data;
            setTotalRecords(json.total_data);
            setExpiredTabel(json.data);
        } catch (error) {
            console.error("Error loading data:", error);
            setExpiredTabel([]);
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || "";
        let _data = { ...expired };
        _data[`${name}`] = val;
        setExpired(_data);
        if (name === "Bulan") {
            setBulan(val);
        }
        if (name === "Tahun") {
            const selectedYear = parseInt(val);
            setTahun(selectedYear);
        }
        if (name === "FilterData") {
            setChecked(true);
        }
    };

    //  Yang Handle Preview
    const btnAdjust = () => {
        if (expiredTabel.length == 0 || !expiredTabel) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        exportPDF(dataAdjust);
    }

    const exportPDF = async (dataAdjust) => {
        try {
            const expiredPDF = expiredTabel ? JSON.parse(JSON.stringify(expiredTabel)) : [];
            let format = "a4";
            if (selectedPaperSize === "Letter") {
                format = "letter";
            } else if (selectedPaperSize === "Legal") {
                format = "legal";
            }

            const marginLeftInMm = parseFloat(dataAdjust.marginLeft);
            const marginTopInMm = parseFloat(dataAdjust.marginTop);
            const marginRightInMm = parseFloat(dataAdjust.marginRight);
            const doc = new jsPDF({
                orientation,
                unit: "mm",
                format,
                left: marginLeftInMm,
                right: marginRightInMm,
                putOnlyUsedFonts: true
            });

            if (!expiredPDF || expiredPDF.length === 0) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(11);
                doc.text(
                    "Data Kosong",
                    doc.internal.pageSize.width / 2,
                    60 + marginTopInMm - 10,
                    { align: "center" }
                );
            }

            const userName = await getUserName(await getEmail());

            const judulLaporan = "Laporan Expired";
            const periodeLaporan = "Bulan : " + getNamaBulan(bulan) + " " + tahun;
            await Header({ doc, marginTopInMm, judulLaporan, periodeLaporan });

            const tableData = expiredPDF.map((item) => [
                item.No,
                item.Kode,
                item.KodeToko,
                item.Nama,
                formatDatePdf(item.Expired),
                parseInt(item.SisaStock).toLocaleString()
            ]);

            doc.autoTable({
                startY: 45 + marginTopInMm - 10,
                head: [[
                    "NO.",
                    "KODE",
                    "BARCODE",
                    "NAMA PRODUK",
                    "EXPIRED",
                    "SISA STOCK"
                ]],
                body: tableData,
                theme: "plain",
                margin: {
                    top: marginTopInMm,
                    left: marginLeftInMm,
                    right: marginRightInMm,
                },
                styles: {
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontSize: 8,
                },
                columnStyles: {
                    0: { halign: "center" },
                    1: { halign: "center" },
                    5: { halign: "right" }
                },
                headerStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: "bold",
                    halign: "center",
                },
                didDrawPage: (data) => {
                    addPageInfo(doc, userName, marginRightInMm);
                }
            });

            await Footer({ doc, marginLeftInMm, marginTopInMm, marginRightInMm });
            const pdfDataUrl = doc.output("datauristring");
            setPdfUrl(pdfDataUrl);
            setjsPdfPreviewOpen(true);
            setShowPreview(false);
        } catch (error) {
            console.log(error);
        }
    }

    // Yang Handle Excel
    const exportExcel = () => {
        exportToXLSX(expiredTabel, 'laporan-expired.xlsx')
    }

    // Yang Handle Search
    const headerSearch = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"></h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <div className="p-inputgroup" style={{ display: 'flex', alignItems: 'center' }}>
                    <Dropdown
                        id="Bulan"
                        name="Bulan"
                        value={bulan}
                        options={months}
                        placeholder="Pilih Bulan"
                        onChange={(e) => onInputChange(e, "Bulan")}
                        optionLabel="label"
                        optionValue="value"
                        style={{ width: '100%', borderRadius: '5px' }}
                    />
                    <Dropdown
                        id="Tahun"
                        name="Tahun"
                        value={tahun}
                        options={yearOptions}
                        onChange={(e) => onInputChange(e, "Tahun")}
                        placeholder="Pilih Tahun"
                        style={{ width: '100%', borderRadius: '5px' }}
                    />
                </div>
                <div className="p-inputgroup" style={{ display: "flex", alignItems: "center" }}>
                    <div className="col-2 mb-2 lg:col-5">
                        <RadioButton inputId="B" name="FilterData" value="B" checked={expired.FilterData === "B"} onChange={(e) => onInputChange(e, "FilterData")} />
                        <label htmlFor="B" className="ml-2 mr-4"> Hampir Expired </label>
                    </div>
                    <div className="col-2 mb-2 lg:col-5">
                        <RadioButton inputId="U" name="FilterData" value="U" checked={expired.FilterData === "U"} onChange={(e) => onInputChange(e, "FilterData")} />
                        <label htmlFor="U" className="ml-2"> Sudah Expired </label>
                    </div>
                    <Button label="" icon="pi pi-refresh" className="p-button-primary mr-2" onClick={loadLazyData} />
                </div>
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="name" placeholder="Filter" />
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => onSearch(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );

    const onSearch = (value) => {
        let _lazyState = { ...lazyState };
        _lazyState['filters'] = {};
        if (defaultOption != null && defaultOption.label != null) {
            _lazyState['filters'][defaultOption.label] = value;
        }
        onPage(_lazyState);
    };

    const rightToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Button
                    label="Refresh"
                    icon="pi pi-refresh"
                    className="p-button-danger mr-2 ml-2"
                    onClick={() => loadLazyData(bulan, tahun, expired.FilterData)}
                />
                <React.Fragment>
                    <div>
                        <Button label="Preview" icon="pi pi-file" className="p-button-success mr-2" onClick={btnAdjust} />
                    </div>
                </React.Fragment>
            </React.Fragment>
        );
    };

    const preview = () => {
        return (
            <React.Fragment>
                <div className="my-2">
                    <Button label="Preview" outlined className="p-button-secondary p-button-sm mr-2" onClick={btnAdjust} />
                </div>
            </React.Fragment>
        )
    }

    return (
        <div className="full-page">
            <div className="card">
                <h4>Laporan Expired</h4>
                <hr />
                <Toast ref={toast}></Toast>
                <DataTable
                    value={expiredTabel}
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
                    <Column field="No" header="NO"></Column>
                    <Column field="Kode" header="KODE"></Column>
                    <Column field="KodeToko" header="BARCODE"></Column>
                    <Column field="Nama" header="NAMA"></Column>
                    <Column field="Expired" body={(rowData) => formatDateTable(rowData.Expired)} header="EXPIRED"></Column>
                    <Column field="SisaStock"
                        body={(rowData) => {
                            const value = rowData.SisaStock ? parseInt(rowData.SisaStock).toLocaleString() : 0;
                            return value;
                        }}
                        header="SISA STOCK"></Column>
                </DataTable>
                <Toolbar className="mb-4" left={preview}></Toolbar>
            </div>
            <AdjustPrintMarginLaporan adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} excel={exportExcel}></AdjustPrintMarginLaporan>
            <Dialog visible={jsPdfPreviewOpen} onHide={() => setjsPdfPreviewOpen(false)} modal style={{ width: "90%", height: "100%" }} header="PDF Preview">
                <div className="p-dialog-content">
                    <PDFViewer pdfUrl={pdfUrl} />
                </div>
            </Dialog>
        </div>
    );
}

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
 * Created on Mon May 13 2024 - 04:33:50
 * Author : ARADHEA | aradheadhifa23@gmail.com
 * Version : 1.0
 */

import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Toolbar } from "primereact/toolbar";
import React, { useEffect, useRef, useState } from "react";

export default function AdjustPrintMarginExcel({ adjustDialog, setAdjustDialog, loadingPreview, excel }) {
    const [marginTop, setMarginTop] = useState(10);
    const [marginLeft, setMarginLeft] = useState(10);
    const [marginRight, setMarginRight] = useState(10);
    const [marginBottom, setMarginBottom] = useState(10);
    const [paperWidth, setPaperWidth] = useState(210);
    const [column, setColumn] = useState("3");
    const [orientation, setOrientation] = useState("portrait");
    const [selectedPaperSize, setSelectedPaperSize] = useState("A4");
    const [pdfUrl, setPdfUrl] = useState("");
    const paperSizes = [
        { name: "A4", value: "A4" },
        { name: "Letter", value: "Letter" },
        { name: "Legal", value: "Legal" },
    ];
    const orientationOptions = [
        { label: "Potrait", value: "portrait" },
        { label: "Lanskap", value: "landscape" },
    ];
    const handleOrientationChange = (event) => {
        setOrientation(event.target.value);
    };

    const handlePaperSizeChange = (event) => {
        setSelectedPaperSize(event.target.value);
    };
    const handleColumnChange = (event) => {
        setColumn(event.target.value);
    };
    function handleShowPreview() {
        setAdjustDialog(true);
    }

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {},
    });

    const op = useRef(null);
    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const [dataAdjust, setDataAdjust] = useState({ marginTop: 10, marginBottom: 10, marginRight: 10, marginLeft: 10, paperWidth: 210, betweenCells: 10, paddingTop: 5, selectedPaperSize: "A4" });
    const loadLazyData = async () => { };

    const onInputChange = (e, name) => {
        // const val = (e.target && e.target.value) || "";
        const val = e.value || 0;
        let _dataAdjust = { ...dataAdjust };
        _dataAdjust[name] = val;
        setDataAdjust(_dataAdjust);
        // console.log(status); // This will show the current value of status
    };
    const marginConfig = async () => {
        console.log(dataAdjust);
        // handleAdjust(dataAdjust);
        setAdjustDialog(false);
    };

    const footernya = () => {
        return (
            <React.Fragment>
                <div className="flex flex-row md:justify-between md:align-items-center">
                    <div className="flex flex-row" style={{ justifyContent: "flex-start" }}>
                        {/* <Button label="Export PDF" icon="pi pi-file" className="p-button-danger mr-2" onClick={marginConfig} /> */}
                        <Button label="Export Excel" icon="pi pi-file" className="p-button-success mr-2" onClick={excel} />
                    </div>
                </div>
            </React.Fragment>
        );
    };
    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <Dialog
                    visible={adjustDialog}
                    onHide={() => setAdjustDialog(false)}
                    header="Adjust Print Margin" // Ini adalah judul dialog
					style={{ width: "70%" }}
                >
                    {/* {loadingPreview ? (
                        // Tampilkan indikator loading jika masih dalam proses loading
                        <div>
                            <center>  <i
                                className="pi pi-spinner pi-spin"
                                style={{ fontSize: "6.5em", padding: "10px" }}
                            /></center>
                        </div>
                    ) : ( */}
                    <div>
                        <div className="grid">
                            <div className="col-12 md:col-8 lg:col-8">
                                <div className="card">
                                    <div className="grid">
                                        <div className="col-6 md:col-6 lg:col-6">
                                            <label htmlFor="rekening">Margin Atas</label>
                                            <div className="p-inputgroup" style={{ marginTop: "5px" }}>
                                                {/* <InputNumber id="marginTop" value={marginTop} onChange={(e) => setMarginTop(e.target.value)} min="0" step="0.1" /> */}
                                                <InputNumber id="marginTop" value={dataAdjust.marginTop} onChange={(e) => onInputChange(e, "marginTop")} min="0" />
                                                <span className="p-inputgroup-addon">mm</span>
                                            </div>
                                        </div>
                                        <div className="col-6 md:col-6 lg:col-6">
                                            <label htmlFor="rekening">Margin Bawah</label>
                                            <div className="p-inputgroup" style={{ marginTop: "5px" }}>
                                                {/* <InputNumber id="marginBottom" value={marginBottom} onChange={(e) => setMarginBottom(e.target.value)} min="0" step="0.1" /> */}
                                                <InputNumber id="marginBottom" value={dataAdjust.marginBottom} onChange={(e) => onInputChange(e, "marginBottom")} min="0" />
                                                <span className="p-inputgroup-addon">mm</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid">
                                        <div className="col-6 md:col-6 lg:col-6">
                                            <label htmlFor="rekening">Margin Kanan</label>
                                            <div className="p-inputgroup" style={{ marginTop: "5px" }}>
                                                {/* <InputNumber id="marginRight" value={marginRight} onChange={(e) => setMarginRight(e.target.value)} min="0" step="0.1" /> */}
                                                <InputNumber id="marginRight" value={dataAdjust.marginRight} onChange={(e) => onInputChange(e, "marginRight")} min="0" />
                                                <span className="p-inputgroup-addon">mm</span>
                                            </div>
                                        </div>
                                        <div className="col-6 md:col-6 lg:col-6">
                                            <label htmlFor="rekening">Margin Kiri</label>
                                            <div className="p-inputgroup" style={{ marginTop: "5px" }}>
                                                {/* <InputNumber id="marginLeft" value={marginLeft} onChange={(e) => setMarginLeft(e.target.value)} min="0" step="0.1" /> */}
                                                <InputNumber id="marginLeft" value={dataAdjust.marginLeft} onChange={(e) => onInputChange(e, "marginLeft")} min="0" />
                                                <span className="p-inputgroup-addon">mm</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-12 md:col-4 lg:col-4">
                                <div className="card">
                                    <div className="grid">
                                        <div className="col-6 md:col-12 lg:col-12">
                                            <label htmlFor="rekening">Ukuran Kertas</label>
                                            <div className="p-inputgroup" style={{ "marginTop": "5px" }}>
                                                <Dropdown id="paperSize" value={selectedPaperSize} options={paperSizes} onChange={handlePaperSizeChange} optionLabel="name" />
                                            </div>
                                        </div>
                                        <div className="col-6 md:col-12 lg:col-12">
                                            <label htmlFor="rekening">Orientasi</label>
                                            <div className="p-inputgroup" style={{ "marginTop": "5px" }}>
                                                <Dropdown id="orientation" value={orientation} options={orientationOptions} onChange={handleOrientationChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Toolbar className="mb-4" right={footernya}></Toolbar>
                    </div>
                    {/* )} */}
                </Dialog>
            </div>
        </div>
    );
}

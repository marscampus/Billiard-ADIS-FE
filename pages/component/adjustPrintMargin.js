import axios from "axios";
import getConfig from "next/config";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { FileUpload } from "primereact/fileupload";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { RadioButton } from "primereact/radiobutton";
import { Toast } from "primereact/toast";
import { Toolbar } from "primereact/toolbar";
import { classNames } from "primereact/utils";
import React, { useEffect, useRef, useState } from "react";
import { OverlayPanel } from "primereact/overlaypanel";
import { TabView, TabPanel } from "primereact/tabview";
import { Skeleton } from "primereact/skeleton";
import TabelSkaleton from "../../component/tabel/skaleton";
import { Paginator } from "primereact/paginator";
import { BreadCrumb } from "primereact/breadcrumb";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import postData from "../../lib/Axios";

export default function AdjustPrintMargin({ adjustDialog, setAdjustDialog, handleAdjust }) {
	// --------------------------------------------------------------------------------------------------- Export
	const [jsPdfPreviewOpen, setjsPdfPreviewOpen] = useState(false);
	const [loadingPreview, setLoadingPreview] = useState(true);
	const [marginTop, setMarginTop] = useState(10);
	const [marginLeft, setMarginLeft] = useState(10);
	const [marginRight, setMarginRight] = useState(10);
	const [marginBottom, setMarginBottom] = useState(10);
	const [paperWidth, setPaperWidth] = useState(210);
	const [column, setColumn] = useState("3");
	const [selectedPaperSize, setSelectedPaperSize] = useState("A4");
	const [pdfUrl, setPdfUrl] = useState("");
	const paperSizes = [
		{ name: "A4", value: "A4" },
		{ name: "Letter", value: "Letter" },
		{ name: "Legal", value: "Legal" },
	];
	const columnOptions = [
		{ label: "1", value: "1" },
		{ label: "2", value: "2" },
		{ label: "3", value: "3" },
	];
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

	const [dataAdjust, setDataAdjust] = useState({ marginTop: 10, marginBottom: 10, marginRight: 10, marginLeft: 10, paperWidth: 210, betweenCells: 10, fontNama: 10, fontKode: 8, paddingTop: 5, paddingLeft: 5, imgHeight: 14 });
	const loadLazyData = async () => {};

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
		handleAdjust(dataAdjust);
		setAdjustDialog(false);
	};

	const footernya = () => {
		return (
			<React.Fragment>
				<div className="flex flex-row md:justify-between md:align-items-center">
					<div className="flex flex-row" style={{ justifyContent: "flex-start" }}>
						<Button label="Cetak" icon="pi pi-file" className="p-button-danger mr-2" onClick={marginConfig} />
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
					style={{ width: "75%" }}
				>
					{/* {loadingPreview ? (
						// Tampilkan indikator loading jika masih dalam proses loading
						<div>
							<center>
								{" "}
								<i className="pi pi-spinner pi-spin" style={{ fontSize: "6.5em", padding: "10px" }} />
							</center>
						</div>
					) : ( */}
					<div>
						<div class="grid">
							<div class="col-12 md:col-8 lg:col-8">
								<div className="card">
									<div class="grid">
										<div class="col-6 md:col-6 lg:col-6">
											<label htmlFor="rekening">Margin Atas</label>
											<div className="p-inputgroup" style={{ marginTop: "5px" }}>
												{/* <InputNumber id="marginTop" value={marginTop} onChange={(e) => setMarginTop(e.target.value)} min="0" step="0.1" /> */}
												<InputNumber id="marginTop" value={dataAdjust.marginTop} onChange={(e) => onInputChange(e, "marginTop")} min="0" />
												<span className="p-inputgroup-addon">mm</span>
											</div>
										</div>
										<div class="col-6 md:col-6 lg:col-6">
											<label htmlFor="rekening">Margin Bawah</label>
											<div className="p-inputgroup" style={{ marginTop: "5px" }}>
												{/* <InputNumber id="marginBottom" value={marginBottom} onChange={(e) => setMarginBottom(e.target.value)} min="0" step="0.1" /> */}
												<InputNumber id="marginBottom" value={dataAdjust.marginBottom} onChange={(e) => onInputChange(e, "marginBottom")} min="0" />
												<span className="p-inputgroup-addon">mm</span>
											</div>
										</div>
									</div>
									<div class="grid">
										<div class="col-6 md:col-6 lg:col-6">
											<label htmlFor="rekening">Margin Kanan</label>
											<div className="p-inputgroup" style={{ marginTop: "5px" }}>
												{/* <InputNumber id="marginRight" value={marginRight} onChange={(e) => setMarginRight(e.target.value)} min="0" step="0.1" /> */}
												<InputNumber id="marginRight" value={dataAdjust.marginRight} onChange={(e) => onInputChange(e, "marginRight")} min="0" />
												<span className="p-inputgroup-addon">mm</span>
											</div>
										</div>
										<div class="col-6 md:col-6 lg:col-6">
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
							<div class="col-12 md:col-4 lg:col-4">
								<div className="card">
									<div class="grid">
										<div class="col-6 md:col-12 lg:col-12">
											<label htmlFor="rekening">Lebar Kertas</label>
											<div className="p-inputgroup" style={{ marginTop: "5px" }}>
												{/* <InputNumber id="paperWidth" value={paperWidth} onChange={(e) => setPaperWidth(e.target.value)} min="0" step="0.1" /> */}
												<InputNumber id="paperWidth" value={dataAdjust.paperWidth} onChange={(e) => onInputChange(e, "paperWidth")} min="0" />
												<span className="p-inputgroup-addon">mm</span>
											</div>
										</div>
										<div class="col-6 md:col-12 lg:col-12">
											<label htmlFor="rekening">Jarak Antar Cell</label>
											<div className="p-inputgroup" style={{ marginTop: "5px" }}>
												<InputNumber id="betweenCells" value={dataAdjust.betweenCells} onChange={(e) => onInputChange(e, "betweenCells")} min="0" />
												<span className="p-inputgroup-addon">mm</span>
											</div>
										</div>
										{/* <div class="col-12 md:col-12 lg:col-12">
                                                <label htmlFor="rekening">Jumlah Kolom</label>
                                                <div className="p-inputgroup" style={{ "marginTop": "5px" }}>
                                                    <Dropdown id="column" value={column} options={columnOptions} onChange={handleColumnChange} />
                                                </div>
                                            </div> */}
									</div>
								</div>
							</div>
						</div>
						<div className="card">
							<div class="grid">
								<div class="col-12 md:col-4 lg:col-4">
									<div class="grid">
										<div class="col-6 md:col-6 lg:col-6">
											<label htmlFor="rekening">Font Produk</label>
											<div className="p-inputgroup" style={{ marginTop: "5px" }}>
												<InputNumber id="marginTop" value={dataAdjust.fontNama} onChange={(e) => onInputChange(e, "fontNama")} min="0" />
												<span className="p-inputgroup-addon">pt</span>
											</div>
										</div>
										<div class="col-6 md:col-6 lg:col-6">
											<label htmlFor="rekening">Font Kode</label>
											<div className="p-inputgroup" style={{ marginTop: "5px" }}>
												<InputNumber id="marginTop" value={dataAdjust.fontKode} onChange={(e) => onInputChange(e, "fontKode")} min="0" />
												<span className="p-inputgroup-addon">pt</span>
											</div>
										</div>
									</div>
								</div>
								<div class="col-12 md:col-8 lg:col-8">
									<div class="grid">
                                        <div class="col-12 md:col-4 lg:col-4">
                                            <label htmlFor="rekening">Tinggi Barcode</label>
                                            <div className="p-inputgroup" style={{ marginTop: "5px" }}>
                                                <InputNumber id="imgHeight" value={dataAdjust.imgHeight} onChange={(e) => onInputChange(e, "imgHeight")} min="0" />
                                                <span className="p-inputgroup-addon">mm</span>
                                            </div>
                                        </div>
                                        <div class="col-6 md:col-4 lg:col-4">
                                            <label htmlFor="rekening">Padding Cell Atas</label>
                                            <div className="p-inputgroup" style={{ marginTop: "5px" }}>
                                                <InputNumber id="paddingTop" value={dataAdjust.paddingTop} onChange={(e) => onInputChange(e, "paddingTop")} min="0" />
                                                <span className="p-inputgroup-addon">mm</span>
                                            </div>
                                        </div>
                                        <div class="col-6 md:col-4 lg:col-4">
                                            <label htmlFor="rekening">Padding Cell Kiri</label>
                                            <div className="p-inputgroup" style={{ marginTop: "5px" }}>
                                                <InputNumber id="paddingLeft" value={dataAdjust.paddingLeft} onChange={(e) => onInputChange(e, "paddingLeft")} min="0" />
                                                <span className="p-inputgroup-addon">mm</span>
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

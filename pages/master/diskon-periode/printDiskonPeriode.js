import jsPDF from 'jspdf';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { formatDate, formatRibuan, showError } from '../../../component/GeneralFunction/GeneralFunction';
import postData from '../../../lib/Axios';
import AdjustPrintPriceTagMargin from '../../component/adjustPrintPriceTagMargin';
import DiskonPeriode from '../../component/diskonPeriode';

export default function PrintBarcode({ printBarcodeDialog, hideBarcodePrintDialog, deletePrintBarcodeDialog, setDeletePrintBarcodeDialog, printBarcode, setPrintBarcode }) {
    const apiEndPointGetDataDiskonPeriode = '/api/diskon_periode/get_bykode';

    const [totalRecords, setTotalRecords] = useState(0);
    const [loadingPrintBarcode, setLoadingPrintBarcode] = useState(false);
    const [printBarcodeTabel, setPrintBarcodeTabel] = useState([]);
    const [defaultOption, setDropdownValue] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: null,
        sortOrder: null,
        filters: {}
    });

    const toast = useRef(null);
    const op = useRef(null);
    const onPage = (event) => {
        setlazyState(event);
    };

    useEffect(() => {
        // loadLazyData();
    }, [lazyState]);

    // useEffect(() => {
    //     generateBarcode(printBarcodeTabel);
    // }, [printBarcodeTabel]);

    const onInputChange = (e, name) => {
        const val = (e.target && e.target.value) || e.value;
        let _data = { ...printBarcode };
        _data[`${name}`] = val;
        setPrintBarcode(_data);
    };
    // -----------------------------------------------------------------------------------------------------------------< PrintBarcode >
    const dropdownValues = [
        { name: 'KODE', label: 'KODE' },
        { name: 'KETERANGAN', label: 'KETERANGAN' }
    ];
    const inputChanged = (e) => {
        clearTimeout(timer);

        const newTimer = setTimeout(() => {
            let _lazyState = { ...lazyState };
            console.log('_lazyState[]', _lazyState['filters']);

            _lazyState['filters'] = { ...lazyState.filters }; // Copy existing filters
            // if (selectedSesi) {
            //     // Add selectedSesi to filters if available
            //     _lazyState.filters["selectedSesi"] = selectedSesi;
            // }
            if (defaultOption != null && defaultOption.name != null) {
                _lazyState['filters'][defaultOption.name] = e;
            }
            onPage(_lazyState);
        }, 500);

        setTimer(newTimer);
    };
    // ---------------------------------------------------------------------------------------------< Search Barcode by inputan (enter) >
    const [timer, setTimer] = useState(null);
    const handleBarcodeKeyDown = async (event) => {
        clearTimeout(timer);
        const newTimer = setTimeout(async () => {
            if (event.key === 'Enter') {
                const barcodeInput = document.getElementById('KODE_TOKO');
                const enteredBarcode = barcodeInput.value;
                // console.log('enteredBarcode',enteredBarcode);
                // return;
                if (enteredBarcode.trim() === '') {
                    return;
                }

                // Periksa apakah barcode yang dimasukkan mencakup kuantitas
                const barcodeDanQty = enteredBarcode.split('*');
                let enteredQty = 1;
                let enteredBarcodeValue = enteredBarcode;

                if (barcodeDanQty.length === 2) {
                    enteredQty = parseFloat(barcodeDanQty[0]);
                    enteredBarcodeValue = barcodeDanQty[1];
                }

                const params = { data: { KODE_TOKO: enteredBarcodeValue }, skipSelectBarcode: true, JUMLAH: enteredQty };
                console.log(params.JUMLAH);
                await handleDiskonPeriodeData(params);

                // barcodeInput.value = "";
            }
        }, 100);
        setTimer(newTimer);
    };
    // -----------------------------------------------------------------------------------------------------------------< Adjust Print Margin >
    const [adjustDialog, setAdjustDialog] = useState(false);
    const btnAdjust = () => {
        console.log(printBarcodeTabel);
        if (printBarcodeTabel.length == 0 || !printBarcodeTabel) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Tabel Masih Kosong', life: 3000 });
            return;
        }
        setAdjustDialog(true);
    };

    const handleAdjust = async (dataAdjust) => {
        cetakBarcode(dataAdjust);
        // setDataAdjust(data);
    };
    // -----------------------------------------------------------------------------------------------------------------< PRODUK / BARCODE >
    const [diskonPeriodeDialog, setDiskonPeriodeDialog] = useState(false);
    const [dataDiskonPeriode, setDataDiskonPeriode] = useState('');
    const btnDiskonPeriode = () => {
        setDiskonPeriodeDialog(true);
    };

    const handleDiskonPeriodeData = async (params) => {
        console.log('params', params);
        try {
            const vaTable = await postData(apiEndPointGetDataDiskonPeriode, { KODE: params });
            const json = vaTable.data.data;
            
            setDataDiskonPeriode(json);
            setPrintBarcode((prevPrintBarcode) => ({
                ...prevPrintBarcode,
                KODE_TOKO: json[0].BARCODE,
                KODE: json[0].KODE,
                NAMA: json[0].NAMA,
                TGL_MULAI: json[0].TGL_MULAI,
                TGL_AKHIR: json[0].TGL_AKHIR,
                HJ_AWAL: json[0].HJ_AWAL,
                HJ_DISKON: json[0].HJ_DISKON,
                KUOTA_QTY: json[0].KUOTA_QTY,
                JUMLAH: params[0].JUMLAH || 1
                // TGLPERUBAHANHJ: json[0].TGLPERUBAHANHJ || formatDateSave(new Date())
            }));
        } catch (error) {
            const e = error?.response?.data || error;
            showError(toast, e?.message || 'Terjadi Kesalahan');
        }
    };
    const tambahData = async (e) => {
        if (!printBarcode.KODE_TOKO) {
            toast.current.show({ severity: 'error', summary: 'Error Message', detail: 'Barcode Masih Kosong', life: 3000 });
            return;
        }
        e.preventDefault();
        setNull();
        const enteredQty = printBarcode.JUMLAH || 1;
        const valBarcode = dataDiskonPeriode[0].BARCODE;
        console.log('dataDiskonPeriode ya', dataDiskonPeriode);

        const existingIndex = printBarcodeTabel.findIndex((item) => item.KODE_TOKO === valBarcode);
        if (existingIndex !== -1) {
            // -----------------------------------------< Sudah Ada >
            setPrintBarcodeTabel((prevPrintBarcodeTabel) => {
                const updatedData = [...prevPrintBarcodeTabel];
                const addedData = updatedData[existingIndex];
                const updatedJumlah = parseInt(addedData.JUMLAH) + enteredQty;
                updatedData[existingIndex] = {
                    ...addedData,
                    JUMLAH: updatedJumlah
                    // TGLPERUBAHANHJ: addedData.TGLPERUBAHANHJ || formatDateSave(new Date())
                };
                return updatedData;
            });
        } else {
            // -----------------------------------------< Belum Ada >
            const addedData = dataDiskonPeriode[0];
            const jsonWithDefaultQty = dataDiskonPeriode.map((item) => ({ ...item, JUMLAH: enteredQty, KODE_TOKO: addedData.BARCODE }));
            setPrintBarcodeTabel((prevPrintBarcodeTabel) => [...prevPrintBarcodeTabel, { ...addedData, JUMLAH: enteredQty, KODE_TOKO: addedData.BARCODE }, ...jsonWithDefaultQty.slice(1)]);
        }
    };

    const cetakBarcode = (dataAdjust) => {
        // Membuat instance dari jsPDF
        const pdf = new jsPDF('p', 'mm', [dataAdjust.paperWidth, Infinity]);

        // Mengatur lebar dan tinggi setiap kolom
        const kolomWidth = 50; // lebar kolom
        const kolomHeight = 25; // tinggi kolom

        // Mengatur jarak antar kolom dan baris
        const jarakKolom = 0;
        const jarakBaris = 0;

        // Mengatur padding dalam kolom
        const padding = 2;

        // Mengatur posisi awal cetakan
        let x = 5;
        let y = 10;

        // Variabel untuk melacak kolom dan baris
        let kolomIndex = 0;
        let barisIndex = 0;

        // Tentukan jumlah maksimum kolom yang tetap yaitu 4
        const maxKolom = 4;

        // Loop untuk setiap data
        printBarcodeTabel.forEach((item, index) => {
            console.log('item', item);
            // Menentukan berapa kali data akan dicetak berdasarkan nilai JUMLAH
            for (let i = 0; i < item.JUMLAH; i++) {
                const { KODE_TOKO } = item;
                const text = `${KODE_TOKO}`;

                // Menghitung posisi x dan y untuk kolom saat ini
                const posX = x + kolomIndex * (kolomWidth + jarakKolom);
                const posY = y + barisIndex * (kolomHeight + jarakBaris);

                // Menambahkan background kuning pada kolom
                // pdf.setFillColor(242, 243, 209); // Set fill color to yellow
                pdf.setFillColor('#fffacd');
                pdf.rect(posX, posY, kolomWidth, kolomHeight, 'f'); // Fill the rectangle with the specified color

                // Menambahkan border hitam di sekitar kolom
                pdf.setLineWidth(0.5); // Mengatur ketebalan garis border
                pdf.setDrawColor(0, 0, 0); // Mengatur warna border menjadi hitam
                pdf.rect(posX, posY, kolomWidth, kolomHeight);

                // Menambahkan data ke PDF dengan padding
                pdf.setFontSize(10);
                const nama = item.NAMA.length > 15 ? item.NAMA.substring(0, 15) + '...' : item.NAMA;
                pdf.text(nama, posX + padding, posY + 4 + padding);
                pdf.setFontSize(8);
                pdf.text(`${item.KODE_TOKO}`, posX + padding, posY + 8 + padding);
                pdf.setFontSize(16);
                pdf.text(`Rp. ${item.HJ_DISKON.toLocaleString()}`, posX + padding, posY + 14 + padding);
                pdf.setFontSize(8);
                pdf.text(`${formatDate(item.TGL_MULAI)} - ${formatDate(item.TGL_AKHIR)}`, posX + padding, posY + 18 + padding);

                // Pindah ke kolom berikutnya atau baris berikutnya jika sudah mencapai batas kolom
                kolomIndex++;
                if (kolomIndex >= maxKolom) {
                    kolomIndex = 0;
                    barisIndex++;
                }
            }
        });

        // Mendapatkan data URL dokumen PDF
        const pdfDataUrl = pdf.output('datauristring');
        // Membuka jendela baru untuk menampilkan pratinjau dokumen PDF
        const printWindow = window.open(pdfDataUrl);
        // Mencetak dokumen PDF
        printWindow.print();
    };

    
    const headerPrintBarcode = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <h5 className="m-0"> </h5>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                <Dropdown value={defaultOption} onChange={(e) => setDropdownValue(e.value)} options={dropdownValues} optionLabel="label" placeholder="Pilih Kolom" />
                &nbsp;
                <span className="block mt-2 md:mt-0 p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText type="search" onInput={(e) => inputChanged(e.target.value)} placeholder="Search..." />
                </span>
            </div>
        </div>
    );
    const barcodePrintDialogFooter = (
        <>
            <Button label="Batal" icon="pi pi-times" className="p-button-text" onClick={hideBarcodePrintDialog} />
            <Button label="Cetak" icon="pi pi-check" className="p-button-text" onClick={btnAdjust} />
            {/* onClick={savePrintBarcode} cetakBarcode */}
        </>
    );

    const textEditor = (options) => {
        return <InputText type="number" step="any" value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    const onCellEditComplete = (e) => {
        let { rowData, newValue, field, originalEvent: event } = e;
        // --- Kondisi edit field TERIMA, melakukan perhitungan TERIMA * HARGA
        switch (field) {
            case 'JUMLAH':
                const existingIndex2 = printBarcodeTabel.findIndex((item) => item.KODE === rowData.KODE);
                if (existingIndex2 !== -1) {
                    const updatedAddData = [...printBarcodeTabel];
                    updatedAddData[existingIndex2] = {
                        ...updatedAddData[existingIndex2],
                        JUMLAH: newValue
                    };
                    setPrintBarcodeTabel(updatedAddData);
                }
                break;
            default:
                event.preventDefault();
                break;
        }
    };

    const setNull = () => {
        console.log('masuk setNull', printBarcode);
        setPrintBarcode({
            KODE_TOKO: '',
            KODE: '',
            NAMA: '',
            TGL_MULAI: '',
            TGL_AKHIR: '',
            HJ_AWAL: '',
            HJ_DISKON: '',
            KUOTA_QTY: '',
            JUMLAH: ''
        });
    };

    const deleteSelectedRow = (rowData) => {
        const updatedData = printBarcodeTabel.filter((row) => row !== rowData);
        setPrintBarcodeTabel(updatedData);
    };
    const actionBodyTabel = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" style={{ backgroundColor: '#ca656f', border: '1px solid #ca656f' }} className="p-button-danger p-button p-button-sm mr-2" onClick={() => deleteSelectedRow(rowData)} />
            </>
        );
    };
    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <Toast ref={toast} />
                {/* Dialog Print Barcode */}
                <Dialog visible={printBarcodeDialog} style={{ width: '75%' }} header="Print Diskon Periode" modal className="p-fluid" footer={barcodePrintDialogFooter} onHide={hideBarcodePrintDialog}>
                    <div className="formgrid grid">
                        <div id="barcodeContainer"></div>
                        <div className="field col-6 mb-2 lg:col-3">
                            <label htmlFor="barcode">Barcode</label>
                            <div className="p-inputgroup">
                                {/* value={printBarcode.KODE_TOKO} onChange={(e) => onInputChange(e, "KODE_TOKO")}  */}
                                <InputText id="KODE_TOKO" onKeyDown={handleBarcodeKeyDown} value={printBarcode?.KODE_TOKO} onChange={(e) => onInputChange(e, 'KODE_TOKO')} />
                                <Button icon="pi pi-search" className="p-button" onClick={btnDiskonPeriode} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-3">
                            <label htmlFor="nama">Kode</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={printBarcode?.KODE} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <label htmlFor="nama">Nama Produk</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={printBarcode?.NAMA} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-3">
                            <label htmlFor="nama">Harga Awal</label>
                            <div className="p-inputgroup">
                                <InputNumber readOnly value={printBarcode?.HJ_AWAL} inputStyle={{ textAlign: 'right' }} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-3">
                            <label htmlFor="jumlah">Harga Diskon</label>
                            <div className="p-inputgroup">
                                <InputNumber value={printBarcode?.HJ_DISKON} readOnly inputStyle={{ textAlign: 'right' }} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-3">
                            <label htmlFor="nama">Tanggal Mulai</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={printBarcode?.TGL_MULAI} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-3">
                            <label htmlFor="jumlah">Tanggal Berakhir</label>
                            <div className="p-inputgroup">
                                <InputText readOnly value={printBarcode?.TGL_AKHIR} />
                            </div>
                        </div>
                        <div className="field col-6 mb-2 lg:col-6">
                            <div className="formgrid grid">
                                <div className="field col-6 mb-2 lg:col-3">
                                    <label htmlFor="jumlah">Kuota Diskon</label>
                                    <div className="p-inputgroup">
                                        <InputNumber readOnly value={printBarcode?.KUOTA_QTY} onChange={(e) => onInputChange(e, 'KUOTA_QTY')} inputStyle={{ textAlign: 'center' }} />
                                    </div>
                                </div>
                                <div className="field col-6 mb-2 lg:col-3">
                                    <label htmlFor="jumlah">Jumlah</label>
                                    <div className="p-inputgroup">
                                        <InputNumber value={printBarcode?.JUMLAH} onChange={(e) => onInputChange(e, 'JUMLAH')} inputStyle={{ textAlign: 'center' }} />
                                    </div>
                                </div>
                                <div className="field col-12 mb-2 lg:col-6">
                                    <label className="mt-3"></label>
                                    <div className="p-inputgroup">
                                        <Button label="Tambah" className="p-button-md mr-2 w-full" onClick={tambahData} inputStyle={{ textAlign: 'center' }} autoFocus />
                                        {/* <Button label="Hapus" className="p-button-sm mr-2 mt-1" onClick={deletePrintBarcode} /> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <DataTable
                        value={printBarcodeTabel}
                        size="small"
                        lazy
                        rows={10}
                        className="datatable-responsive"
                        first={lazyState.first}
                        totalRecords={totalRecords}
                        onPage={onPage}
                        scrollable // Mengaktifkan scrolling
                        scrollHeight="250px"
                        // onRowSelect={onRowSelectPriceTagList}
                        // selectionMode="single" // Memungkinkan pemilihan satu baris
                    >
                        <Column headerStyle={{ textAlign: 'center' }} field="KODE" header="KODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="BARCODE" header="BARCODE"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="NAMA" header="NAMA"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL_MULAI" header="TGL_MULAI"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="TGL_AKHIR" header="TGL_AKHIR"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="HJ_AWAL" bodyStyle={{ textAlign: 'right' }} body={(rowData) => formatRibuan(rowData.HJ_AWAL)} header="HJ_AWAL"></Column>
                        <Column headerStyle={{ textAlign: 'center' }} field="HJ_DISKON" bodyStyle={{ textAlign: 'right' }} body={(rowData) => formatRibuan(rowData.HJ_DISKON)} header="HJ_DISKON"></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} field="DISKON" header="DISKON"></Column> */}
                        <Column headerStyle={{ textAlign: 'center' }} field="KUOTA_QTY" header="KUOTA_QTY"></Column>
                        {/* <Column headerStyle={{ textAlign: "center" }} field="STATUS" header="STATUS"></Column> */}
                        {/* <Column headerStyle={{ textAlign: "center" }} field="NAMA" header="NAMA"></Column> */}
                        <Column headerStyle={{ textAlign: 'center' }} field="JUMLAH" header="JUMLAH" editor={(options) => textEditor(options)} onCellEditComplete={onCellEditComplete} bodyStyle={{ textAlign: 'center' }}></Column>
                        <Column headerStyle={{ textAlign: 'center' }} header="ACTION" body={actionBodyTabel} bodyStyle={{ textAlign: 'center' }}></Column>
                    </DataTable>
                </Dialog>
                {/* Dialog Delete Barcode Dialog */}
                <Dialog visible={deletePrintBarcodeDialog} header="Confirm" modal footer={barcodePrintDialogFooter} onHide={() => setDeletePrintBarcodeDialog(false)}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>
                            are you sure you want to delete <strong>{printBarcode?.KODE}</strong>
                        </span>
                    </div>
                </Dialog>
                <DiskonPeriode diskonPeriodeDialog={diskonPeriodeDialog} setDiskonPeriodeDialog={setDiskonPeriodeDialog} btnDiskonPeriode={btnDiskonPeriode} handleDiskonPeriodeData={handleDiskonPeriodeData} />
                <AdjustPrintPriceTagMargin adjustDialog={adjustDialog} setAdjustDialog={setAdjustDialog} btnAdjust={btnAdjust} handleAdjust={handleAdjust} />
            </div>
        </div>
    );
}
